// API functions for stock CRUD operations

const stockAPI = {
    // Get all stocks for current user
    async fetchStocks() {
        try {
            const { data, error } = await window.supabaseClient
                .from('stock_entries')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Fetch stocks error:', error)
            alert('Failed to load stocks: ' + error.message)
            return []
        }
    },

    // Create new stock entry
    async createStock(stockData) {
        try {
            const user = await window.auth.getCurrentUser()
            if (!user) throw new Error('Not authenticated')

            const { calculateBuyCharges, calculateSellCharges, calculateBreakeven, calculatePnL, calculateRemainingShares } = window.stockCalculations

            // Calculate charges (now returns objects)
            const buyChargesResult = calculateBuyCharges(stockData.buy_price, stockData.buy_quantity)
            const buyCharges = buyChargesResult.totalCharges
            const breakevenPrice = calculateBreakeven(stockData.buy_price, stockData.buy_quantity, buyCharges)
            const sellCharges = stockData.sell_quantity > 0
                ? calculateSellCharges(stockData.sell_price, stockData.sell_quantity).totalCharges
                : 0
            const remainingShares = calculateRemainingShares(stockData.buy_quantity, stockData.sell_quantity || 0)
            const pnl = calculatePnL(
                stockData.buy_price,
                stockData.buy_quantity,
                buyCharges,
                stockData.sell_price || 0,
                stockData.sell_quantity || 0,
                sellCharges
            )

            const { data, error } = await window.supabaseClient
                .from('stock_entries')
                .insert([{
                    user_id: user.id,
                    stock_name: stockData.stock_name,
                    buy_price: parseFloat(stockData.buy_price),
                    buy_quantity: parseInt(stockData.buy_quantity),
                    buy_charges: buyCharges,
                    breakeven_price: breakevenPrice,
                    sell_price: parseFloat(stockData.sell_price) || 0,
                    sell_quantity: parseInt(stockData.sell_quantity) || 0,
                    sell_charges: sellCharges,
                    remaining_shares: remainingShares,
                    pnl: pnl
                }])
                .select()

            if (error) throw error
            console.log('Stock created:', data[0])
            return data[0]
        } catch (error) {
            console.error('Create stock error:', error)
            alert('Failed to create stock: ' + error.message)
            throw error
        }
    },

    // Update existing stock entry
    async updateStock(id, stockData) {
        try {
            const { calculateBuyCharges, calculateSellCharges, calculateBreakeven, calculatePnL, calculateRemainingShares } = window.stockCalculations

            // Calculate charges (now returns objects)
            const buyChargesResult = calculateBuyCharges(stockData.buy_price, stockData.buy_quantity)
            const buyCharges = buyChargesResult.totalCharges
            const breakevenPrice = calculateBreakeven(stockData.buy_price, stockData.buy_quantity, buyCharges)
            const sellCharges = stockData.sell_quantity > 0
                ? calculateSellCharges(stockData.sell_price, stockData.sell_quantity).totalCharges
                : 0
            const remainingShares = calculateRemainingShares(stockData.buy_quantity, stockData.sell_quantity || 0)
            const pnl = calculatePnL(
                stockData.buy_price,
                stockData.buy_quantity,
                buyCharges,
                stockData.sell_price || 0,
                stockData.sell_quantity || 0,
                sellCharges
            )

            const { data, error } = await window.supabaseClient
                .from('stock_entries')
                .update({
                    stock_name: stockData.stock_name,
                    buy_price: parseFloat(stockData.buy_price),
                    buy_quantity: parseInt(stockData.buy_quantity),
                    buy_charges: buyCharges,
                    breakeven_price: breakevenPrice,
                    sell_price: parseFloat(stockData.sell_price) || 0,
                    sell_quantity: parseInt(stockData.sell_quantity) || 0,
                    sell_charges: sellCharges,
                    remaining_shares: remainingShares,
                    pnl: pnl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()

            if (error) throw error
            console.log('Stock updated:', data[0])
            return data[0]
        } catch (error) {
            console.error('Update stock error:', error)
            alert('Failed to update stock: ' + error.message)
            throw error
        }
    },

    // Delete stock entry
    async deleteStock(id) {
        try {
            const { error } = await window.supabaseClient
                .from('stock_entries')
                .delete()
                .eq('id', id)

            if (error) throw error
            console.log('Stock deleted:', id)
        } catch (error) {
            console.error('Delete stock error:', error)
            alert('Failed to delete stock: ' + error.message)
            throw error
        }
    }
}

// Export for use in other files
window.stockAPI = stockAPI
