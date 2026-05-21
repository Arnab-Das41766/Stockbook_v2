# 📈 Stock Journal - AI-Powered Portfolio Tracker

A beautiful, secure stock journal application to track your stock transactions with automatic P&L calculations and **AI-powered stock analysis**.

## 🌐 Live Demo
Experience the real workings of the project live here: [**View on Netlify**](https://growwjournal.netlify.app/dashboard.html)


## ✨ Key Features

### 🤖 AI Stock Chatbot (New!)
- **Powered by Groq API** - Fast, accurate, and cost-effective analysis.
- **Instant Insights** - Get current price range, support/resistance levels, and market sentiment.
- **News Analysis** - Understand the impact of recent news on stocks.
- **Public Access** - Available on the landing page, no login required!
- **Premium UI** - Floating glassmorphism chat interface.

### 🧮 Stock Delivery Calculator
- **Instant Calculations** - Calculate brokerage, STT, exchange charges, and GST instantly.
- **Groww & Zerodha Logic** - Accurate charge breakdown based on popular brokers.
- **Breakeven Analysis** - Know exactly what price to sell at to break even.
- **Parlay / Averaging** - Calculate average cost for multiple buy entries.

### 📊 Portfolio Dashboard (Authenticated)
- **Excel-like Interface** - Manage your stock entries in a familiar spreadsheet view.
- **Automatic P&L** - Real-time profit and loss tracking based on your entries.
- **Secure & Private** - Row Level Security (RLS) ensures only you see your data.
- **Sortable Columns** - Organize your portfolio by name, price, date, or P&L.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Glassmorphism), JavaScript (ES6+)
- **AI Integration**: Groq API (OpenAI-compatible)
- **Backend / Auth**: Supabase (PostgreSQL + Auth)
- **Hosting**: Netlify
- **Styling**: Custom CSS (No frameworks)

## 🚀 Quick Start

### Prerequisites
- Supabase account (free)
- Groq API Key (for chatbot)
- Netlify account (optional, for hosting)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stock-journal.git
   cd stock-journal
   ```

2. **Configure Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Open `public/js/supabase-config.js`
   - Update `SUPABASE_URL` and `SUPABASE_ANON_KEY`

3. **Configure AI Chatbot**
   - Get your API key from [console.groq.com/keys](https://console.groq.com/keys)
   - Open `public/js/groq-config.js`
   - Update `apiKey` with your Groq key

4. **Run Locally**
   - Open `public/index.html` in your browser
   - OR use a local server: `python -m http.server 8000`

## 📁 Project Structure

```
stock-journal/
├── public/
│   ├── css/                # Styles (chatbot, dashboard, etc.)
│   ├── js/                 # Logic (auth, calc, chatbot, etc.)
│   │   ├── groq-config.js      # AI Configuration
│   │   └── supabase-config.js  # DB Configuration
│   ├── index.html          # Landing Page + Calculator + Chatbot
│   └── dashboard.html      # Authenticated Portfolio View
├── README.md               # Documentation
└── netlify.toml            # Deployment config
```

## 🤝 Contributing
Feel free to fork this project and submit pull requests!

## 📄 License
MIT License - Free to use for personal portfolio tracking.
