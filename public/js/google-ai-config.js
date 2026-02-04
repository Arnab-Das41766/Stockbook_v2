// ⚠️ Google Gemini API Configuration
// Get your key from: https://aistudio.google.com/app/apikey

const GOOGLE_AI_CONFIG = {
    apiKey: 'AIzaSyCHRr6uq4Q0rAKDoQ7VbYrpmf1-xehFqtk',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash', // Fast and free!
    // Alternative: 'gemini-1.5-pro' for more complex analysis
}

// Export for use in chatbot
window.GOOGLE_AI_CONFIG = GOOGLE_AI_CONFIG
