// Expandable rows rendering logic

// Toggle stock expansion
function toggleStockExpansion(stockName) {
    const normalizedName = stockName.toUpperCase();

    if (window.expandedStocks.has(normalizedName)) {
        window.expandedStocks.delete(normalizedName);
    } else {
        window.expandedStocks.add(normalizedName);
    }

    // Re-render to show/hide child rows
    renderExpandableStocks(window.allStocks);
}

// Render stocks in table with expandable rows
function renderExpandableStocks(stocks) {
    const tbody = document.getElementById('stockTableBody');

    if (stocks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13" class="empty-state">
                    No stocks yet. Click "+ Add New Stock" to populate your portfolio!
                </td>
            </tr>
        `;
        return;
    }

    // Group stocks by name
    const grouped = window.stockGrouping.groupStocksByName(stocks);
    const stockNames = Object.keys(grouped).sort();

    let html = '';

    stockNames.forEach(stockName => {
        const stockGroup = grouped[stockName];
        const isExpanded = window.expandedStocks.has(stockName);

        // If only one entry, render as simple row
        if (stockGroup.length === 1) {
            const stock = stockGroup[0];
            const qtyLeft = stock.buy_quantity - (stock.sell_quantity || 0);
            const totalBuyCost = stock.buy_price * stock.buy_quantity + stock.buy_charges;
            const purchaseDate = stock.purchase_date ? new Date(stock.purchase_date).toLocaleDateString('en-IN') : '-';

            html += `
            <tr data-id="${stock.id}">
                <td class="stock-name-cell">${stock.stock_name}</td>
                <td>₹${stock.buy_price.toFixed(2)}</td>
                <td>${stock.buy_quantity}</td>
                <td>${stock.sell_quantity || 0}</td>
                <td><strong>${qtyLeft}</strong></td>
                <td>₹${stock.buy_charges.toFixed(2)}</td>
                <td><strong>₹${totalBuyCost.toFixed(2)}</strong></td>
                <td>₹${stock.breakeven_price.toFixed(2)}</td>
                <td>${purchaseDate}</td>
                <td>${stock.sell_price > 0 ? '₹' + stock.sell_price.toFixed(2) : '-'}</td>
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
        } else {
            // Multiple entries - render parent + children
            const aggregated = window.stockGrouping.calculateAggregatedStock(stockGroup);
            const arrow = isExpanded ? '▼' : '▶';

            // Parent row
            html += `
            <tr class="parent-row" data-stock-name="${stockName}">
                <td class="stock-name-cell stock-name-clickable" onclick="toggleStockExpansion('${stockName}')">
                    <span class="expand-icon">${arrow}</span> ${aggregated.stock_name}
                </td>
                <td><span class="aggregated-label">₹${aggregated.avg_buy_price.toFixed(2)}</span> <small>(avg)</small></td>
                <td><strong>${aggregated.total_qty_bought}</strong></td>
                <td><strong>${aggregated.total_qty_sold}</strong></td>
                <td><strong class="pnl-positive">${aggregated.total_qty_left}</strong></td>
                <td>₹${aggregated.total_buy_charges.toFixed(2)}</td>
                <td><strong>₹${aggregated.total_cost.toFixed(2)}</strong></td>
                <td>₹${aggregated.breakeven_price.toFixed(2)}</td>
                <td><small>${stockGroup.length} entries</small></td>
                <td>${aggregated.avg_sell_price > 0 ? '₹' + aggregated.avg_sell_price.toFixed(2) + ' (avg)' : '-'}</td>
                <td>${aggregated.total_sell_charges > 0 ? '₹' + aggregated.total_sell_charges.toFixed(2) : '-'}</td>
                <td class="${aggregated.total_pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">
                    ${aggregated.total_pnl >= 0 ? '+' : ''}₹${aggregated.total_pnl.toFixed(2)}
                </td>
                <td>
                    <button class="action-btn view-btn view-aggregated-btn" data-stock-name="${stockName}" title="View Aggregated">👁️</button>
                </td>
            </tr>
            `;

            // Child rows (if expanded)
            if (isExpanded) {
                stockGroup.forEach((stock, index) => {
                    const isLast = index === stockGroup.length - 1;
                    const connector = isLast ? '└─' : '├─';
                    const qtyLeft = stock.buy_quantity - (stock.sell_quantity || 0);
                    const totalBuyCost = stock.buy_price * stock.buy_quantity + stock.buy_charges;
                    const purchaseDate = stock.purchase_date ? new Date(stock.purchase_date).toLocaleDateString('en-IN') : '-';

                    html += `
                    <tr class="child-row" data-id="${stock.id}">
                        <td class="child-row-indent"><small>${connector}</small></td>
                        <td>₹${stock.buy_price.toFixed(2)}</td>
                        <td>${stock.buy_quantity}</td>
                        <td>${stock.sell_quantity || 0}</td>
                        <td>${qtyLeft}</td>
                        <td>₹${stock.buy_charges.toFixed(2)}</td>
                        <td>₹${totalBuyCost.toFixed(2)}</td>
                        <td>₹${stock.breakeven_price.toFixed(2)}</td>
                        <td><small>${purchaseDate}</small></td>
                        <td>${stock.sell_price > 0 ? '₹' + stock.sell_price.toFixed(2) : '-'}</td>
                        <td>${stock.sell_charges > 0 ? '₹' + stock.sell_charges.toFixed(2) : '-'}</td>
                        <td class="${stock.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">
                            ${stock.pnl >= 0 ? '+' : ''}₹${stock.pnl.toFixed(2)}
                        </td>
                        <td>
                            <button class="action-btn edit-btn" data-id="${stock.id}" title="Edit">✏️</button>
                            <button class="action-btn delete-btn" data-id="${stock.id}" title="Delete">🗑️</button>
                        </td>
                    </tr>
                    `;
                });
            }
        }
    });

    tbody.innerHTML = html;

    // Add event listeners to action buttons
    document.querySelectorAll('.view-btn:not(.view-aggregated-btn)').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            viewStockDetails(id);
        });
    });

    // Add event listeners for aggregated view buttons
    document.querySelectorAll('.view-aggregated-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stockName = btn.getAttribute('data-stock-name');
            viewAggregatedStockDetails(stockName);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editStock(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteStock(btn.dataset.id));
    });
}

// Export functions
window.renderExpandableStocks = renderExpandableStocks;
window.toggleStockExpansion = toggleStockExpansion;
