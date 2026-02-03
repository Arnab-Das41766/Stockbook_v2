// Calculation functions for stock charges and P&L
// These match the Groww brokerage model

function calculateBuyCharges(price, quantity) {
    const turnover = price * quantity

    // Brokerage: 0.1% with min ₹5, max ₹20
    const brokerage = Math.max(5, Math.min(turnover * 0.001, 20))

    // Exchange charges: 0.003%
    const exchangeCharges = turnover * 0.00003

    // SEBI charges: 0.00001%
    const sebiCharges = turnover * 0.0000001

    // GST: 18% on (brokerage + exchange + SEBI)
    const gst = (brokerage + exchangeCharges + sebiCharges) * 0.18

    // STT: 0.1% (rounded to nearest rupee)
    const stt = Math.round(turnover * 0.001)

    // Stamp duty: 0.015% (rounded to nearest rupee)
    const stampDuty = Math.round(turnover * 0.00015)

    const totalCharges = brokerage + exchangeCharges + sebiCharges + gst + stt + stampDuty
    return Math.round(totalCharges * 100) / 100
}

function calculateSellCharges(price, quantity) {
    if (quantity === 0) return 0

    const turnover = price * quantity

    // Brokerage: 0.1% with min ₹5, max ₹20
    const brokerage = Math.max(5, Math.min(turnover * 0.001, 20))

    // Exchange charges: 0.003%
    const exchangeCharges = turnover * 0.00003

    // SEBI charges: 0.00001%
    const sebiCharges = turnover * 0.0000001

    // STT: 0.1% (rounded to nearest rupee)
    const stt = Math.round(turnover * 0.001)

    // DP charges: ₹16.50 (Groww) + ₹3.50 (CDSL)
    const dpCharges = 16.50 + 3.50

    // GST: 18% on (brokerage + exchange + SEBI + DP)
    const gst = (brokerage + exchangeCharges + sebiCharges + dpCharges) * 0.18

    const totalCharges = brokerage + exchangeCharges + sebiCharges + stt + dpCharges + gst
    return Math.round(totalCharges * 100) / 100
}

function calculateBreakeven(buyPrice, buyQuantity, buyCharges) {
    if (buyQuantity === 0) return 0
    return Math.round(((buyPrice * buyQuantity + buyCharges) / buyQuantity) * 100) / 100
}

function calculatePnL(buyPrice, buyQty, buyCharges, sellPrice, sellQty, sellCharges) {
    if (sellQty === 0) return 0

    // Proportional buy cost for sold quantity
    const buyValue = buyPrice * sellQty + (buyCharges * sellQty / buyQty)

    // Sell value after charges
    const sellValue = sellPrice * sellQty - sellCharges

    const pnl = sellValue - buyValue
    return Math.round(pnl * 100) / 100
}

function calculateRemainingShares(buyQty, sellQty) {
    return buyQty - (sellQty || 0)
}

// Export functions
window.stockCalculations = {
    calculateBuyCharges,
    calculateSellCharges,
    calculateBreakeven,
    calculatePnL,
    calculateRemainingShares
}
