import 'dotenv/config'
import Parser from 'rss-parser'
import { TwitterApi } from 'twitter-api-v2'
import OpenAI from 'openai'

const parser = new Parser()

// Initialize Twitter client only if credentials are provided
let client = null
try {
  if (process.env.API_KEY && process.env.API_SECRET && process.env.ACCESS_TOKEN && process.env.ACCESS_SECRET) {
    client = new TwitterApi({
      appKey: process.env.API_KEY,
      appSecret: process.env.API_SECRET,
      accessToken: process.env.ACCESS_TOKEN,
      accessSecret: process.env.ACCESS_SECRET
    })
    console.log('✅ Twitter client initialized')
  } else {
    console.log('⚠️  Twitter credentials not found - bot will not post')
  }
} catch (error) {
  console.error('❌ Failed to initialize Twitter client:', error.message)
}

let lastPosted = ''

// Optional OpenAI client (used to rephrase headlines)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const pickNewsAPIKey = () => {
  const items = (process.env.PICKNEWS_API_KEY || '').split(',').map(s => s.trim()).filter(Boolean)
  const picked = items[Math.floor(Math.random() * items.length)]
  console.log('Picked News API Key:', picked)
  return picked
}

async function fetchNews() {
  const feed = await parser.parseURL(pickNewsAPIKey())
  const item = feed.items[0]
  console.log('Fetched:', item)
  return item
}

async function run() {
  try {
    // Skip if Twitter client is not initialized
    if (!client) {
      console.log('⚠️  Skipping run - Twitter client not initialized')
      return
    }

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

// Start the bot - first run after 30 seconds, then every 8 hours
console.log('🚀 Bot initialized - first run in 30 seconds')
setTimeout(run, 30_000)
setInterval(run, 480 * 60_000)

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
