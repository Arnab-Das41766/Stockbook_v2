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

    // Initialize ApexCharts
    initCharts();

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
    filterAndRenderStocks();
    updateStockNameAutocomplete(); // Update the stock autocomplete history datalist
    updatePortfolioSummary(stocks);
}

// Update stock name datalist based on user's past transaction history
function updateStockNameAutocomplete() {
    const datalist = document.getElementById('stockHistoryList');
    if (!datalist || !allStocks) return;

    // Extract unique sorted stock names
    const uniqueNames = [...new Set(allStocks.map(stock => stock.stock_name.trim().toUpperCase()))]
        .sort((a, b) => a.localeCompare(b));

    // Populate datalist with option tags
    datalist.innerHTML = uniqueNames.map(name => `<option value="${name}"></option>`).join('');
}

// ===== Toast & Dialog System =====

// Display a sliding glassmorphic toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // Remove duplicates if any
    const activeToasts = container.querySelectorAll('.toast');
    activeToasts.forEach(t => {
        if (t.innerText.includes(message)) t.remove();
    });

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';

    toast.innerHTML = `
        <span style="font-size: 1.1rem;">${icon}</span>
        <div style="flex-grow: 1;">${message}</div>
    `;

    container.appendChild(toast);

    // Auto remove after 3.5 seconds
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3500);
}

// Display a non-blocking glassmorphic confirmation modal
function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const msgEl = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYesBtn');
    const noBtn = document.getElementById('confirmNoBtn');

    if (!modal || !msgEl || !yesBtn || !noBtn) {
        if (confirm(message)) {
            onConfirm();
        }
        return;
    }

    msgEl.textContent = message;
    modal.style.display = 'flex';

    const cleanup = () => {
        modal.style.display = 'none';
        yesBtn.onclick = null;
        noBtn.onclick = null;
    };

    yesBtn.onclick = () => {
        cleanup();
        onConfirm();
    };

    noBtn.onclick = () => {
        cleanup();
    };
}

// Expose globally for interception of API alerts
window.showToast = showToast;
window.showConfirm = showConfirm;
window.alert = function(msg) {
    showToast(msg, 'error');
};

// Filter and render stocks based on search input and status filter segmented tabs
function filterAndRenderStocks() {
    const searchInput = document.getElementById('searchInput');
    const activeTab = document.querySelector('.tab-btn.active');
    
    const searchQuery = searchInput ? searchInput.value.trim().toUpperCase() : '';
    const filterValue = activeTab ? activeTab.dataset.filter : 'active';

    // Calculate dynamic counting badges representing distinct stock positions per category
    if (window.stockGrouping) {
        const activeEntries = allStocks.filter(stock => (stock.buy_quantity - (stock.sell_quantity || 0)) > 0);
        const closedEntries = allStocks.filter(stock => (stock.buy_quantity - (stock.sell_quantity || 0)) === 0);
        
        const groupedActive = window.stockGrouping.groupStocksByName(activeEntries);
        const groupedClosed = window.stockGrouping.groupStocksByName(closedEntries);
        const groupedAll = window.stockGrouping.groupStocksByName(allStocks);

        const activeCount = Object.keys(groupedActive).length;
        const closedCount = Object.keys(groupedClosed).length;
        const allCount = Object.keys(groupedAll).length;

        const activeBadge = document.getElementById('activeCountBadge');
        const closedBadge = document.getElementById('closedCountBadge');
        const allBadge = document.getElementById('allCountBadge');

        if (activeBadge) activeBadge.textContent = activeCount;
        if (closedBadge) closedBadge.textContent = closedCount;
        if (allBadge) allBadge.textContent = allCount;
    }

    const filtered = allStocks.filter(stock => {
        // 1. Name Match
        const matchesSearch = stock.stock_name.toUpperCase().includes(searchQuery);

        // 2. Status Match (filtered at the individual transaction level as requested)
        const remaining = stock.buy_quantity - (stock.sell_quantity || 0);
        let matchesStatus = true;
        if (filterValue === 'active') {
            matchesStatus = remaining > 0;
        } else if (filterValue === 'closed') {
            matchesStatus = remaining === 0;
        }

        return matchesSearch && matchesStatus;
    });

    window.renderExpandableStocks(filtered);
    updateCharts(filtered);
}

// ===== ApexCharts System =====
let allocationChart = null;
let valueChart = null;

function initCharts() {
    const allocationOptions = {
        chart: {
            type: 'donut',
            height: 280,
            background: 'transparent',
            foreColor: '#94a3b8',
            fontFamily: 'inherit'
        },
        series: [],
        labels: [],
        theme: {
            mode: 'dark',
            palette: 'palette1'
        },
        stroke: {
            show: false
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Invested',
                            formatter: function (w) {
                                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                return '₹' + total.toFixed(0);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        legend: {
            position: 'bottom'
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return '₹' + val.toFixed(2);
                }
            }
        }
    };
    
    const valueOptions = {
        chart: {
            type: 'bar',
            height: 280,
            background: 'transparent',
            foreColor: '#94a3b8',
            fontFamily: 'inherit',
            toolbar: { show: false }
        },
        series: [
            { name: 'Invested', data: [] },
            { name: 'Current Value', data: [] }
        ],
        xaxis: {
            categories: []
        },
        colors: ['#3b82f6', '#10b981'],
        theme: {
            mode: 'dark'
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 4
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return '₹' + val.toFixed(2);
                }
            }
        }
    };

    const allocEl = document.getElementById('allocationChart');
    const valEl = document.getElementById('valueChart');

    if (allocEl && typeof ApexCharts !== 'undefined') {
        allocationChart = new ApexCharts(allocEl, allocationOptions);
        allocationChart.render();
    }
    
    if (valEl && typeof ApexCharts !== 'undefined') {
        valueChart = new ApexCharts(valEl, valueOptions);
        valueChart.render();
    }
}

function updateCharts(stocks) {
    if (typeof ApexCharts === 'undefined') return;

    const grouped = window.stockGrouping.groupStocksByName(stocks);
    
    const labels = [];
    const allocationSeries = [];
    const investedData = [];
    const valueData = [];

    for (const name in grouped) {
        const aggregated = window.stockGrouping.calculateAggregatedStock(grouped[name]);
        
        if (aggregated.total_cost > 0) {
            labels.push(aggregated.stock_name);
            allocationSeries.push(parseFloat(aggregated.total_cost.toFixed(2)));
            investedData.push(parseFloat(aggregated.total_cost.toFixed(2)));
            valueData.push(parseFloat((aggregated.total_cost + aggregated.total_pnl).toFixed(2)));
        }
    }

    if (allocationChart) {
        allocationChart.updateOptions({
            series: allocationSeries,
            labels: labels
        });
    }

    if (valueChart) {
        valueChart.updateOptions({
            series: [
                { name: 'Invested', data: investedData },
                { name: 'Current Value', data: valueData }
            ],
            xaxis: {
                categories: labels
            }
        });
    }
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
    let activeHoldingsCost = 0;
    let totalRealizedCash = 0;
    let totalRealizedPnL = 0;
    const activeStockNames = new Set();

    stocks.forEach(stock => {
        // Calculate buy charges and total paid
        const buyCharges = window.stockCalculations.calculateBuyCharges(stock.buy_price, stock.buy_quantity);
        const totalBuyPaid = buyCharges.turnover + buyCharges.totalCharges;

        // Calculate remaining quantity
        const remainingQty = stock.buy_quantity - (stock.sell_quantity || 0);

        if (remainingQty > 0) {
            const avgBuyCostPerShare = totalBuyPaid / stock.buy_quantity;
            const proportionalBuyCost = avgBuyCostPerShare * remainingQty;
            activeHoldingsCost += proportionalBuyCost;
            activeStockNames.add(stock.stock_name.trim().toUpperCase());
        }

        // Calculate realized sales
        if (stock.sell_price > 0 && stock.sell_quantity > 0) {
            const sellCharges = window.stockCalculations.calculateSellCharges(stock.sell_price, stock.sell_quantity);
            totalRealizedCash += sellCharges.netReceivable;

            const avgBuyCostPerShare = totalBuyPaid / stock.buy_quantity;
            const proportionalBuyCost = avgBuyCostPerShare * stock.sell_quantity;
            const pnl = sellCharges.netReceivable - proportionalBuyCost;
            totalRealizedPnL += pnl;
        }
    });

    const activePositionsCount = activeStockNames.size;

    // Update DOM elements
    document.getElementById('totalInvestedDisplay').textContent = `₹${activeHoldingsCost.toFixed(2)}`;
    document.getElementById('currentValueDisplay').textContent = `₹${totalRealizedCash.toFixed(2)}`;
    document.getElementById('activeStocksDisplay').textContent = activePositionsCount;

    const pnlElement = document.getElementById('totalPnLDisplay');
    pnlElement.textContent = `${totalRealizedPnL >= 0 ? '+' : ''}₹${totalRealizedPnL.toFixed(2)}`;
    pnlElement.className = `stat-number ${totalRealizedPnL >= 0 ? 'pnl-positive' : 'pnl-negative'}`;
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

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterAndRenderStocks);
    }

    // Segmented tab controls
    const tabContainer = document.getElementById('portfolioTabs');
    if (tabContainer) {
        tabContainer.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                tabContainer.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                filterAndRenderStocks();
            });
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
            if (e.key === 'Escape') {
                closeModal();
                closeDetailModal();
            }
            return;
        }

        if (e.key.toLowerCase() === 'n') {
            e.preventDefault();
            openModal();
        }

        if (e.key === '/') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
        }

        if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
        }

        if (e.key === 'Escape') {
            closeModal();
            closeDetailModal();
        }
    });

    // Export dropdown toggle & listeners
    const exportBtn = document.getElementById('exportBtn');
    const exportMenu = document.getElementById('exportMenu');
    if (exportBtn && exportMenu) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = exportMenu.style.display === 'block';
            exportMenu.style.display = isVisible ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', () => {
            exportMenu.style.display = 'none';
        });

        // Export as CSV
        const exportCSVBtn = document.getElementById('exportCSVBtn');
        if (exportCSVBtn) {
            exportCSVBtn.addEventListener('click', (e) => {
                e.preventDefault();
                exportToCSV();
            });
        }

        // Export as Excel
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                exportToExcel();
            });
        }

        // Export as JSON
        const exportJSONBtn = document.getElementById('exportJSONBtn');
        if (exportJSONBtn) {
            exportJSONBtn.addEventListener('click', (e) => {
                e.preventDefault();
                exportToJSON();
            });
        }
    }

    // Initialize keyboard navigation for the stock entry form
    setupFormKeyboardNavigation();
}

// Set up spreadsheet-like keyboard arrow and Enter navigation for stock entry inputs
function setupFormKeyboardNavigation() {
    const stockName = document.getElementById('stockName');
    const purchaseDate = document.getElementById('purchaseDate');
    const buyPrice = document.getElementById('buyPrice');
    const buyQuantity = document.getElementById('buyQuantity');
    const sellPrice = document.getElementById('sellPrice');
    const sellQuantity = document.getElementById('sellQuantity');

    if (!stockName || !purchaseDate || !buyPrice || !buyQuantity || !sellPrice || !sellQuantity) {
        console.warn('Keyboard navigation inputs not fully found');
        return;
    }

    // 2D grid mapping: rows and columns for spreadsheet arrow navigation
    const grid = [
        [stockName],
        [purchaseDate],
        [buyPrice, buyQuantity],
        [sellPrice, sellQuantity]
    ];

    // 1D sequential order for Enter key navigation
    const sequence = [
        stockName,
        purchaseDate,
        buyPrice,
        buyQuantity,
        sellPrice,
        sellQuantity
    ];

    // Function to check if selection is at the start (for ArrowLeft)
    function isAtStart(input) {
        try {
            if (input.type === 'text') {
                return input.selectionStart === 0 && input.selectionEnd === 0;
            }
        } catch (e) {
            // Ignore error if selection properties are not supported
        }
        return true; // For other types like number/date, treat as boundary to allow immediate movement
    }

    // Function to check if selection is at the end (for ArrowRight)
    function isAtEnd(input) {
        try {
            if (input.type === 'text') {
                return input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
            }
        } catch (e) {
            // Ignore error
        }
        return true; // For other types like number/date, allow immediate movement
    }

    // Helper to safely focus and select content
    function focusAndSelect(input) {
        if (!input) return;
        input.focus();
        // date inputs might throw error or do nothing on select(), so we catch it
        try {
            input.select();
        } catch (e) {
            // Ignore select errors
        }
    }

    // Attach keydown listener to each input in the sequence
    sequence.forEach(input => {
        input.addEventListener('keydown', (e) => {
            // Skip handling if standard modifiers are pressed (Ctrl, Alt, Shift, Meta)
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            // Shift+Enter can go backwards, Enter goes forward
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Go backward in sequence
                    const index = sequence.indexOf(input);
                    if (index > 0) {
                        e.preventDefault();
                        focusAndSelect(sequence[index - 1]);
                    }
                } else {
                    // Go forward in sequence
                    const index = sequence.indexOf(input);
                    if (index < sequence.length - 1) {
                        e.preventDefault();
                        focusAndSelect(sequence[index + 1]);
                    }
                    // If it is the last element (sellQuantity), let default form submit handle it
                }
                return;
            }

            // Find current row and col in the grid
            let curRow = -1;
            let curCol = -1;
            for (let r = 0; r < grid.length; r++) {
                const c = grid[r].indexOf(input);
                if (c !== -1) {
                    curRow = r;
                    curCol = c;
                    break;
                }
            }

            if (curRow === -1 || curCol === -1) return;

            if (e.key === 'ArrowDown') {
                if (curRow < grid.length - 1) {
                    e.preventDefault();
                    const nextRow = grid[curRow + 1];
                    const targetCol = Math.min(curCol, nextRow.length - 1);
                    focusAndSelect(nextRow[targetCol]);
                }
            } else if (e.key === 'ArrowUp') {
                if (curRow > 0) {
                    e.preventDefault();
                    const prevRow = grid[curRow - 1];
                    const targetCol = Math.min(curCol, prevRow.length - 1);
                    focusAndSelect(prevRow[targetCol]);
                }
            } else if (e.key === 'ArrowRight') {
                // If it's a text input, only navigate when cursor is at the end
                if (isAtEnd(input)) {
                    const row = grid[curRow];
                    if (curCol < row.length - 1) {
                        e.preventDefault();
                        focusAndSelect(row[curCol + 1]);
                    }
                }
            } else if (e.key === 'ArrowLeft') {
                // If it's a text input, only navigate when cursor is at the start
                if (isAtStart(input)) {
                    const row = grid[curRow];
                    if (curCol > 0) {
                        e.preventDefault();
                        focusAndSelect(row[curCol - 1]);
                    }
                }
            }
        });
    });
}

// Open modal with pre-filled stock name for recording a new transaction
function openModalForStock(stockName) {
    const modal = document.getElementById('stockModal');
    const form = document.getElementById('stockForm');
    const title = document.getElementById('modalTitle');
    const purchaseDateInput = document.getElementById('purchaseDate');

    title.textContent = `New Transaction: ${stockName}`;
    form.reset();

    // Default date to today
    const today = new Date().toISOString().split('T')[0];
    purchaseDateInput.value = today;

    // Pre-fill stock name
    document.getElementById('stockName').value = stockName;
    currentEditId = null;

    modal.style.display = 'flex';

    // Autofocus and select text for rapid entry
    setTimeout(() => {
        const nameInput = document.getElementById('stockName');
        if (nameInput) {
            nameInput.focus();
            nameInput.select();
        }
    }, 50);
}

// Expose globally
window.openModalForStock = openModalForStock;

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

    // Autofocus and select text for rapid entry
    setTimeout(() => {
        const nameInput = document.getElementById('stockName');
        if (nameInput) {
            nameInput.focus();
            nameInput.select();
        }
    }, 50);
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
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (stockData.sell_quantity > stockData.buy_quantity) {
        showToast('Cannot sell more shares than you bought!', 'error');
        return;
    }

    try {
        if (currentEditId) {
            // Update existing
            await window.stockAPI.updateStock(currentEditId, stockData);
            showToast('Stock entry updated successfully!', 'success');
        } else {
            // Create new
            await window.stockAPI.createStock(stockData);
            showToast('Stock entry created successfully!', 'success');
        }

        closeModal();
        await loadStocks();
    } catch (error) {
        showToast('Failed to save stock: ' + error.message, 'error');
    }
}

// Edit stock
function editStock(id) {
    const stock = allStocks.find(s => s.id == id);
    if (stock) {
        openModal(stock);
    }
}

// Delete stock
async function deleteStock(id) {
    try {
        await window.stockAPI.deleteStock(id);
        showToast('Stock entry deleted successfully!', 'success');
        await loadStocks();
    } catch (error) {
        showToast('Failed to delete stock entry: ' + error.message, 'error');
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

// Expose function globally so expandable-rows.js can call it
window.viewAggregatedStockDetails = viewAggregatedStockDetails;


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

            // Calculate P&L proportionally on quantity sold
            const totalBuyPaid = buyChargesData.turnover + buyChargesData.totalCharges;
            const avgBuyCostPerShare = totalBuyPaid / stock.buy_quantity;
            const proportionalBuyCost = avgBuyCostPerShare * stock.sell_quantity;
            const totalSellReceived = sellChargesData.netReceivable;
            pnl = totalSellReceived - proportionalBuyCost;
            pnlPercent = (pnl / proportionalBuyCost) * 100;
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

// Export all stock transactions to CSV format
async function exportToCSV() {
    try {
        showToast('Preparing CSV export...', 'info');
        const stocks = await window.stockAPI.fetchStocks();
        if (!stocks || stocks.length === 0) {
            showToast('No transaction data to export', 'error');
            return;
        }

        // Define CSV header
        const headers = [
            'Stock Name', 
            'Purchase Date', 
            'Buy Price (INR)', 
            'Buy Quantity', 
            'Sell Price (INR)', 
            'Sell Quantity', 
            'Buy Charges (INR)', 
            'Sell Charges (INR)'
        ];

        // Map each stock object to a row
        const rows = stocks.map(stock => {
            // Calculate charges inline for export completeness
            const buyCharges = window.stockCalculations.calculateBuyCharges(stock.buy_price, stock.buy_quantity);
            const sellCharges = window.stockCalculations.calculateSellCharges(stock.sell_price || 0, stock.sell_quantity || 0);
            
            return [
                stock.stock_name.trim().toUpperCase(),
                stock.purchase_date,
                stock.buy_price.toFixed(2),
                stock.buy_quantity,
                (stock.sell_price || 0).toFixed(2),
                stock.sell_quantity || 0,
                buyCharges.totalCharges.toFixed(2),
                sellCharges.totalCharges.toFixed(2)
            ];
        });

        // Compile CSV Content
        const csvContent = [
            headers.join(','), 
            ...rows.map(row => row.map(val => `"${val}"`).join(','))
        ].join('\n');

        // Create file blob and trigger download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Stockbook_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('CSV exported successfully', 'success');
    } catch (error) {
        console.error('CSV export error:', error);
        showToast('Failed to export CSV', 'error');
    }
}

// Export all stock transactions to a premium, styled Excel (.xls) document
async function exportToExcel() {
    try {
        showToast('Preparing Excel export...', 'info');
        const stocks = await window.stockAPI.fetchStocks();
        if (!stocks || stocks.length === 0) {
            showToast('No transaction data to export', 'error');
            return;
        }

        // Define Headers
        const headers = [
            'Stock Name', 
            'Purchase Date', 
            'Buy Price (INR)', 
            'Buy Quantity', 
            'Sell Price (INR)', 
            'Sell Quantity', 
            'Buy Charges (INR)', 
            'Sell Charges (INR)',
            'Net P&L (INR)',
            'Status'
        ];

        // Create HTML table structure for Excel with harmonized design system styles
        let tableHtml = '<table border="1" style="font-family: Arial, sans-serif; border-collapse: collapse; width: 100%;">';
        tableHtml += '<tr style="background-color: #00d1b2; color: #ffffff; font-weight: bold; font-size: 13px;">';
        headers.forEach(h => {
            tableHtml += `<th style="padding: 10px; border: 1px solid #dddddd;">${h}</th>`;
        });
        tableHtml += '</tr>';

        stocks.forEach(stock => {
            const buyCharges = window.stockCalculations.calculateBuyCharges(stock.buy_price, stock.buy_quantity);
            const sellCharges = window.stockCalculations.calculateSellCharges(stock.sell_price || 0, stock.sell_quantity || 0);
            
            // Calculate proportional buy cost for sold quantity
            const totalBuyPaid = buyCharges.turnover + buyCharges.totalCharges;
            const avgBuyCostPerShare = totalBuyPaid / stock.buy_quantity;
            
            let pnl = 0;
            let status = 'Active';
            
            if (stock.sell_price > 0 && stock.sell_quantity > 0) {
                const proportionalBuyCost = avgBuyCostPerShare * stock.sell_quantity;
                pnl = sellCharges.netReceivable - proportionalBuyCost;
                status = (stock.buy_quantity === stock.sell_quantity) ? 'Completed' : 'Partial Exit';
            }

            const pnlColor = pnl >= 0 ? '#00c853' : '#d50000';
            const pnlStyle = pnl !== 0 ? `color: ${pnlColor}; font-weight: bold;` : '';

            tableHtml += '<tr style="font-size: 12px; background-color: #ffffff; color: #333333;">';
            tableHtml += `<td style="padding: 8px; border: 1px solid #dddddd; font-weight: bold;">${stock.stock_name.trim().toUpperCase()}</td>`;
            tableHtml += `<td style="padding: 8px; border: 1px solid #dddddd; text-align: center;">${stock.purchase_date}</td>`;
            tableHtml += `<td style="padding: 8px; border: 1px solid #dddddd; text-align: right;">${stock.buy_price.toFixed(2)}</td>`;
            tableHtml += `<td style="padding: 8px; border: 1px solid #dddddd; text-align: right;">${stock.buy_quantity}</td>`;
            tableHtml += `<td style="padding: 8px; border: 1px solid #dddddd; text-align: right;">${(stock.sell_price || 0).toFixed(2)}</td>`;
            tableHtml += `<td style="padding: 8px; border: 1px solid #dddddd; text-align: right;">${stock.sell_quantity || 0}</td>`;
            tableHtml += `<td style="padding: 8px; border: 1px solid #dddddd; text-align: right; color: #666666;">${buyCharges.totalCharges.toFixed(2)}</td>`;
            tableHtml += `<td style="padding: 8px; border: 1px solid #dddddd; text-align: right; color: #666666;">${sellCharges.totalCharges.toFixed(2)}</td>`;
            tableHtml += `<td style="padding: 8px; border: 1px solid #dddddd; text-align: right; ${pnlStyle}">${pnl !== 0 ? pnl.toFixed(2) : '-'}</td>`;
            tableHtml += `<td style="padding: 8px; border: 1px solid #dddddd; text-align: center; font-weight: bold; color: ${status === 'Active' ? '#00d1b2' : '#785df2'};">${status}</td>`;
            tableHtml += '</tr>';
        });
        
        tableHtml += '</table>';

        // Wrap HTML inside the Excel XML Schema
        const excelTemplate = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
            <!--[if gte mso 9]>
            <xml>
            <x:ExcelWorkbook>
            <x:ExcelWorksheets>
            <x:ExcelWorksheet>
            <x:Name>Portfolio Ledger</x:Name>
            <x:WorksheetOptions>
            <x:DisplayGridlines/>
            </x:WorksheetOptions>
            </x:ExcelWorksheet>
            </x:ExcelWorksheets>
            </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <meta charset="UTF-8">
            </head>
            <body>
            ${tableHtml}
            </body>
            </html>
        `;

        const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Stockbook_Export_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Excel document exported successfully', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        showToast('Failed to export Excel document', 'error');
    }
}

// Export all stock transactions to JSON format
async function exportToJSON() {
    try {
        showToast('Preparing JSON export...', 'info');
        const stocks = await window.stockAPI.fetchStocks();
        if (!stocks || stocks.length === 0) {
            showToast('No transaction data to export', 'error');
            return;
        }

        // Clean data format
        const cleanedStocks = stocks.map(stock => ({
            id: stock.id,
            stock_name: stock.stock_name.trim().toUpperCase(),
            purchase_date: stock.purchase_date,
            buy_price: stock.buy_price,
            buy_quantity: stock.buy_quantity,
            sell_price: stock.sell_price || 0,
            sell_quantity: stock.sell_quantity || 0,
            created_at: stock.created_at
        }));

        const dataStr = JSON.stringify(cleanedStocks, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Stockbook_Export_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('JSON exported successfully', 'success');
    } catch (error) {
        console.error('JSON export error:', error);
        showToast('Failed to export JSON', 'error');
    }
}

// ===== PWA Installation & Offline Support =====
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    const installBtn = document.getElementById('installPwaBtn');
    if (installBtn) {
        installBtn.style.display = 'flex';
    }
});

// Bind custom install button click
document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('installPwaBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`[PWA] User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again
            deferredPrompt = null;
            // Hide the custom install button
            installBtn.style.display = 'none';
        });
    }
});

window.addEventListener('appinstalled', (evt) => {
    console.log('[PWA] Stock Journal app was successfully installed!');
    const installBtn = document.getElementById('installPwaBtn');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
    showToast('Stock Journal App installed successfully!', 'success');
});

// Offline & Online Toast Notifications
window.addEventListener('offline', () => {
    showToast('You are currently offline. Using cached interface.', 'error');
});

window.addEventListener('online', () => {
    showToast('Connection restored. Back online!', 'success');
});
