// Authentication functions using Supabase Auth

const auth = {
    // Sign up new user
    async signup(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
            })

            if (error) throw error

            // Show success message
            alert('Sign up successful! Please check your email to verify your account.')
            return data
        } catch (error) {
            console.error('Signup error:', error)
            alert('Signup failed: ' + error.message)
            throw error
        }
    },

    // Login existing user
    async login(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            })

            if (error) throw error

            console.log('Login successful:', data.user.email)
            return data
        } catch (error) {
            console.error('Login error:', error)
            alert('Login failed: ' + error.message)
            throw error
        }
    },

    // Logout current user
    async logout() {
        try {
            const { error } = await window.supabaseClient.auth.signOut()
            if (error) throw error

            console.log('Logged out successfully')
            window.location.href = '/index.html'
        } catch (error) {
            console.error('Logout error:', error)
            alert('Logout failed: ' + error.message)
        }
    },

    // Get current logged-in user
    async getCurrentUser() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser()
            return user
        } catch (error) {
            console.error('Get user error:', error)
            return null
        }
    },

    // Check if user is authenticated
    async isAuthenticated() {
        const user = await this.getCurrentUser()
        return user !== null
    },

    // Redirect to dashboard if authenticated
    async redirectIfAuthenticated() {
        const isAuth = await this.isAuthenticated()
        if (isAuth) {
            window.location.href = '/dashboard.html'
        }
    },

    // Redirect to login if not authenticated
    async redirectIfNotAuthenticated() {
        const isAuth = await this.isAuthenticated()
        if (!isAuth) {
            window.location.href = '/index.html'
        }
    },

    // Listen for auth state changes
    onAuthStateChange(callback) {
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            callback(event, session)
        })
    }
}

// Export for use in other files
window.auth = auth
