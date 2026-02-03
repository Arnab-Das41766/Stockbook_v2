// Dashboard logic for stock journal

let currentEditId = null;
let allStocks = []; // Store all loaded stocks
let expandedStocks = new Set(); // Track which stocks are expanded

// Expose globally for expandable-rows.js
window.allStocks = allStocks;
window.expandedStocks = expandedStocks;

// Initialize dashboard
async function initDashboard() {
    // Check authentication
    await window.auth.redirectIfNotAuthenticated();

    // Display user email
    const user = await window.auth.getCurrentUser();
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
    }

    // Load stocks
    await loadStocks();

    // Set up event listeners
    setupEventListeners();
}

// Load all stocks from database
async function loadStocks() {
    const stocks = await window.stockAPI.fetchStocks();
    allStocks = stocks; // Store for detail view access
    window.allStocks = allStocks; // Update global reference
    window.renderExpandableStocks(stocks);
    updatePortfolioSummary(stocks);
}

// Render stocks in table
function renderStocks(stocks) {
    const tbody = document.getElementById('stockTableBody');

    if (stocks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-state">
                    No stocks yet. Click "+ Add New Stock" to populate your portfolio!
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = stocks.map(stock => {
        const totalBuyCost = stock.buy_price * stock.buy_quantity + stock.buy_charges;
        return `
        <tr data-id="${stock.id}">
            <td class="stock-name-cell">${stock.stock_name}</td>
            <td>₹${stock.buy_price.toFixed(2)}</td>
            <td>${stock.buy_quantity}</td>
            <td>₹${stock.buy_charges.toFixed(2)}</td>
            <td><strong>₹${totalBuyCost.toFixed(2)}</strong></td>
            <td>₹${stock.breakeven_price.toFixed(2)}</td>
            <td>${stock.sell_price > 0 ? '₹' + stock.sell_price.toFixed(2) : '-'}</td>
            <td>${stock.sell_quantity > 0 ? stock.sell_quantity : '-'}</td>
            <td>${stock.sell_charges > 0 ? '₹' + stock.sell_charges.toFixed(2) : '-'}</td>
            <td class="${stock.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">
                ${stock.pnl >= 0 ? '+' : ''}₹${stock.pnl.toFixed(2)}
            </td>
            <td>
                <button class="action-btn view-btn" data-id="${stock.id}" title="View Details">👁️</button>
                <button class="action-btn edit-btn" data-id="${stock.id}" title="Edit">✏️</button>
                <button class="action-btn delete-btn" data-id="${stock.id}" title="Delete">🗑️</button>
            </td>
        </tr>
        `;
    }).join('');

    // Add event listeners to action buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            viewStockDetails(id);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editStock(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteStock(btn.dataset.id));
    });
}

// Update portfolio summary
function updatePortfolioSummary(stocks) {
    const totalStocks = stocks.length;

    // Calculate totals
    const totalPnL = stocks.reduce((sum, stock) => sum + stock.pnl, 0);

    const totalInvested = stocks.reduce((sum, stock) => {
        // Total Buy Cost = (Price * Qty) + Buy Charges
        return sum + (stock.buy_price * stock.buy_quantity + stock.buy_charges);
    }, 0);

    const currentValue = totalInvested + totalPnL;

    // Update DOM elements
    document.getElementById('totalInvestedDisplay').textContent = `₹${totalInvested.toFixed(2)}`;
    document.getElementById('currentValueDisplay').textContent = `₹${currentValue.toFixed(2)}`;
    document.getElementById('activeStocksDisplay').textContent = totalStocks;

    const pnlElement = document.getElementById('totalPnLDisplay');
    pnlElement.textContent = `${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toFixed(2)}`;
    pnlElement.className = `stat-number ${totalPnL >= 0 ? 'pnl-positive' : 'pnl-negative'}`;
}

// Set up event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        window.auth.logout();
    });

    // Add stock button
    document.getElementById('addStockBtn').addEventListener('click', () => {
        openModal();
    });

    // Modal close button
    document.querySelector('.close-modal').addEventListener('click', () => {
        closeModal();
    });

    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => {
        closeModal();
    });

    // Form submit
    document.getElementById('stockForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveStock();
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('stockModal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Open modal for add/edit
function openModal(stock = null) {
    const modal = document.getElementById('stockModal');
    const form = document.getElementById('stockForm');
    const title = document.getElementById('modalTitle');
    const purchaseDateInput = document.getElementById('purchaseDate');

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];

    if (stock) {
        // Edit mode
        title.textContent = 'Edit Stock Entry';
        document.getElementById('stockName').value = stock.stock_name;
        document.getElementById('buyPrice').value = stock.buy_price;
        document.getElementById('buyQuantity').value = stock.buy_quantity;
        document.getElementById('sellPrice').value = stock.sell_price || '';
        document.getElementById('sellQuantity').value = stock.sell_quantity || '';
        purchaseDateInput.value = stock.purchase_date || today;
        currentEditId = stock.id;
    } else {
        // Add mode
        title.textContent = 'Add Stock Entry';
        form.reset();
        purchaseDateInput.value = today;
        currentEditId = null;
    }

    modal.style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('stockModal').style.display = 'none';
    document.getElementById('stockForm').reset();
    currentEditId = null;
}

// Save stock (create or update)
async function saveStock() {
    const stockData = {
        stock_name: document.getElementById('stockName').value.trim(),
        buy_price: parseFloat(document.getElementById('buyPrice').value),
        buy_quantity: parseInt(document.getElementById('buyQuantity').value),
        sell_price: parseFloat(document.getElementById('sellPrice').value) || 0,
        sell_quantity: parseInt(document.getElementById('sellQuantity').value) || 0,
        purchase_date: document.getElementById('purchaseDate').value
    };

    // Validation
    if (!stockData.stock_name || !stockData.buy_price || !stockData.buy_quantity) {
        alert('Please fill in all required fields');
        return;
    }

    if (stockData.sell_quantity > stockData.buy_quantity) {
        alert('Cannot sell more shares than you bought!');
        return;
    }

    try {
        if (currentEditId) {
            // Update existing
            await window.stockAPI.updateStock(currentEditId, stockData);
        } else {
            // Create new
            await window.stockAPI.createStock(stockData);
        }

        closeModal();
        await loadStocks();
    } catch (error) {
        // Error already shown in stockAPI
    }
}

// Edit stock
async function editStock(id) {
    const stocks = await window.stockAPI.fetchStocks();
    const stock = stocks.find(s => s.id == id);
    if (stock) {
        openModal(stock);
    }
}

// Delete stock
async function deleteStock(id) {
    if (confirm('Are you sure you want to delete this stock entry?')) {
        try {
            await window.stockAPI.deleteStock(id);
            await loadStocks();
        } catch (error) {
            // Error already shown in stockAPI
        }
    }
}

// ===== Detail View Modal Functions =====

// View stock details
async function viewStockDetails(id) {
    try {
        console.log('Opening detail view for stock ID:', id, 'Type:', typeof id);
        console.log('All stocks:', allStocks);

        // Use loose equality to handle string vs number comparison
        const stock = allStocks.find(s => s.id == id);

        if (!stock) {
            console.error('Stock not found with ID:', id);
            console.error('Available stock IDs:', allStocks.map(s => ({ id: s.id, type: typeof s.id })));
            alert('Error: Stock data not found. Please refresh the page and try again.');
            return;
        }

        openDetailModal(stock);
    } catch (error) {
        console.error('Error opening detail view:', error);
        alert('Error opening detail view. Please try again.');
    }
}

// View aggregated stock details for parent rows
function viewAggregatedStockDetails(stockName) {
    try {
        console.log('Opening aggregated detail view for stock:', stockName);

        // Find all stocks with this name
        const normalizedName = stockName.toUpperCase();
        const stockGroup = allStocks.filter(s => s.stock_name.toUpperCase() === normalizedName);

        if (stockGroup.length === 0) {
            console.error('No stocks found with name:', stockName);
            alert('Error: Stock data not found. Please refresh the page and try again.');
            return;
        }

        // Calculate aggregated stock data
        const aggregated = window.stockGrouping.calculateAggregatedStock(stockGroup);

        // Create a virtual stock object with aggregated data for the detail modal
        const aggregatedStock = {
            stock_name: aggregated.stock_name,
            buy_price: aggregated.avg_buy_price,
            buy_quantity: aggregated.total_qty_bought,
            sell_quantity: aggregated.total_qty_sold,
            buy_charges: aggregated.total_buy_charges,
            sell_price: aggregated.avg_sell_price,
            sell_charges: aggregated.total_sell_charges,
            breakeven_price: aggregated.breakeven_price,
            pnl: aggregated.total_pnl,
            // Add flag to indicate this is aggregated data
            _isAggregated: true,
            _purchaseCount: stockGroup.length
        };

        openDetailModal(aggregatedStock);
    } catch (error) {
        console.error('Error opening aggregated detail view:', error);
        alert('Error opening detail view. Please try again.');
    }
}

// Open detail modal and display calculations
function openDetailModal(stock) {
    try {
        console.log('Opening modal for stock:', stock);

        const detailModal = document.getElementById('detailModal');
        const stockNameEl = document.getElementById('detailStockName');

        if (!detailModal) {
            throw new Error('Detail modal element not found');
        }

        if (!stockNameEl) {
            throw new Error('Stock name element not found');
        }

        // Set stock name
        stockNameEl.textContent = `${stock.stock_name} - Detailed Breakdown`;

        // Calculate and display breakdown
        calculateAndDisplayBreakdown(stock);

        // Show modal
        detailModal.style.display = 'flex';

        console.log('Modal opened successfully');
    } catch (error) {
        console.error('Error in openDetailModal:', error);
        throw error; // Re-throw to be caught by viewStockDetails
    }
}

// Close detail modal
function closeDetailModal() {
    const detailModal = document.getElementById('detailModal');
    detailModal.style.display = 'none';
}

// Calculate and display breakdown
function calculateAndDisplayBreakdown(stock) {
    try {
        console.log('Calculating breakdown for stock:', stock);

        // Check if calculations module is available
        if (!window.stockCalculations) {
            throw new Error('Stock calculations module not loaded');
        }

        // Calculate buy side
        const buyChargesData = window.stockCalculations.calculateBuyCharges(
            stock.buy_price,
            stock.buy_quantity
        );

        console.log('Buy charges calculated:', buyChargesData);

        // Calculate sell side (if sold)
        let sellChargesData = null;
        let pnl = 0;
        let pnlPercent = 0;

        if (stock.sell_price > 0 && stock.sell_quantity > 0) {
            sellChargesData = window.stockCalculations.calculateSellCharges(
                stock.sell_price,
                stock.sell_quantity
            );

            // Calculate P&L
            const totalBuyPaid = buyChargesData.turnover + buyChargesData.totalCharges;
            const totalSellReceived = sellChargesData.netReceivable;
            pnl = totalSellReceived - totalBuyPaid;
            pnlPercent = (pnl / totalBuyPaid) * 100;
        }

        // Update P&L Card
        const pnlCard = document.getElementById('detailPnlCard');
        const netPnLEl = document.getElementById('detailNetPnL');
        const netPnLPercentEl = document.getElementById('detailNetPnLPercent');

        if (stock.sell_price > 0 && stock.sell_quantity > 0) {
            netPnLEl.textContent = `${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(2)}`;
            netPnLPercentEl.textContent = `(${pnl >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`;
            pnlCard.className = `pnl-card ${pnl >= 0 ? 'profit' : 'loss'}`;
        } else {
            netPnLEl.textContent = 'Not Sold Yet';
            netPnLPercentEl.textContent = '';
            pnlCard.className = 'pnl-card';
        }

        // Update Buy Side
        document.getElementById('detailBuyTurnover').textContent = `₹${buyChargesData.turnover.toFixed(2)}`;
        document.getElementById('detailBuyBrokerage').textContent = `₹${buyChargesData.brokerage.toFixed(2)}`;
        document.getElementById('detailBuyExchange').textContent = `₹${buyChargesData.exchangeCharges.toFixed(2)}`;
        document.getElementById('detailBuySebi').textContent = `₹${buyChargesData.sebiCharges.toFixed(2)}`;
        document.getElementById('detailBuyGst').textContent = `₹${buyChargesData.gst.toFixed(2)}`;
        document.getElementById('detailBuyStt').textContent = `₹${buyChargesData.stt.toFixed(2)}`;
        document.getElementById('detailBuyStamp').textContent = `₹${buyChargesData.stampDuty.toFixed(2)}`;
        document.getElementById('detailBuyTotalCharges').textContent = `₹${buyChargesData.totalCharges.toFixed(2)}`;
        document.getElementById('detailBuyTotalPayable').textContent = `₹${(buyChargesData.turnover + buyChargesData.totalCharges).toFixed(2)}`;

        // Update Sell Side
        if (sellChargesData) {
            document.getElementById('detailSellTurnover').textContent = `₹${sellChargesData.turnover.toFixed(2)}`;
            document.getElementById('detailSellBrokerage').textContent = `₹${sellChargesData.brokerage.toFixed(2)}`;
            document.getElementById('detailSellExchange').textContent = `₹${sellChargesData.exchangeCharges.toFixed(2)}`;
            document.getElementById('detailSellSebi').textContent = `₹${sellChargesData.sebiCharges.toFixed(2)}`;
            document.getElementById('detailSellStt').textContent = `₹${sellChargesData.stt.toFixed(2)}`;
            document.getElementById('detailSellTradeGst').textContent = `₹${sellChargesData.tradeGst.toFixed(2)}`;
            document.getElementById('detailContractNoteTotal').textContent = `₹${sellChargesData.contractNoteTotal.toFixed(2)}`;
            document.getElementById('detailSellDp').textContent = `₹${sellChargesData.dpCharges.toFixed(2)}`;
            document.getElementById('detailSellDpGst').textContent = `₹${sellChargesData.dpGst.toFixed(2)}`;
            document.getElementById('detailSellTotalCharges').textContent = `₹${sellChargesData.totalCharges.toFixed(2)}`;
            document.getElementById('detailSellNetReceivable').textContent = `₹${sellChargesData.netReceivable.toFixed(2)}`;
        } else {
            // Show dashes for unsold stocks
            document.getElementById('detailSellTurnover').textContent = '-';
            document.getElementById('detailSellBrokerage').textContent = '-';
            document.getElementById('detailSellExchange').textContent = '-';
            document.getElementById('detailSellSebi').textContent = '-';
            document.getElementById('detailSellStt').textContent = '-';
            document.getElementById('detailSellTradeGst').textContent = '-';
            document.getElementById('detailContractNoteTotal').textContent = '-';
            document.getElementById('detailSellDp').textContent = '-';
            document.getElementById('detailSellDpGst').textContent = '-';
            document.getElementById('detailSellTotalCharges').textContent = '-';
            document.getElementById('detailSellNetReceivable').textContent = '-';
        }

        console.log('Breakdown calculation completed successfully');
    } catch (error) {
        console.error('Error in calculateAndDisplayBreakdown:', error);
        throw error; // Re-throw to be caught by openDetailModal
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initDashboard);

// Add close button event listener for detail modal
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.querySelector('.close-detail-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDetailModal);
    }

    // Close modal when clicking outside
    const detailModal = document.getElementById('detailModal');
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target.id === 'detailModal') {
                closeDetailModal();
            }
        });
    }
});
