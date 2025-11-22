# Twitter News Bot 🤖📰

A Node.js bot that automatically fetches news from RSS feeds and posts them to Twitter/X. The bot can optionally use OpenAI to rephrase headlines for better engagement.

## Features

- 📡 Fetches news from RSS feeds
- 🐦 Automatically posts to Twitter/X
- 🤖 Optional OpenAI integration for headline rephrasing
- 🌐 Web service with health check endpoints
- ⏰ Runs every 8 hours
- 🔄 Supports multiple RSS feeds (random selection)

## Prerequisites

- Node.js 18+ 
- Twitter Developer Account with API credentials
- RSS feed URL(s)
- (Optional) OpenAI API key for headline rephrasing

## Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Typhoon1612/twitter_news_bot.git
   cd twitter_news_bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your actual values:
   - `API_KEY`, `API_SECRET`, `ACCESS_TOKEN`, `ACCESS_SECRET` - Get these from [Twitter Developer Portal](https://developer.twitter.com/)
   - `PICKNEWS_API_KEY` - Your RSS feed URL(s), comma-separated for multiple feeds
   - `OPENAI_API_KEY` - (Optional) Get from [OpenAI Platform](https://platform.openai.com/)

4. **Run the bot**
   ```bash
   npm start
   ```

The bot will start a web server on port 3000 and begin fetching/posting news every 8 hours.

## Deploying to Render

### Option 1: Deploy as Web Service (Recommended)

This keeps your bot running 24/7 with health monitoring.

1. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service**
   - **Name**: `twitter-news-bot` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Choose based on your needs (Free tier works fine)

3. **Add Environment Variables**
   
   In the Render dashboard, add these environment variables:
   - `API_KEY` - Your Twitter API key
   - `API_SECRET` - Your Twitter API secret
   - `ACCESS_TOKEN` - Your Twitter access token
   - `ACCESS_SECRET` - Your Twitter access secret
   - `PICKNEWS_API_KEY` - Your RSS feed URL(s)
   - `OPENAI_API_KEY` - (Optional) Your OpenAI API key
   
   **Note**: Do NOT set `PORT` - Render sets this automatically.

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your bot
   - The service will be available at `https://your-service-name.onrender.com`

5. **Verify it's working**
   - Visit your service URL - you should see: `{"status":"ok","message":"Twitter News Bot is running",...}`
   - Check `/health` endpoint for health status
   - Monitor logs in Render dashboard to see bot activity

### Option 2: Deploy as Background Worker

If you don't need a web interface:

1. Create a **Background Worker** instead of Web Service
2. Use **Start Command**: `node bot.js` (runs bot without web server)
3. Add the same environment variables

**Note**: Background Workers on Render's free tier may have limitations.

## Configuration

### Multiple RSS Feeds

To use multiple RSS feeds, separate them with commas in `PICKNEWS_API_KEY`:

```env
PICKNEWS_API_KEY=https://feed1.example.com/rss,https://feed2.example.com/rss,https://feed3.example.com/rss
```

The bot will randomly select one feed each time it fetches news.

### Posting Frequency

By default, the bot posts every **8 hours** (480 minutes). To change this, edit line 59 in `bot.js`:

```javascript
setInterval(run, 480 * 60_000) // Change 480 to your desired minutes
```

### Tweet Format

The bot adds "Check that out: " prefix to headlines. To customize, edit the `craftTweet` function in `bot.js`.

## API Endpoints

When running as a web service, the bot exposes:

- `GET /` - Basic status check
- `GET /health` - Detailed health check with uptime

## Troubleshooting

### Common Issues

**401 Unauthorized Error**
- Check that all Twitter API credentials are correct
- Ensure your Twitter app has read and write permissions

**404 Not Found**
- Verify your RSS feed URL is accessible
- Test the RSS feed URL in a browser

**Bot not posting**
- Check Render logs for errors
- Verify the bot is fetching news (check console logs)
- Ensure the news title is different from the last post

**Connection Refused**
- For local testing, ensure nothing else is using port 3000
- For Render, let it assign the PORT automatically

### Checking Logs

**Local**:
- Logs appear in your console/terminal

**Render**:
- Go to your service in Render Dashboard
- Click "Logs" tab to see real-time logs

## How It Works

1. **Web Server**: Starts an Express server with health check endpoints
2. **Bot Logic**: Imports and runs the bot in the background
3. **News Fetching**: Every 8 hours, the bot:
   - Selects a random RSS feed (if multiple configured)
   - Fetches the latest news item
   - Checks if it's different from the last post
   - (Optional) Uses OpenAI to rephrase the headline
   - Posts to Twitter/X

## Security Notes

- Never commit `.env` file to git
- Keep your API keys secure
- Use Render's environment variables for production
- Regularly rotate your API keys

## License

ISC

## Support

For issues or questions, please open an issue on GitHub.
