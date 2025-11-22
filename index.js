import express from 'express'
import './bot.js'

const app = express()
const PORT = process.env.PORT || 3000

// Health check endpoint for Render and monitoring
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Twitter News Bot is running',
    timestamp: new Date().toISOString()
  })
})

// Additional health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`🤖 Bot is active and will post news every 8 hours`)
})
