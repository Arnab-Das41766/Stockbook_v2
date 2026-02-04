// ⚠️ IMPORTANT: Replace with YOUR Together AI API key
// Get your key from: https://api.together.xyz/settings/api-keys

const TOGETHER_AI_CONFIG = {
    apiKey: 'tok_9d2d59ea9de9ff0fe3ef294fb7aae81d',
    apiUrl: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', // Fast and cost-effective
    // Alternative model (more accurate but slower):
    // model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
}

// Export for use in chatbot
window.TOGETHER_AI_CONFIG = TOGETHER_AI_CONFIG
