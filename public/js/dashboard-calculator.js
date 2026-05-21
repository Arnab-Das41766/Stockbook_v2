(function () {
    let calcRowCount = 0;

    document.addEventListener('DOMContentLoaded', () => {
        // Modal Selectors
        const calculatorBtn = document.getElementById('calculatorBtn');
        const calculatorModal = document.getElementById('calculatorModal');
        const closeCalcModal = document.getElementById('closeCalcModal');

        if (!calculatorBtn || !calculatorModal) return;

        // Modal triggers
        calculatorBtn.addEventListener('click', () => {
            calculatorModal.style.display = 'flex';
            
            // If no buy rows exist, initialize with one row
            const container = document.getElementById('calcBuyRowsContainer');
            if (container && container.children.length === 0) {
                resetCalcCalculator();
            }
        });

        if (closeCalcModal) {
            closeCalcModal.addEventListener('click', () => {
                calculatorModal.style.display = 'none';
            });
        }

        // Close modal when clicking outside of modal content
        calculatorModal.addEventListener('click', (e) => {
            if (e.target === calculatorModal) {
                calculatorModal.style.display = 'none';
            }
        });

        // Close modal on Escape key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && calculatorModal.style.display === 'flex') {
                calculatorModal.style.display = 'none';
            }
        });

        // Action Buttons within the Calculator Modal
        const calcCalculateBtn = document.getElementById('calcCalculateBtn');
        const calcAddParlayBtn = document.getElementById('calcAddParlayBtn');
        const calcBreakevenBtn = document.getElementById('calcBreakevenBtn');

        if (calcCalculateBtn) calcCalculateBtn.addEventListener('click', calculateCalcCharges);
        if (calcAddParlayBtn) calcAddParlayBtn.addEventListener('click', () => addCalcBuyRow(true));
        if (calcBreakevenBtn) calcBreakevenBtn.addEventListener('click', findCalcBreakeven);

        // Grid arrow-key navigation inside the modal inputs
        document.addEventListener('keydown', handleGridNavigation);

        // Autofocus and selection handlers for inputs
        document.addEventListener('focusin', (e) => {
            if (e.target.classList.contains('calc-input')) {
                setTimeout(() => e.target.select(), 0);
            }
        });
    });

    function resetCalcCalculator() {
        const container = document.getElementById('calcBuyRowsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        calcRowCount = 0;

        // Add one initial buy row
        addCalcBuyRow(true);

        // Reset Sell Inputs
        const sellPriceInput = document.getElementById('calcSellPrice');
        const sellQtyInput = document.getElementById('calcSellQuantity');
        
        if (sellPriceInput) sellPriceInput.value = '';
        if (sellQtyInput) {
            sellQtyInput.value = '';
            delete sellQtyInput.dataset.autoFilled;
        }

        // Hide Results Container
        const resultsContainer = document.getElementById('calcResultsContainer');
        if (resultsContainer) resultsContainer.classList.add('hidden');

        // Reset Summary values
        updateCalcBuySummary();
    }

    function addCalcBuyRow(shouldFocus = false) {
        calcRowCount++;
        const container = document.getElementById('calcBuyRowsContainer');
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'buy-row';
        row.id = `calcBuyRow-${calcRowCount}`;

        // Price Input
        const priceWrapper = document.createElement('div');
        priceWrapper.className = 'input-wrapper';
        priceWrapper.innerHTML = `
            <span class="currency-symbol">₹</span>
            <input type="number" class="buy-price-input calc-input" placeholder="Price" step="0.01" style="background: transparent; border: none; outline: none; color: #fff; width: 100%; font-family: inherit;">
        `;

        // Qty Input
        const qtyWrapper = document.createElement('div');
        qtyWrapper.className = 'input-wrapper';
        qtyWrapper.innerHTML = `
            <span class="icon-qty">#</span>
            <input type="number" class="buy-qty-input calc-input" placeholder="Qty" step="1" style="background: transparent; border: none; outline: none; color: #fff; width: 100%; font-family: inherit;">
        `;

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-row-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = "Remove Row";
        deleteBtn.onclick = () => deleteCalcBuyRow(row.id);

        row.appendChild(priceWrapper);
        row.appendChild(qtyWrapper);
        row.appendChild(deleteBtn);

        container.appendChild(row);

        // Listen for user edits to update average buy card in real-time
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', updateCalcBuySummary);
        });

        // Set focus to the new price input if requested
        if (shouldFocus) {
            row.querySelector('.buy-price-input').focus();
        }
    }

    function deleteCalcBuyRow(rowId) {
        const container = document.getElementById('calcBuyRowsContainer');
        const row = document.getElementById(rowId);
        if (!container || !row) return;

        if (container.children.length > 1) {
            row.remove();
            updateCalcBuySummary();
        } else {
            // Keep at least one row, just clear it
            const priceInput = row.querySelector('.buy-price-input');
            const qtyInput = row.querySelector('.buy-qty-input');
            if (priceInput) priceInput.value = '';
            if (qtyInput) qtyInput.value = '';
            updateCalcBuySummary();
        }
    }

    function updateCalcBuySummary() {
        const container = document.getElementById('calcBuyRowsContainer');
        if (!container) return;

        const prices = container.querySelectorAll('.buy-price-input');
        const quantities = container.querySelectorAll('.buy-qty-input');

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

        const avgBuyPriceEl = document.getElementById('calcAvgBuyPrice');
        const totalBuyInvestedEl = document.getElementById('calcTotalBuyInvested');
        const totalBuyQtyEl = document.getElementById('calcTotalBuyQty');

        if (avgBuyPriceEl) avgBuyPriceEl.innerText = "₹" + avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (totalBuyInvestedEl) totalBuyInvestedEl.innerText = "₹" + totalTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (totalBuyQtyEl) totalBuyQtyEl.innerText = totalQty;

        // Auto-fill Sell Quantity if it's empty or was previously auto-filled
        const sellQtyInput = document.getElementById('calcSellQuantity');
        if (sellQtyInput) {
            if (sellQtyInput.value === '' || sellQtyInput.dataset.autoFilled === 'true') {
                sellQtyInput.value = totalQty > 0 ? totalQty : '';
                sellQtyInput.dataset.autoFilled = totalQty > 0 ? 'true' : 'false';
            }
        }
    }

    function getCalcBuyRowsFromDOM() {
        const container = document.getElementById('calcBuyRowsContainer');
        if (!container) return [];

        const prices = container.querySelectorAll('.buy-price-input');
        const quantities = container.querySelectorAll('.buy-qty-input');
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

    function computeCalcBuySide(buyRows) {
        let totalTurnover = 0;
        let totalBrokerage = 0;
        let totalExchange = 0;
        let totalSebi = 0;
        let totalGst = 0;
        let totalStt = 0;
        let totalStamp = 0;
        let totalQuantity = 0;

        buyRows.forEach(row => {
            const charges = window.stockCalculations.calculateBuyCharges(row.p, row.q);
            
            totalQuantity += row.q;
            totalTurnover += charges.turnover;
            totalBrokerage += charges.brokerage;
            totalExchange += charges.exchangeCharges;
            totalSebi += charges.sebiCharges;
            totalGst += charges.gst;
            totalStt += charges.stt;
            totalStamp += charges.stampDuty;
        });

        const totalCharges = totalBrokerage + totalExchange + totalSebi + totalGst + totalStt + totalStamp;
        const totalPayable = totalTurnover + totalCharges;
        const avgCostPerShare = totalQuantity > 0 ? totalPayable / totalQuantity : 0;

        return {
            turnover: totalTurnover,
            brokerage: totalBrokerage,
            exchange: totalExchange,
            sebi: totalSebi,
            gst: totalGst,
            stt: totalStt,
            stamp: totalStamp,
            total_charges: totalCharges,
            total_payable: totalPayable,
            avg_cost_per_share: avgCostPerShare,
            quantity: totalQuantity
        };
    }

    function computeCalcSellSide(sellPrice, sellQuantity, totalBuyQuantity, totalBuyPayable) {
        const sellCharges = window.stockCalculations.calculateSellCharges(sellPrice, sellQuantity);

        // Proportional buy cost for sold quantity
        let proportionalBuyCost = totalBuyPayable;
        if (sellQuantity !== totalBuyQuantity && totalBuyQuantity > 0) {
            proportionalBuyCost = (totalBuyPayable / totalBuyQuantity) * sellQuantity;
        }

        const netPnL = sellCharges.netReceivable - proportionalBuyCost;
        const pnlPercent = proportionalBuyCost > 0 ? (netPnL / proportionalBuyCost) * 100 : 0;

        return {
            turnover: sellCharges.turnover,
            brokerage: sellCharges.brokerage,
            exchange: sellCharges.exchangeCharges,
            sebi: sellCharges.sebiCharges,
            stt: sellCharges.stt,
            trade_gst: sellCharges.tradeGst,
            dp_total: sellCharges.dpCharges,
            dp_gst: sellCharges.dpGst,
            contract_note_total: sellCharges.contractNoteTotal,
            external_deductions: sellCharges.dpCharges + sellCharges.dpGst,
            net_receivable: sellCharges.netReceivable,
            total_charges: sellCharges.totalCharges,
            netPnL: netPnL,
            pnlPercent: pnlPercent
        };
    }

    async function calculateCalcCharges() {
        const calcCalculateBtn = document.getElementById('calcCalculateBtn');
        if (!calcCalculateBtn) return;

        const originalText = calcCalculateBtn.innerText;
        calcCalculateBtn.innerText = "Calculating...";
        calcCalculateBtn.disabled = true;

        // Subtle delay for dynamic user feedback feel
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
            const buyRows = getCalcBuyRowsFromDOM();
            if (buyRows.length === 0) {
                throw new Error("Please enter at least one valid buy price and quantity.");
            }

            const sellPriceInput = document.getElementById('calcSellPrice');
            const sellQtyInput = document.getElementById('calcSellQuantity');

            if (!sellPriceInput || !sellQtyInput) return;

            const sellPrice = parseFloat(sellPriceInput.value);
            const sellQuantity = parseInt(sellQtyInput.value);

            if (isNaN(sellPrice) || sellPrice <= 0) {
                throw new Error("Please enter a valid target Sell Price.");
            }
            if (isNaN(sellQuantity) || sellQuantity <= 0) {
                throw new Error("Please enter a valid Sell Quantity.");
            }

            const buyData = computeCalcBuySide(buyRows);
            const sellData = computeCalcSellSide(sellPrice, sellQuantity, buyData.quantity, buyData.total_payable);

            updateCalcUI({
                buy: buyData,
                sell: sellData,
                pnl: {
                    net: sellData.netPnL,
                    percent: sellData.pnlPercent
                }
            });

        } catch (error) {
            console.error('Calculator error:', error);
            if (typeof showToast === 'function') {
                showToast(error.message, 'error');
            } else {
                alert(error.message);
            }
        } finally {
            calcCalculateBtn.innerText = originalText;
            calcCalculateBtn.disabled = false;
        }
    }

    async function findCalcBreakeven() {
        const calcBreakevenBtn = document.getElementById('calcBreakevenBtn');
        if (!calcBreakevenBtn) return;

        const originalText = calcBreakevenBtn.innerText;
        calcBreakevenBtn.innerText = "Finding...";
        calcBreakevenBtn.disabled = true;

        try {
            const buyRows = getCalcBuyRowsFromDOM();
            if (buyRows.length === 0) {
                throw new Error("Please enter buy price and quantity first.");
            }

            const buyData = computeCalcBuySide(buyRows);
            const sellQtyInput = document.getElementById('calcSellQuantity');
            
            if (!sellQtyInput) return;

            let sellQuantity = parseInt(sellQtyInput.value);
            if (!sellQuantity || sellQuantity <= 0) {
                sellQuantity = buyData.quantity;
                sellQtyInput.value = sellQuantity;
                sellQtyInput.dataset.autoFilled = 'true';
            }

            // Binary search to find the minimum sell price that makes net profit >= 0
            const avgBuyPrice = buyData.quantity > 0 ? (buyData.turnover / buyData.quantity) : 0;
            let low = avgBuyPrice;
            let high = avgBuyPrice * 2 + 100; // Safe upper bound
            let candidatePrice = low;

            while ((high - low) > 0.005) {
                let mid = (low + high) / 2;
                const result = computeCalcSellSide(mid, sellQuantity, buyData.quantity, buyData.total_payable);

                if (result.netPnL >= 0) {
                    candidatePrice = mid;
                    high = mid; // Search in lower pricing region
                } else {
                    low = mid;  // Increase pricing limit
                }
            }

            candidatePrice = Math.round(candidatePrice * 100) / 100;

            const sellPriceInput = document.getElementById('calcSellPrice');
            if (sellPriceInput) {
                sellPriceInput.value = candidatePrice.toFixed(2);
            }

            // Instantly trigger full breakdown update
            calculateCalcCharges();

        } catch (error) {
            console.error('Breakeven error:', error);
            if (typeof showToast === 'function') {
                showToast(error.message, 'error');
            } else {
                alert(error.message);
            }
        } finally {
            calcBreakevenBtn.innerText = originalText;
            calcBreakevenBtn.disabled = false;
        }
    }

    function updateCalcUI(data) {
        const resultsContainer = document.getElementById('calcResultsContainer');
        if (!resultsContainer) return;

        const buy = data.buy;
        const sell = data.sell;
        const pnl = data.pnl;

        const format = (num) => "₹" + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Net P&L Summary Dashboard
        const pnlValEl = document.getElementById('calcNetPnL');
        const pnlPercentEl = document.getElementById('calcNetPnLPercent');
        const pnlCardEl = document.getElementById('calcPnlCard');

        if (pnlValEl && pnlPercentEl) {
            pnlValEl.innerText = (pnl.net >= 0 ? "+" : "") + format(pnl.net);
            pnlPercentEl.innerText = `(${pnl.net >= 0 ? "+" : ""}${pnl.percent.toFixed(2)}%)`;

            const isProfit = pnl.net >= 0;
            pnlValEl.className = 'pnl-value ' + (isProfit ? 'profit' : 'loss');
            pnlPercentEl.className = 'pnl-percent ' + (isProfit ? 'profit' : 'loss');
        }

        // Buy Side Detailed Breakdown Card
        const elements = {
            calcBuyTurnover: buy.turnover,
            calcBuyBrokerage: buy.brokerage,
            calcBuyExchange: buy.exchange,
            calcBuySebi: buy.sebi,
            calcBuyStamp: buy.stamp,
            calcBuyGst: buy.gst,
            calcBuyTotalCharges: buy.total_charges,
            calcBuyEffectiveCost: buy.total_payable,

            calcSellTurnover: sell.turnover,
            calcSellBrokerage: sell.brokerage,
            calcSellExchange: sell.exchange,
            calcSellSebi: sell.sebi,
            calcSellStt: sell.stt,
            calcSellTradeGst: sell.trade_gst,
            calcSellDp: sell.dp_total,
            calcSellDpGst: sell.dp_gst,
            calcSellTotalCharges: sell.total_charges,
            calcSellEffectiveValue: sell.net_receivable
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.innerText = format(value);
        }

        // Display results block smoothly
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function handleGridNavigation(event) {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;

        const calculatorModal = document.getElementById('calculatorModal');
        if (!calculatorModal || calculatorModal.style.display !== 'flex') return;

        const activeInput = document.activeElement;
        if (!activeInput || !activeInput.classList.contains('calc-input')) return;

        // Select all calculator inputs in current DOM order
        const inputs = Array.from(calculatorModal.querySelectorAll('.calc-input'));
        const currentIndex = inputs.indexOf(activeInput);
        if (currentIndex === -1) return;

        // Spreadsheet grid assumption: 2 columns per input row (Price | Quantity)
        const COLUMNS = 2;
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

        // Shift focus and select text for effortless grid entry
        if (targetIndex >= 0 && targetIndex < inputs.length) {
            event.preventDefault();
            inputs[targetIndex].focus();
            setTimeout(() => inputs[targetIndex].select(), 0);
        }
    }
})();
