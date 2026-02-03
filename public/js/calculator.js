document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateBtn');
    const addParlayBtn = document.getElementById('addParlayBtn');
    const breakevenBtn = document.getElementById('breakevenBtn');

    calculateBtn.addEventListener('click', calculateCharges);
    addParlayBtn.addEventListener('click', () => addBuyRow());
    breakevenBtn.addEventListener('click', findBreakeven);

    // Add initial row
    addBuyRow();

    // Keyboard Shortcuts
    setupKeyboardShortcuts();

});

let rowCount = 0;

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // ENTER: Calculate Breakdown
        if (event.key === 'Enter') {
            event.preventDefault();
            calculateCharges();
            return;
        }

        // PLUS (+): Add Parlay Row
        if (event.key === '+' || (event.key === '=' && event.shiftKey)) {
            event.preventDefault();
            addBuyRow(true);
            return;
        }

        // ESC: Reset Calculator
        if (event.key === 'Escape') {
            resetCalculator();
            return;
        }

        // ARROW KEYS: Grid Navigation
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            handleArrowNavigation(event);
        }
    });
}

function handleArrowNavigation(event) {
    const inputs = Array.from(document.querySelectorAll('.calc-input'));
    const currentInput = document.activeElement;

    // If focus is not on an input we care about, ignore
    const currentIndex = inputs.indexOf(currentInput);
    if (currentIndex === -1) return;

    // Grid Logic Assumption: 2 Columns per row (Price | Qty)
    const COLUMNS = 2; // Price, Qty
    let targetIndex = currentIndex;

    if (event.key === 'ArrowRight') {
        targetIndex = currentIndex + 1;
    } else if (event.key === 'ArrowLeft') {
        targetIndex = currentIndex - 1;
    } else if (event.key === 'ArrowDown') {
        targetIndex = currentIndex + COLUMNS;
    } else if (event.key === 'ArrowUp') {
        targetIndex = currentIndex - COLUMNS;
    }

    // Boundary Checks
    if (targetIndex >= 0 && targetIndex < inputs.length) {
        event.preventDefault();
        inputs[targetIndex].focus();
        setTimeout(() => inputs[targetIndex].select(), 0);
    }
}

function resetCalculator() {
    // Clear all rows
    const container = document.getElementById('buyRowsContainer');
    container.innerHTML = '';
    rowCount = 0;

    // Add one fresh row
    addBuyRow(true); // focus on first row

    // Reset Sell Inputs
    document.getElementById('sellPrice').value = '';
    document.getElementById('sellQuantity').value = '';
    delete document.getElementById('sellQuantity').dataset.autoFilled;

    // Hide Results
    document.getElementById('resultsContainer').classList.add('hidden');

    // Reset Summary
    updateBuySummary();
}

function addBuyRow(shouldFocus = false) {
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
        <input type="number" class="buy-price-input calc-input" placeholder="Price" step="0.01">
    `;

    // Qty Input
    const qtyWrapper = document.createElement('div');
    qtyWrapper.className = 'input-wrapper';
    qtyWrapper.innerHTML = `
        <span class="icon-qty">#</span>
        <input type="number" class="buy-qty-input calc-input" placeholder="Qty" step="1">
    `;

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-row-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = "Remove Row";
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

    // Auto-focus logic
    if (shouldFocus) {
        row.querySelector('.buy-price-input').focus();
    }
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

// --- PURE LOGIC ---

function computeBuySide(buyRows) {
    const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

    let totalBuyTurnover = 0;
    let totalBuyBrokerage = 0;
    let totalBuyExchange = 0;
    let totalBuySebi = 0;
    let totalBuyStt = 0;
    let totalBuyStamp = 0;
    let totalBuyQuantity = 0;

    // Temporary accumulations for logic
    let rawStt = 0;
    let rawStamp = 0;

    buyRows.forEach(row => {
        const turnover = row.p * row.q;
        totalBuyQuantity += row.q;
        totalBuyTurnover += turnover;

        // Brokerage
        let brokerage = Math.max(5, Math.min(turnover * 0.001, 20));
        let exchange = turnover * 0.00003;
        let sebi = turnover * 0.0000001;

        rawStt += turnover * 0.001;
        rawStamp += turnover * 0.00015;

        totalBuyBrokerage += brokerage;
        totalBuyExchange += exchange;
        totalBuySebi += sebi;
    });

    // Final Rounding
    totalBuyStt = Math.round(rawStt);
    totalBuyStamp = Math.round(rawStamp);

    // GST
    let totalBuyGst = 0.18 * (totalBuyBrokerage + totalBuyExchange + totalBuySebi);

    // Rounding Totals
    totalBuyBrokerage = round2(totalBuyBrokerage);
    totalBuyExchange = round2(totalBuyExchange);
    totalBuySebi = round2(totalBuySebi);
    totalBuyGst = round2(totalBuyGst);

    const totalBuyCharges = totalBuyBrokerage + totalBuyExchange + totalBuySebi + totalBuyGst + totalBuyStt + totalBuyStamp;
    const totalBuyPayable = totalBuyTurnover + totalBuyCharges;
    const avgCostPerShare = totalBuyQuantity > 0 ? totalBuyPayable / totalBuyQuantity : 0;

    return {
        turnover: totalBuyTurnover,
        brokerage: totalBuyBrokerage,
        exchange: totalBuyExchange,
        sebi: totalBuySebi,
        gst: totalBuyGst,
        stt: totalBuyStt,
        stamp: totalBuyStamp,
        total_charges: totalBuyCharges,
        total_payable: totalBuyPayable,
        avg_cost_per_share: avgCostPerShare,
        quantity: totalBuyQuantity
    };
}

function computeSellSide(sellPrice, sellQuantity, totalBuyQuantity, totalBuyPayable) {
    const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
    const roundInt = (num) => Math.round(num);

    const sellTurnover = sellPrice * sellQuantity;

    // Brokerage
    let sellBrokerage = Math.max(5, Math.min(sellTurnover * 0.001, 20));
    let sellExchange = sellTurnover * 0.00003;
    let sellSebi = sellTurnover * 0.0000001;
    let sellStt = Math.round(sellTurnover * 0.001);

    // DP Charges
    const totalDp = 16.50 + 3.50; // Groww + CDSL

    // GST
    let sellTradeGst = 0.18 * (sellBrokerage + sellExchange + sellSebi);
    let dpGst = 0.18 * totalDp;

    // Rounding
    sellBrokerage = round2(sellBrokerage);
    sellExchange = round2(sellExchange);
    sellSebi = round2(sellSebi);
    sellTradeGst = round2(sellTradeGst);
    dpGst = round2(dpGst);

    const totalTradeCharges = sellBrokerage + sellExchange + sellSebi + sellTradeGst + sellStt;
    const contractNoteTotal = sellTurnover - totalTradeCharges;
    const totalExternalDeductions = totalDp + dpGst;

    const sellNetReceivable = contractNoteTotal - totalExternalDeductions;
    const sellTotalCharges = totalTradeCharges + totalExternalDeductions;

    // PnL
    let proportionalBuyCost = totalBuyPayable;
    if (sellQuantity !== totalBuyQuantity && totalBuyQuantity > 0) {
        proportionalBuyCost = (totalBuyPayable / totalBuyQuantity) * sellQuantity;
    }

    const netPnL = sellNetReceivable - proportionalBuyCost;
    const pnlPercent = proportionalBuyCost > 0 ? (netPnL / proportionalBuyCost) * 100 : 0;

    return {
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
        total_charges: sellTotalCharges,
        netPnL: netPnL,
        pnlPercent: pnlPercent
    };
}


// --- DOM HANDLERS ---

function getBuyRowsFromDOM() {
    const prices = document.querySelectorAll('.buy-price-input');
    const quantities = document.querySelectorAll('.buy-qty-input');
    const rows = [];
    for (let i = 0; i < prices.length; i++) {
        const p = parseFloat(prices[i].value);
        const q = parseInt(quantities[i].value);
        if (p && q && q > 0) {
            rows.push({ p, q });
        }
    }
    return rows;
}

async function calculateCharges() {
    const calculateBtn = document.getElementById('calculateBtn');
    const originalText = calculateBtn.innerText;
    calculateBtn.innerText = "Calculating...";
    calculateBtn.disabled = true;

    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        const buyRows = getBuyRowsFromDOM();
        if (buyRows.length === 0) {
            // Check if user entered anything valid at all
            const prices = document.querySelectorAll('.buy-price-input');
            if (prices.length === 1 && !prices[0].value) throw new Error("Please enter buy details.");
            // else, proceed with 0 ? No, logic requires buy
            if (buyRows.length === 0) throw new Error("Please enter valid buy details.");
        }

        const buyData = computeBuySide(buyRows);

        const sellPriceInput = document.getElementById('sellPrice');
        const sellQuantityInput = document.getElementById('sellQuantity');

        let sellPrice = parseFloat(sellPriceInput.value);
        let sellQuantity = parseInt(sellQuantityInput.value);

        if (isNaN(sellPrice) || isNaN(sellQuantity)) {
            throw new Error("Please enter valid Sell details.");
        }

        const sellData = computeSellSide(sellPrice, sellQuantity, buyData.quantity, buyData.total_payable);

        updateUI({
            buy: buyData,
            sell: sellData,
            pnl: {
                net: sellData.netPnL,
                percent: sellData.pnlPercent
            }
        });

    } catch (error) {
        console.error('Error:', error);
        if (error.message) alert(error.message);
    } finally {
        calculateBtn.innerText = originalText;
        calculateBtn.disabled = false;
    }
}

async function findBreakeven() {
    const breakevenBtn = document.getElementById('breakevenBtn');
    const originalText = breakevenBtn.innerText;
    breakevenBtn.innerText = "Finding...";
    breakevenBtn.disabled = true;

    try {
        const buyRows = getBuyRowsFromDOM();
        if (buyRows.length === 0) throw new Error("Please enter buy details first.");

        const buyData = computeBuySide(buyRows);

        let sellQuantity = parseInt(document.getElementById('sellQuantity').value);
        if (!sellQuantity || sellQuantity === 0) {
            sellQuantity = buyData.quantity; // Default to full sell
            document.getElementById('sellQuantity').value = sellQuantity;
        }

        // Iterative Search
        // Start from Average Buy Price
        const avgBuyPrice = buyData.quantity > 0 ? (buyData.turnover / buyData.quantity) : 0;
        let candidatePrice = avgBuyPrice;
        let iterations = 0;
        const maxIterations = 5000; // Safety break

        while (iterations < maxIterations) {
            const result = computeSellSide(candidatePrice, sellQuantity, buyData.quantity, buyData.total_payable);

            if (result.netPnL >= 0) {
                // Found it!
                break;
            }

            // Increment strictly by tick size? 0.05
            // Or smaller steps: 0.01 for more precision?
            candidatePrice += 0.01;
            iterations++;
        }

        // Update UI
        document.getElementById('sellPrice').value = candidatePrice.toFixed(2);

        // Trigger Calculation
        calculateCharges();

    } catch (error) {
        if (error.message) alert(error.message);
    } finally {
        breakevenBtn.innerText = originalText;
        breakevenBtn.disabled = false;
    }
}

function updateUI(data) {
    const buy = data.buy;
    const sell = data.sell;
    const pnl = data.pnl;
    const resultsContainer = document.getElementById('resultsContainer');

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
    document.getElementById('buyAvgCostPerShare').innerText = format(buy.avg_cost_per_share);
    document.getElementById('buyTotalPayable').innerText = format(buy.total_payable);

    // --- SELL CARD ---
    document.getElementById('sellTurnover').innerText = format(sell.turnover);
    document.getElementById('sellBrokerage').innerText = format(sell.brokerage);
    document.getElementById('sellExchange').innerText = format(sell.exchange);
    document.getElementById('sellSebi').innerText = format(sell.sebi);
    document.getElementById('sellStt').innerText = format(sell.stt);
    document.getElementById('sellTradeGst').innerText = format(sell.trade_gst);

    document.getElementById('contractNoteTotal').innerText = format(sell.contract_note_total);

    document.getElementById('sellDp').innerText = format(sell.dp_total);
    document.getElementById('sellDpGst').innerText = format(sell.dp_gst);
    document.getElementById('externalDeductions').innerText = format(sell.external_deductions);

    document.getElementById('sellNetReceivable').innerText = format(sell.net_receivable);
    document.getElementById('sellTotalCharges').innerText = format(sell.total_charges);

    // --- PnL ---
    const pnlEl = document.getElementById('netPnL');
    const pnlPercentEl = document.getElementById('netPnLPercent');

    pnlEl.innerText = (pnl.net >= 0 ? "+" : "") + format(pnl.net);
    pnlPercentEl.innerText = `(${pnl.net >= 0 ? "+" : ""}${pnl.percent.toFixed(2)}%)`;

    const isProfit = pnl.net >= 0;
    pnlEl.className = 'pnl-value ' + (isProfit ? 'profit' : 'loss');
    pnlPercentEl.className = 'pnl-percent ' + (isProfit ? 'profit' : 'loss');

    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


