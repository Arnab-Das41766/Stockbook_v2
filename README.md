<div align="center">

# 📈 Groww Based Stock Delivery Calculator
### Premium Equity Analysis Tool

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

<br />

> "Precise breakdown of your equity investment returns with a premium Glassmorphism UI."

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Logic](#-calculation-logic)

</div>

---

## 💎 Overview

A client-side web application designed to calculate detailed charges and PnL for Indian equity delivery trades. Built with a focus on **Dark Mode Aesthetics**, **User Experience**, and **Regulatory Accuracy**.

It is specifically tuned for **Groww** brokerage logic (₹5 Min Brokerage, ₹16.50 DP Charges) but applicable to most discount brokers.

## ✨ Features

### 🚀 Core Functionality
- **Dynamic Parlay (Averaging)**: Add multiple buy rows to calculate your weighted average cost automatically.
- **Target Breakeven**: One-click analysis to find the *exact* minimum sell price required to exit with ₹0.00 loss, covering all hidden taxes.
- **Real-Time PnL**: Instant calculation of Net Profit/Loss and ROI %.

### 🎨 Premium UI
- **Glassmorphism Design**: Frosted glass panels, background blobs, and smooth depths.
- **Responsive Layout**: Seamlessly adapts from Desktop to Mobile.
- **Micro-Interactions**: Hover tooltips, smooth transitions, and focus effects.

### 🛡️ Regulatory Precision
- **Indian Tax Compliant**: 
    - **STT & Stamp Duty**: Implements aggregate rounding (Nearest Rupee) rules.
    - **GST**: Calculated on Brokerage + Exchange + SEBI fees.
- **Contract Note View**: Displays the exact values you would see on your official contract note.

## 🛠️ Installation

This is a pure client-side application. No Node.js or Python server required.

1.  **Clone the repository** (or download files):
    ```bash
    git clone https://github.com/yourusername/stock-calculator.git
    ```
2.  **Open the Application**:
    Simply double-click `index.html` to open it in your browser.

## 🧠 Calculation Logic

The calculator processes charges in the following order:

1.  **Turnover**: `Qty * Price`
2.  **Brokerage**: `Max(₹5, Min(0.1%, ₹20))` *(Applied per trade)*
3.  **Exchange Charges**: `0.00003 * Turnover`
4.  **SEBI Turnover Fees**: `0.0000001 * Turnover`
5.  **GST**: `18%` of (Brokerage + Exchange + SEBI)
6.  **STT (Security Transaction Tax)**: `0.1%` of Turnover *(Rounded to nearest integer)*
7.  **Stamp Duty**: `0.015%` of Buy Turnover *(Rounded to nearest integer)*
8.  **DP Charges (Sell Side)**: `₹16.50 (Groww) + ₹3.50 (CDSL) + 18% GST`

> [!NOTE]
> **Breakeven Logic**: The tool uses an iterative back-solving algorithm to find the specific price point where `Net Receivable - Total Buy Cost >= 0`.

## 📂 Project Structure

```ascii
CALCULATOR/
├── index.html      # Structure & Layout
├── style.css       # Glassmorphism Theme & Animations
└── script.js       # Business Logic & Math Modules
```

---

<div align="center">
    <i>Crafted with ❤️ for Indian Traders</i>
</div>
