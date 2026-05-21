// ⚠️ Groq API Configuration
// Get your key from: https://console.groq.com/keys

const GROQ_CONFIG = {
    apiKey: 'YOUR_GROQ_API_KEY', // Removed to protect your account. Key stored in .env
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-70b-8192', // Fast and highly intelligent
}

// Export for use in chatbot
window.GROQ_CONFIG = GROQ_CONFIG;
