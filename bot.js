import 'dotenv/config'
import Parser from 'rss-parser'
import { TwitterApi } from 'twitter-api-v2'
import OpenAI from 'openai'

const parser = new Parser()

const client = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET
})

let lastPosted = ''

// Optional OpenAI client (used to rephrase headlines)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

async function fetchNews() {
  const feed = await parser.parseURL('https://news.google.com/rss/search?q=crypto&hl=en-US&gl=US&ceid=US:en')
  const item = feed.items[0]
  // console.log('Fetched:', item)
  return item
}

async function run() {
  try {
    const news = await fetchNews()
    if (!news) return

    // Clean source suffix like " - Yahoo Finance"
    const title = (news.title || '').split(' - ')[0]

    // Skip if same as last posted (based on cleaned title)
    if (title === lastPosted) return

    const post = await craftTweet(title)
    await client.v2.tweet(post)

    lastPosted = title
    console.log('Posted:', post)
  } catch (e) {
    console.log('Error:', e)
  }
}

run()
setInterval(run, 85 * 60_000)

// Helpers
function truncateTo(input, max) {
  if (input.length <= max) return input
  return input.slice(0, max - 1) + '…'
}

async function craftTweet(title) {
  const prefix = 'Check that out: '
  const base = `${prefix}${title}`

  // If no OpenAI key, just return base within 280 chars
  if (!openai) return truncateTo(base, 280)

  try {
    // Ask the model to paraphrase while keeping meaning and under limit
    const maxBody = 280 // We'll enforce after generation too
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You rephrase news headlines for X/Twitter. Keep the meaning, be concise, no emojis, no hashtags, no quotes, no links. Return only the rewritten headline, <= 240 characters.' },
        { role: 'user', content: `Rephrase this headline for a tweet: ${title}` }
      ]
    })

    const rewritten = (res.choices?.[0]?.message?.content || title).trim()
    return truncateTo(`${prefix}${rewritten}`, maxBody)
  } catch (_) {
    // Fallback: small variation to avoid duplicate rejection
    const time = new Date().toISOString().slice(11, 19) // HH:MM:SS
    return truncateTo(`${prefix}${title} · ${time}`, 280)
  }
}
