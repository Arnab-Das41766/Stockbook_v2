// ⚠️ DeepSeek API Configuration
// Get your key from: https://platform.deepseek.com/api_keys

const DEEPSEEK_CONFIG = {
    apiKey: 'sk-401fbd42cf00493b8c28db07f3027460',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat', // Fast and cost-effective
    // Alternative: 'deepseek-coder' for more technical analysis
}

// Export for use in chatbot
window.DEEPSEEK_CONFIG = DEEPSEEK_CONFIG
