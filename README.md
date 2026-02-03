# 📈 Stock Journal - Personal Portfolio Tracker

A beautiful, secure stock journal application to track your stock transactions with automatic P&L calculations.

## ✨ Features

- 🔐 **Secure Authentication** - Email/password signup and login
- 📊 **Excel-like Dashboard** - Manage stocks in a familiar interface
- 💰 **Auto Calculations** - Automatic charges, breakeven, and P&L
- 🎨 **Premium UI** - Glassmorphism design with dark mode
- 🚀 **Free Hosting** - Deployed on Netlify + Supabase (100% free!)
- 📱 **Responsive** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Netlify
- **Calculations**: Groww brokerage model

## 🚀 Quick Start

### Prerequisites

- Supabase account (free)
- Netlify account (free)
- GitHub account

### Setup

1. **Clone or download this repository**

2. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema (see `deployment_guide.md`)
   - Get your API keys from Settings → API

3. **Configure the app**:
   - Open `public/js/supabase-config.js`
   - Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your keys

4. **Test locally**:
   - Open `public/index.html` in your browser
   - Or use a local server: `python -m http.server 8000`

5. **Deploy to Netlify**:
   - Push code to GitHub
   - Connect repository to Netlify
   - Deploy!

## 📖 Full Documentation

See `deployment_guide.md` for step-by-step instructions.

## 🎯 Usage

1. **Sign Up**: Create an account with email/password
2. **Log In**: Access your dashboard
3. **Add Stocks**: Click "Add Stock" and enter details
4. **Track P&L**: View automatic calculations
5. **Manage Portfolio**: Edit or delete entries anytime

## 💡 Features

### Automatic Calculations
- **Buy Charges**: Brokerage, STT, exchange fees, GST, stamp duty
- **Sell Charges**: Brokerage, STT, DP charges, GST
- **Breakeven Price**: Minimum sell price to break even
- **P&L**: Profit/loss for sold quantities

### Security
- Row Level Security (RLS) in Supabase
- Each user only sees their own data
- Secure authentication with email verification

## 📱 Screenshots

![Dashboard](screenshots/dashboard.png)
![Login](screenshots/login.png)

## 🤝 Contributing

This is a personal project, but feel free to fork and customize!

## 📄 License

MIT License - feel free to use for your own portfolio tracking!

## 🆘 Support

Check `deployment_guide.md` for troubleshooting tips.

---

Built with ❤️ for stock traders
