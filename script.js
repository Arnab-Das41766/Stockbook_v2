document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateBtn');
    const addParlayBtn = document.getElementById('addParlayBtn');

    calculateBtn.addEventListener('click', calculateCharges);
    addParlayBtn.addEventListener('click', () => addBuyRow());

    // Add initial row
    addBuyRow();
});

let rowCount = 0;

function addBuyRow() {
    rowCount++;
    const container = document.getElementById('buyRowsContainer');

    const row = document.createElement('div');
    row.className = 'buy-row';
    row.id = `buyRow-${rowCount}`;

    // Price Input
    const priceWrapper = document.createElement('div');
    priceWrapper.className = 'input-wrapper';
    priceWrapper.innerHTML = `
        <span class="currency-symbol">₹</span>
        <input type="number" class="buy-price-input" placeholder="Price" step="0.01">
    `;

    // Qty Input
    const qtyWrapper = document.createElement('div');
    qtyWrapper.className = 'input-wrapper';
    qtyWrapper.innerHTML = `
        <span class="icon-qty">#</span>
        <input type="number" class="buy-qty-input" placeholder="Qty" step="1">
    `;

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-row-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.onclick = () => deleteBuyRow(row.id);

    row.appendChild(priceWrapper);
    row.appendChild(qtyWrapper);
    row.appendChild(deleteBtn);

    container.appendChild(row);

    // Add input listeners for live summary
    const inputs = row.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', updateBuySummary);
    });
}

function deleteBuyRow(rowId) {
    const container = document.getElementById('buyRowsContainer');
    const row = document.getElementById(rowId);
    if (container.children.length > 1) {
        row.remove();
        updateBuySummary();
    } else {
        // Clear instead of delete if it's the last one
        row.querySelector('.buy-price-input').value = '';
        row.querySelector('.buy-qty-input').value = '';
        updateBuySummary();
    }
}

function updateBuySummary() {
    const prices = document.querySelectorAll('.buy-price-input');
    const quantities = document.querySelectorAll('.buy-qty-input');

    let totalQty = 0;
    let totalTurnover = 0;

    prices.forEach((priceInput, index) => {
        const p = parseFloat(priceInput.value) || 0;
        const q = parseInt(quantities[index].value) || 0;

        if (p > 0 && q > 0) {
            totalTurnover += p * q;
            totalQty += q;
        }
    });

    const avgPrice = totalQty > 0 ? (totalTurnover / totalQty) : 0;

    document.getElementById('avgBuyPrice').innerText = "₹" + avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('totalBuyInvested').innerText = "₹" + totalTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('totalBuyQty').innerText = totalQty;

    // Auto-fill Sell Quantity if it's empty or matches previous total
    const sellQtyInput = document.getElementById('sellQuantity');
    if (sellQtyInput.value === '' || sellQtyInput.dataset.autoFilled === 'true') {
        sellQtyInput.value = totalQty;
        sellQtyInput.dataset.autoFilled = 'true';
    }
}

async function calculateCharges() {
    const calculateBtn = document.getElementById('calculateBtn');
    calculateBtn.innerText = "Calculating...";
    calculateBtn.disabled = true;

    // Simulate small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        // Helpers
        const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
        const roundInt = (num) => Math.round(num);

        // --- AGGREGATE BUY SIDE ---
        let totalBuyTurnover = 0;
        let totalBuyBrokerage = 0;
        let totalBuyExchange = 0;
        let totalBuySebi = 0;
        let totalBuyGst = 0;
        let totalBuyStt = 0;
        let totalBuyStamp = 0;
        let totalBuyQuantity = 0;

        const prices = document.querySelectorAll('.buy-price-input');
        const quantities = document.querySelectorAll('.buy-qty-input');

        // Loop through each row to calculate Per-Order charges
        for (let i = 0; i < prices.length; i++) {
            const p = parseFloat(prices[i].value);
            const q = parseInt(quantities[i].value);

            if (!p || !q || q <= 0) continue;

            const turnover = p * q;
            totalBuyQuantity += q;
            totalBuyTurnover += turnover;

            // Per Order Calculations
            // Brokerage: Max(5, Min(0.1%, 20))
            let brokerage = Math.max(5, Math.min(turnover * 0.001, 20));
            let exchange = turnover * 0.00003;
            let sebi = turnover * 0.0000001;
            let gst = 0.18 * (brokerage + exchange + sebi);
            let stt = roundInt(turnover * 0.001);
            let stamp = roundInt(turnover * 0.00015);

            // Accumulate (Round per order if needed, but usually summed then rounded?)
            // Standard practice: Charges are per contract note, but technically per order execution.
            // We will sum the raw values and round the totals, EXCEPT Brokerage which is per order.

            totalBuyBrokerage += brokerage; // Already effectively rounded by logic rule
            totalBuyExchange += exchange;
            totalBuySebi += sebi;

            // GST we calculate on the sum of charges per order 
            // Actually GST is on the total brokerage+exchange+sebi for the day
            // But to implement "Per Order" effectively for brokerage, we sum brokerage.
            // Let's sum the base charges first.

            // STT/Stamp are rounded per trade usually
            totalBuyStt += stt;
            totalBuyStamp += stamp;
        }

        if (totalBuyQuantity === 0) {
            throw new Error("Please enter at least one valid buy transaction.");
        }

        // Finalize Buy Totals
        // Re-calculate GST on total taxable value to avoid rounding accumulation errors
        totalBuyGst = 0.18 * (totalBuyBrokerage + totalBuyExchange + totalBuySebi);

        // Round Totals
        totalBuyBrokerage = round2(totalBuyBrokerage);
        totalBuyExchange = round2(totalBuyExchange);
        totalBuySebi = round2(totalBuySebi);
        totalBuyGst = round2(totalBuyGst);

        const totalBuyCharges = totalBuyBrokerage + totalBuyExchange + totalBuySebi + totalBuyGst + totalBuyStt + totalBuyStamp;
        const totalBuyPayable = totalBuyTurnover + totalBuyCharges;


        // --- SELL SIDE ---
        const sellPrice = parseFloat(document.getElementById('sellPrice').value);
        const sellQuantity = parseInt(document.getElementById('sellQuantity').value);

        if (isNaN(sellPrice) || isNaN(sellQuantity) || sellQuantity <= 0) {
            throw new Error("Please enter valid Sell details.");
        }

        const sellTurnover = sellPrice * sellQuantity;

        // Brokerage: Dynamic
        let sellBrokerage = Math.max(5, Math.min(sellTurnover * 0.001, 20));
        let sellExchange = sellTurnover * 0.00003;
        let sellSebi = sellTurnover * 0.0000001;
        let sellStt = roundInt(sellTurnover * 0.001);

        // DP Charges
        const growwDp = 16.50;
        const cdslDp = 3.50;
        const totalDp = growwDp + cdslDp;

        // GST Split
        let sellTradeGst = 0.18 * (sellBrokerage + sellExchange + sellSebi);
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
        // PnL based on ACTUAL Invested Amount (totalBuyPayable) vs ACTUAL Net Receivable
        // However, if Sell Qty != Buy Qty, we need to adjust Buy Cost proportionally?
        // User requested: "total profit/loss if all shares are sold at once"
        // But we have a Sell Qty field.
        // Let's use proportional buy cost for PnL if Qty differs.

        let proportionalBuyCost = totalBuyPayable;
        if (sellQuantity !== totalBuyQuantity) {
            proportionalBuyCost = (totalBuyPayable / totalBuyQuantity) * sellQuantity;
        }

        const netPnL = sellNetReceivable - proportionalBuyCost;
        const pnlPercent = (netPnL / proportionalBuyCost) * 100;

        // --- PREPARE DATA OBJECT ---
        const data = {
            buy: {
                turnover: totalBuyTurnover,
                brokerage: totalBuyBrokerage,
                exchange: totalBuyExchange,
                sebi: totalBuySebi,
                gst: totalBuyGst,
                stt: totalBuyStt,
                stamp: totalBuyStamp,
                total_charges: totalBuyCharges,
                total_payable: totalBuyPayable
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
        alert(error.message || "An error occurred.");
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
