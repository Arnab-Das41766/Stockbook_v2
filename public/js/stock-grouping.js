// Helper functions for expandable stock rows

// Group stocks by stock name
function groupStocksByName(stocks) {
    const grouped = {};

    stocks.forEach(stock => {
        const name = stock.stock_name.toUpperCase(); // Normalize to uppercase
        if (!grouped[name]) {
            grouped[name] = [];
        }
        grouped[name].push(stock);
    });

    return grouped;
}

// Calculate aggregated values for a group of stocks
function calculateAggregatedStock(stockGroup) {
    const totalQtyBought = stockGroup.reduce((sum, s) => sum + s.buy_quantity, 0);
    const totalQtySold = stockGroup.reduce((sum, s) => sum + (s.sell_quantity || 0), 0);
    const totalQtyLeft = totalQtyBought - totalQtySold;

    // Weighted average buy price
    const totalSpent = stockGroup.reduce((sum, s) => sum + (s.buy_price * s.buy_quantity), 0);
    const avgBuyPrice = totalSpent / totalQtyBought;

    // Total charges and costs
    const totalBuyCharges = stockGroup.reduce((sum, s) => sum + s.buy_charges, 0);
    const totalCost = totalSpent + totalBuyCharges;

    // Breakeven price for aggregated position
    const breakevenPrice = totalCost / totalQtyBought;

    // Aggregated P&L
    const totalPnL = stockGroup.reduce((sum, s) => sum + s.pnl, 0);

    // Aggregated sell data
    const totalSellCharges = stockGroup.reduce((sum, s) => sum + (s.sell_charges || 0), 0);
    const avgSellPrice = totalQtySold > 0
        ? stockGroup.reduce((sum, s) => sum + ((s.sell_price || 0) * (s.sell_quantity || 0)), 0) / totalQtySold
        : 0;

    return {
        stock_name: stockGroup[0].stock_name,
        avg_buy_price: avgBuyPrice,
        total_qty_bought: totalQtyBought,
        total_qty_sold: totalQtySold,
        total_qty_left: totalQtyLeft,
        total_buy_charges: totalBuyCharges,
        total_cost: totalCost,
        breakeven_price: breakevenPrice,
        avg_sell_price: avgSellPrice,
        total_sell_charges: totalSellCharges,
        total_pnl: totalPnL,
        children: stockGroup
    };
}

// Export functions
window.stockGrouping = {
    groupStocksByName,
    calculateAggregatedStock
};
