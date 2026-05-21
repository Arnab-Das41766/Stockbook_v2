# 📈 Stock Journal - AI-Powered Portfolio Tracker

A beautiful, secure, and responsive stock journal application to track your stock transactions with automatic P&L calculations, **high-fidelity spreadsheet data exports**, and **AI-powered stock analysis**.

## 🌐 Live Demo
Experience the real workings of the project live here: [**View on Netlify**](https://growwjournal.netlify.app/dashboard.html)

---

## ✨ Key Features

### 🤖 AI Stock Chatbot
- **Powered by Groq API** - Instant, intelligent technical analysis utilizing the fast `llama3-70b-8192` model.
- **Instant Insights** - Get current price range, support/resistance levels (S1, S2, R1), and overall market sentiment.
- **Technical & Trend Indicators** - Deep insights covering RSI, volumes, and directional trends.
- **Public Access** - Available directly on the landing page, no login required!
- **Premium UI** - Floating glassmorphic chat widget with beautifully structured data cards.

### 🧮 Stock Delivery Calculator (Mobile & Laptop Optimized)
- **Instant Calculations** - Auto-calculate brokerage, STT, exchange transaction charges, SEBI fees, and GST.
- **CDSL & DP Charges** - Incorporates accurate ₹20 CDSL/DP fees and matching trade GST on sell transactions.
- **Groww & Zerodha Logic** - Highly precise discount brokerage calculations matching popular Indian platforms.
- **Target Breakeven Solver** - Instantly determines the lowest exit price required for a exact ₹0.00 net P&L.
- **Parlay / Averaging** - Dynamically add, modify, or delete multiple buy entries in real-time.
- **Fully Responsive** - Stacks grids seamlessly into a single-column layout on phones and features a `90vh` vertical scroll wrapper with a custom glass scrollbar to prevent layout cutoffs.

### 📊 Portfolio Dashboard (Authenticated)
- **Excel-like Interface** - Manage your stock ledger inside a familiar, sorting-enabled spreadsheet view.
- **Automatic P&L** - Real-time proportional profit/loss tracking based on buy-averages and partial position exits.
- **Keyboard Spreadsheet Navigation** - Traverse the add/edit inputs using Arrow keys, linear Enter-key traversal (Shift+Enter for reverse), and auto-selection of text focus.
- **Secure & Private** - Integrated with Supabase PostgreSQL and Row Level Security (RLS) to keep data confidential.

### 📥 Multi-Format Data Export
- **Vibrant Excel (.xls) Exporters** - Downloads a beautifully stylized spreadsheet containing teal headers (`#00d1b2`), native gridlines, and color-coded Net P&L indicators (emerald green for gains, crimson red for losses).
- **CSV & JSON Options** - Instantly export all historical ledger entries (Active and Closed) as portable `.csv` or backup-ready `.json` files.

---

## 🛠️ Tech Stack
- **Frontend**: Semantic HTML5, Vanilla JavaScript (ES6+), and Custom CSS (Modular Glassmorphism)
- **AI Integration**: Groq API (OpenAI-compatible)
- **Charts Engine**: ApexCharts (Donut-allocation visualization)
- **Backend / Auth**: Supabase (PostgreSQL Database + Supabase Auth)
- **Hosting**: Netlify

---

## 🚀 Quick Start

### Prerequisites
- Supabase account (free tier)
- Groq API Key (from [console.groq.com](https://console.groq.com))
- Netlify account (optional, for hosting)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Arnab-Das41766/Stockbook_v2.git
   cd Stockbook_v2
   ```

2. **Configure Supabase**
   - Create a project on [supabase.com](https://supabase.com)
   - Setup a table named `stock_entries` (refer to the structure in `public/js/stock-api.js`)
   - Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` inside `public/js/supabase-config.js`

3. **Configure AI Chatbot**
   - Retrieve your API key from [console.groq.com/keys](https://console.groq.com/keys)
   - Update the `apiKey` parameter inside `public/js/groq-config.js`

4. **Run Locally**
   - Open `public/index.html` in your browser.
   - Or run a local lightweight server:
     ```bash
     python -m http.server 8000
     ```

---

## 📁 Project Structure

```
Stockbook_v2/
├── public/                  # Core frontend assets published to Netlify
│   ├── css/                 # Glassmorphic stylesheets
│   │   ├── auth-modal.css       # Signup / Signin styles
│   │   ├── chatbot.css          # Floating widget styling
│   │   ├── dashboard.css        # Spreadsheet and modal alignment rules
│   │   ├── stock-modal.css      # Add/Edit transaction overlay
│   │   └── landing.css          # Landing page styles
│   ├── js/                  # Application script controllers
│   │   ├── auth.js              # Supabase session logic
│   │   ├── calculations.js      # Indian discount brokerage tax engine
│   │   ├── calculator.js        # Landing page calculator controller
│   │   ├── chatbot.js           # Groq API stock assistant client
│   │   ├── dashboard-calculator.js # Dashboard modal calculator logic
│   │   ├── dashboard.js         # Ledger tables, filters, and exporter
│   │   ├── expandable-rows.js   # Accordion rows controller
│   │   ├── groq-config.js       # Groq credentials configuration
│   │   ├── stock-api.js         # Supabase database CRUD operations
│   │   ├── stock-grouping.js    # Aggregates transactions into stocks
│   │   └── supabase-config.js   # Supabase client instantiation
│   ├── index.html           # Public landing page + calculator + chat
│   └── dashboard.html       # Authenticated Portfolio Tracker View
├── README.md                # Documentation (This file)
└── netlify.toml             # Netlify deployment and route redirects config
```

---

## 📄 License
MIT License - Free to use for personal portfolio tracking.
