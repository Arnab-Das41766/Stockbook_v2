// Dashboard logic for stock journal

let currentEditId = null;

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
    renderStocks(stocks);
    updatePortfolioSummary(stocks);
}

// Render stocks in table
function renderStocks(stocks) {
    const tbody = document.getElementById('stockTableBody');

    if (stocks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; padding: 40px;">
                    No stocks yet. Click "Add Stock" to get started!
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = stocks.map(stock => {
        const totalBuyCost = stock.buy_price * stock.buy_quantity + stock.buy_charges;
        return `
        <tr data-id="${stock.id}">
            <td><strong>${stock.stock_name}</strong></td>
            <td>₹${stock.buy_price.toFixed(2)}</td>
            <td>${stock.buy_quantity}</td>
            <td>₹${stock.buy_charges.toFixed(2)}</td>
            <td><strong>₹${totalBuyCost.toFixed(2)}</strong></td>
            <td>₹${stock.breakeven_price.toFixed(2)}</td>
            <td>${stock.sell_price > 0 ? '₹' + stock.sell_price.toFixed(2) : '-'}</td>
            <td>${stock.sell_quantity > 0 ? stock.sell_quantity : '-'}</td>
            <td>${stock.sell_charges > 0 ? '₹' + stock.sell_charges.toFixed(2) : '-'}</td>
            <td>${stock.remaining_shares}</td>
            <td class="${stock.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">
                ${stock.pnl >= 0 ? '+' : ''}₹${stock.pnl.toFixed(2)}
            </td>
            <td>
                <button class="action-btn edit-btn" data-id="${stock.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${stock.id}">Delete</button>
            </td>
        </tr>
        `;
    }).join('');

    // Add event listeners to action buttons
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
    const totalPnL = stocks.reduce((sum, stock) => sum + stock.pnl, 0);
    const totalInvested = stocks.reduce((sum, stock) =>
        sum + (stock.buy_price * stock.buy_quantity + stock.buy_charges), 0
    );

    document.getElementById('portfolioSummary').innerHTML = `
        ${totalStocks} stock${totalStocks !== 1 ? 's' : ''} • 
        Total Invested: ₹${totalInvested.toFixed(2)} • 
        Total P&L: <span class="${totalPnL >= 0 ? 'pnl-positive' : 'pnl-negative'}">
            ${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toFixed(2)}
        </span>
    `;
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

    if (stock) {
        // Edit mode
        title.textContent = 'Edit Stock Entry';
        document.getElementById('stockName').value = stock.stock_name;
        document.getElementById('buyPrice').value = stock.buy_price;
        document.getElementById('buyQuantity').value = stock.buy_quantity;
        document.getElementById('sellPrice').value = stock.sell_price || '';
        document.getElementById('sellQuantity').value = stock.sell_quantity || '';
        currentEditId = stock.id;
    } else {
        // Add mode
        title.textContent = 'Add Stock Entry';
        form.reset();
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
        sell_quantity: parseInt(document.getElementById('sellQuantity').value) || 0
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initDashboard);
