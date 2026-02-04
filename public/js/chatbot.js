// ============================================
// AI STOCK CHATBOT - Client-Side Implementation
// ============================================

class StockChatbot {
    constructor() {
        this.isOpen = false;
        this.isProcessing = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createChatbotUI();
        this.attachEventListeners();
        this.showWelcomeMessage();
    }

    createChatbotUI() {
        const chatbotHTML = `
            <!-- Chatbot Toggle Button -->
            <button class="chatbot-toggle" id="chatbotToggle" aria-label="Open AI Stock Analyst">
                🤖
            </button>

            <!-- Chatbot Window -->
            <div class="chatbot-window" id="chatbotWindow">
                <!-- Header -->
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <span class="chatbot-title-icon">📊</span>
                        <span>AI Stock Analyst</span>
                    </div>
                    <button class="chatbot-close" id="chatbotClose" aria-label="Close chatbot">
                        ✕
                    </button>
                </div>

                <!-- Messages Area -->
                <div class="chatbot-messages" id="chatbotMessages">
                    <!-- Messages will be inserted here -->
                </div>

                <!-- Input Area -->
                <div class="chatbot-input-area">
                    <div class="chatbot-disclaimer">
                        ⚠️ For educational purposes only. Not financial advice.
                    </div>
                    <div class="chatbot-input-wrapper">
                        <input 
                            type="text" 
                            class="chatbot-input" 
                            id="chatbotInput" 
                            placeholder="Enter stock name (e.g., RELIANCE, TCS)"
                            autocomplete="off"
                        />
                        <button class="chatbot-send-btn" id="chatbotSend" aria-label="Send message">
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    attachEventListeners() {
        const toggleBtn = document.getElementById('chatbotToggle');
        const closeBtn = document.getElementById('chatbotClose');
        const sendBtn = document.getElementById('chatbotSend');
        const input = document.getElementById('chatbotInput');

        toggleBtn.addEventListener('click', () => this.toggleChat());
        closeBtn.addEventListener('click', () => this.closeChat());
        sendBtn.addEventListener('click', () => this.handleSend());

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isProcessing) {
                this.handleSend();
            }
        });

        // Example query clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('example-query')) {
                const stockName = e.target.dataset.stock;
                this.sendMessage(stockName);
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const window = document.getElementById('chatbotWindow');
        window.classList.toggle('active', this.isOpen);

        if (this.isOpen) {
            document.getElementById('chatbotInput').focus();
        }
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('chatbotWindow').classList.remove('active');
    }

    showWelcomeMessage() {
        const messagesContainer = document.getElementById('chatbotMessages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">📈</div>
                <div class="welcome-title">AI Stock Analysis</div>
                <div class="welcome-text">
                    Get instant analysis of Indian stocks including price ranges, 
                    support/resistance levels, market sentiment, and news impact.
                </div>
                <div class="example-queries">
                    <div class="example-query" data-stock="RELIANCE">
                        📊 Analyze RELIANCE
                    </div>
                    <div class="example-query" data-stock="TCS">
                        📊 Analyze TCS
                    </div>
                    <div class="example-query" data-stock="INFY">
                        📊 Analyze INFY
                    </div>
                </div>
            </div>
        `;
    }

    handleSend() {
        const input = document.getElementById('chatbotInput');
        const stockName = input.value.trim().toUpperCase();

        if (!stockName || this.isProcessing) return;

        input.value = '';
        this.sendMessage(stockName);
    }

    async sendMessage(stockName) {
        if (this.isProcessing) return;

        // Add user message
        this.addMessage('user', stockName);

        // Show typing indicator
        this.showTypingIndicator();
        this.isProcessing = true;

        try {
            // Call Together AI API
            const analysis = await this.analyzeStock(stockName);

            // Remove typing indicator
            this.removeTypingIndicator();

            // Add bot response
            this.addMessage('bot', analysis, stockName);

        } catch (error) {
            console.error('Error analyzing stock:', error);
            this.removeTypingIndicator();
            this.addMessage('bot', {
                error: true,
                message: 'Sorry, I encountered an error analyzing this stock. Please check your API key and try again.'
            });
        } finally {
            this.isProcessing = false;
            document.getElementById('chatbotSend').disabled = false;
        }
    }

    async analyzeStock(stockName) {
        // Check if API key is configured
        if (!window.TOGETHER_AI_CONFIG || window.TOGETHER_AI_CONFIG.apiKey === 'YOUR_TOGETHER_AI_API_KEY_HERE') {
            throw new Error('Together AI API key not configured. Please update together-ai-config.js');
        }

        const systemPrompt = `You are an expert stock market analyst specializing in Indian equities. 
Analyze stocks and provide technical analysis in a structured format.
Always respond with valid JSON only, no additional text.`;

        const userPrompt = `Analyze the Indian stock: ${stockName}

Provide a comprehensive analysis with:
1. Current approximate price range (in ₹)
2. Two key support levels (in ₹)
3. One resistance level (in ₹)
4. Market sentiment (Bullish/Bearish/Neutral)
5. Brief reasoning for the sentiment (1-2 sentences)
6. Recent news impact (Positive/Negative/Neutral/None)
7. News details if applicable (1-2 sentences)
8. Additional technical insights (volume, RSI, trend)

Respond ONLY with valid JSON in this exact format:
{
  "stockName": "${stockName}",
  "priceRange": "₹X - ₹Y",
  "support1": "₹X",
  "support2": "₹Y",
  "resistance": "₹Z",
  "sentiment": "Bullish/Bearish/Neutral",
  "sentimentReason": "Brief explanation",
  "newsImpact": "Positive/Negative/Neutral/None",
  "newsDetails": "Details or 'No recent significant news'",
  "additionalInsights": "Technical indicators and trends"
}`;

        const response = await fetch(window.TOGETHER_AI_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.TOGETHER_AI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: window.TOGETHER_AI_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Parse JSON response
        try {
            // Extract JSON from response (in case AI adds extra text)
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from AI');
            }
            return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('AI Response:', aiResponse);
            throw new Error('Failed to parse AI response');
        }
    }

    addMessage(type, content, stockName = null) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;

        const time = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="message-avatar">👤</div>
                <div class="message-content">
                    <div class="message-bubble">${content}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        } else {
            // Bot message
            if (content.error) {
                messageDiv.innerHTML = `
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <div class="message-bubble">
                            <div class="error-message">
                                ❌ ${content.message}
                            </div>
                        </div>
                        <div class="message-time">${time}</div>
                    </div>
                `;
            } else {
                messageDiv.innerHTML = `
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <div class="message-bubble">
                            ${this.formatAnalysis(content)}
                        </div>
                        <div class="message-time">${time}</div>
                    </div>
                `;
            }
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatAnalysis(analysis) {
        const sentimentClass = analysis.sentiment.toLowerCase();
        const newsClass = analysis.newsImpact.toLowerCase();

        return `
            <div class="stock-analysis-card">
                <div class="stock-name-header">
                    📊 ${analysis.stockName}
                </div>

                <div class="analysis-section">
                    <div class="analysis-label">Current Price Range</div>
                    <div class="price-range">${analysis.priceRange}</div>
                </div>

                <div class="analysis-section">
                    <div class="analysis-label">Support Levels</div>
                    <div class="support-levels">
                        <span class="level-badge support-badge">S1: ${analysis.support1}</span>
                        <span class="level-badge support-badge">S2: ${analysis.support2}</span>
                    </div>
                </div>

                <div class="analysis-section">
                    <div class="analysis-label">Resistance Level</div>
                    <div class="support-levels">
                        <span class="level-badge resistance-badge">R1: ${analysis.resistance}</span>
                    </div>
                </div>

                <div class="analysis-section">
                    <div class="analysis-label">Market Sentiment</div>
                    <div class="sentiment-indicator sentiment-${sentimentClass}">
                        ${this.getSentimentIcon(analysis.sentiment)} ${analysis.sentiment}
                    </div>
                    <div class="analysis-value" style="margin-top: 6px; font-size: 13px;">
                        ${analysis.sentimentReason}
                    </div>
                </div>

                ${analysis.newsImpact !== 'None' ? `
                    <div class="analysis-section">
                        <div class="analysis-label">News Impact</div>
                        <div class="news-impact news-${newsClass}">
                            ${this.getNewsIcon(analysis.newsImpact)} <strong>${analysis.newsImpact}</strong><br/>
                            ${analysis.newsDetails}
                        </div>
                    </div>
                ` : ''}

                <div class="analysis-section">
                    <div class="analysis-label">💡 Additional Insights</div>
                    <div class="analysis-value" style="font-size: 13px;">
                        ${analysis.additionalInsights}
                    </div>
                </div>
            </div>
        `;
    }

    getSentimentIcon(sentiment) {
        const icons = {
            'Bullish': '📈',
            'Bearish': '📉',
            'Neutral': '➡️'
        };
        return icons[sentiment] || '➡️';
    }

    getNewsIcon(impact) {
        const icons = {
            'Positive': '✅',
            'Negative': '⚠️',
            'Neutral': 'ℹ️'
        };
        return icons[impact] || 'ℹ️';
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbotMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingMessage = document.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.stockChatbot = new StockChatbot();
});
