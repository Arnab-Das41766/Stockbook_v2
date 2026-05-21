// ⚠️ Google Gemini API Configuration
// Get your key from: https://aistudio.google.com/app/apikey

const GOOGLE_AI_CONFIG = {
        
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash', // Fast and free!
    // Alternative: 'gemini-1.5-pro' for more complex analysis
}

// Export for use in chatbot
window.GOOGLE_AI_CONFIG = GOOGLE_AI_CONFIG
