# 🤖 AI Stock Chatbot - Setup Guide

## Quick Setup (3 Steps)

### Step 1: Get Your Together AI API Key

1. Go to [Together AI](https://api.together.xyz/)
2. Sign up or log in
3. Navigate to **Settings → API Keys**
4. Click **Create new key**
5. Copy your API key

### Step 2: Configure the Chatbot

Open `public/js/together-ai-config.js` and replace the placeholder:

```javascript
const TOGETHER_AI_CONFIG = {
    apiKey: 'YOUR_API_KEY_HERE', // ← Paste your key here!
    apiUrl: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
}
```

### Step 3: Test It!

1. Open your dashboard: `public/dashboard.html`
2. Click the 🤖 button in the bottom-right corner
3. Try example stocks: RELIANCE, TCS, INFY, TATASTEEL

---

## Features

✅ **Current Price Range** - Approximate price range in ₹  
✅ **Support Levels** - 2 key support price points  
✅ **Resistance Level** - 1 resistance price point  
✅ **Market Sentiment** - Bullish/Bearish/Neutral analysis  
✅ **News Impact** - Recent news sentiment (Positive/Negative/Neutral)  
✅ **Technical Insights** - Volume, RSI, trends  

---

## Usage

1. **Click the chatbot button** (bottom-right)
2. **Enter a stock name** (e.g., "RELIANCE", "TCS")
3. **Get instant analysis** with all metrics
4. **Ask about multiple stocks** - each query is independent

---

## Cost Estimate

**Together AI Pricing:**
- Model: Meta-Llama-3.1-8B-Instruct-Turbo
- Cost: ~$0.0002 per query
- **1000 queries/month = ~$0.20**

Very affordable! 🎉

---

## Troubleshooting

### "API key not configured" error
- Make sure you updated `together-ai-config.js` with your real API key
- Don't leave it as `YOUR_TOGETHER_AI_API_KEY_HERE`

### "Failed to parse AI response" error
- The AI occasionally returns invalid JSON
- Just try again - it usually works on retry

### Chatbot button not appearing
- Check browser console for errors
- Make sure all files are loaded:
  - `css/chatbot.css`
  - `js/together-ai-config.js`
  - `js/chatbot.js`

### Slow responses
- Normal! AI analysis takes 3-5 seconds
- You'll see a typing indicator while waiting

---

## Customization

### Change AI Model

In `together-ai-config.js`:

```javascript
// Faster, cheaper (current):
model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'

// More accurate, slower:
model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
```

### Adjust Temperature

In `chatbot.js`, find the API call and modify:

```javascript
temperature: 0.7  // Lower = more focused, Higher = more creative
```

---

## Disclaimer

⚠️ **Important:** This chatbot is for **educational purposes only**. 

- AI provides approximate data based on training knowledge
- Not real-time market data
- **NOT financial advice**
- Always verify with official sources before trading

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify API key is correct
3. Ensure you have internet connection
4. Try a different stock name

---

**Enjoy your AI Stock Analyst! 📈🤖**
