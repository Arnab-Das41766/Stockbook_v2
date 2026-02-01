document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsContainer = document.getElementById('resultsContainer');

    calculateBtn.addEventListener('click', calculateCharges);
});

async function calculateCharges() {
    // 1. Get Inputs
    const buyPrice = parseFloat(document.getElementById('buyPrice').value);
    const sellPrice = parseFloat(document.getElementById('sellPrice').value);
    const quantity = parseInt(document.getElementById('quantity').value);

    // Validate inputs
    if (isNaN(buyPrice) || isNaN(sellPrice) || isNaN(quantity) || quantity <= 0) {
        alert("Please enter valid numeric values for all fields.");
        return;
    }

    const calculateBtn = document.getElementById('calculateBtn');
    calculateBtn.innerText = "Calculating...";
    calculateBtn.disabled = true;

    // Simulate small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        // --- CALCULATION LOGIC (Ported from app.py) ---

        // Helper for consistent rounding (2 decimals)
        const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
        // Helper for integer rounding (STT/Stamp)
        const roundInt = (num) => Math.round(num);

        // --- BUY SIDE ---
        const buyTurnover = buyPrice * quantity;
        let buyBrokerage = 5.00;
        let buyExchange = buyTurnover * 0.00003; // 0.003%
        let buySebi = buyTurnover * 0.0000001;

        let buyGst = 0.18 * (buyBrokerage + buyExchange + buySebi);
        let buyStt = roundInt(buyTurnover * 0.001);
        let buyStamp = roundInt(buyTurnover * 0.00015);

        // Round components
        buyBrokerage = round2(buyBrokerage);
        buyExchange = round2(buyExchange);
        buySebi = round2(buySebi);
        buyGst = round2(buyGst);

        const buyTotalCharges = buyBrokerage + buyExchange + buySebi + buyGst + buyStt + buyStamp;
        const buyTotalPayable = buyTurnover + buyTotalCharges;


        // --- SELL SIDE ---
        const sellTurnover = sellPrice * quantity;
        let sellBrokerage = 5.00;
        let sellExchange = sellTurnover * 0.00003; // 0.003%
        let sellSebi = sellTurnover * 0.0000001;
        let sellStt = roundInt(sellTurnover * 0.001);

        // DP Charges
        const growwDp = 16.50;
        const cdslDp = 3.50;
        const totalDp = growwDp + cdslDp;

        // GST Split
        // Trade GST: on Brokerage + Exchange + SEBI
        let sellTradeGst = 0.18 * (sellBrokerage + sellExchange + sellSebi);

        // DP GST: on DP Charges
        let dpGst = 0.18 * totalDp;

        // Rounding
        sellBrokerage = round2(sellBrokerage);
        sellExchange = round2(sellExchange);
        sellSebi = round2(sellSebi);
        sellTradeGst = round2(sellTradeGst);
        dpGst = round2(dpGst);

        // Contract Note Calculation
        const totalTradeCharges = sellBrokerage + sellExchange + sellSebi + sellTradeGst + sellStt;
        const contractNoteTotal = sellTurnover - totalTradeCharges;

        // External Deductions
        const totalExternalDeductions = totalDp + dpGst;

        // Final Net
        const sellNetReceivable = contractNoteTotal - totalExternalDeductions;
        const sellTotalCharges = totalTradeCharges + totalExternalDeductions;

        // --- PnL ---
        const netPnL = sellNetReceivable - buyTotalPayable;
        const pnlPercent = buyTotalPayable > 0 ? (netPnL / buyTotalPayable) * 100 : 0;

        // --- PREPARE DATA OBJECT ---
        const data = {
            buy: {
                turnover: buyTurnover,
                brokerage: buyBrokerage,
                exchange: buyExchange,
                sebi: buySebi,
                gst: buyGst,
                stt: buyStt,
                stamp: buyStamp,
                total_charges: buyTotalCharges,
                total_payable: buyTotalPayable
            },
            sell: {
                turnover: sellTurnover,
                brokerage: sellBrokerage,
                exchange: sellExchange,
                sebi: sellSebi,
                stt: sellStt,
                trade_gst: sellTradeGst,
                dp_total: totalDp,
                dp_gst: dpGst,
                contract_note_total: contractNoteTotal,
                external_deductions: totalExternalDeductions,
                net_receivable: sellNetReceivable,
                total_charges: sellTotalCharges
            },
            pnl: {
                net: netPnL,
                percent: pnlPercent
            }
        };

        updateUI(data);

    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred during calculation.");
    } finally {
        calculateBtn.innerText = "Calculate Breakdown";
        calculateBtn.disabled = false;
    }
}

function updateUI(data) {
    const buy = data.buy;
    const sell = data.sell;
    const pnl = data.pnl;
    const resultsContainer = document.getElementById('resultsContainer');

    // Helper for formatting currency
    const format = (num) => "₹" + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // --- BUY CARD ---
    document.getElementById('buyTurnover').innerText = format(buy.turnover);
    document.getElementById('buyBrokerage').innerText = format(buy.brokerage);
    document.getElementById('buyExchange').innerText = format(buy.exchange);
    document.getElementById('buySebi').innerText = format(buy.sebi);
    document.getElementById('buyGst').innerText = format(buy.gst);
    document.getElementById('buyStt').innerText = format(buy.stt);
    document.getElementById('buyStamp').innerText = format(buy.stamp);
    document.getElementById('buyTotalCharges').innerText = format(buy.total_charges);
    document.getElementById('buyTotalPayable').innerText = format(buy.total_payable);

    // --- SELL CARD ---
    document.getElementById('sellTurnover').innerText = format(sell.turnover);
    document.getElementById('sellBrokerage').innerText = format(sell.brokerage);
    document.getElementById('sellExchange').innerText = format(sell.exchange);
    document.getElementById('sellSebi').innerText = format(sell.sebi);
    document.getElementById('sellStt').innerText = format(sell.stt);
    document.getElementById('sellTradeGst').innerText = format(sell.trade_gst);

    // Contract Note
    document.getElementById('contractNoteTotal').innerText = format(sell.contract_note_total);

    // External
    document.getElementById('sellDp').innerText = format(sell.dp_total);
    document.getElementById('sellDpGst').innerText = format(sell.dp_gst);
    document.getElementById('externalDeductions').innerText = format(sell.external_deductions);

    // Final
    document.getElementById('sellNetReceivable').innerText = format(sell.net_receivable);

    // --- PnL ---
    const pnlEl = document.getElementById('netPnL');
    const pnlPercentEl = document.getElementById('netPnLPercent');

    pnlEl.innerText = (pnl.net >= 0 ? "+" : "") + format(pnl.net);
    pnlPercentEl.innerText = `(${pnl.net >= 0 ? "+" : ""}${pnl.percent.toFixed(2)}%)`;

    // Styling classes
    const isProfit = pnl.net >= 0;
    pnlEl.className = 'pnl-value ' + (isProfit ? 'profit' : 'loss');
    pnlPercentEl.className = 'pnl-percent ' + (isProfit ? 'profit' : 'loss');

    // Show Results
    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
