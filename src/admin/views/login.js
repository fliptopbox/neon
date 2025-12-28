/**
 * Login View
 */

export function renderLogin() {
    return `
        <div class="min-h-screen flex flex-col justify-center p-6 bg-background-light">
            <div class="max-w-sm mx-auto w-full">
                <!-- Logo/Branding -->
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                        <span class="material-symbols-outlined text-primary text-[32px]">palette</span>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900">Neon Admin</h1>
                    <p class="text-gray-500 text-sm mt-1">Life Drawing Platform</p>
                </div>
                
                <!-- Login Form -->
                <form id="login-form" class="space-y-4">
                    <!-- Error Message -->
                    <div id="login-error" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        Invalid credentials
                    </div>
                    
                    <!-- Email -->
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
                            Email
                        </label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email"
                            class="input-field"
                            placeholder="you@example.com"
                            required
                            autocomplete="email"
                        />
                    </div>
                    
                    <!-- Password -->
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
                            Password
                        </label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password"
                            class="input-field"
                            placeholder="••••••••"
                            required
                            autocomplete="current-password"
                        />
                    </div>
                    
                    <!-- Submit -->
                    <button type="submit" class="btn-primary w-full mt-6">
                        Sign In
                    </button>
                </form>
                
                <!-- Footer -->
                <p class="text-center text-xs text-gray-400 mt-8">
                    Admin access only. Contact support if you need access.
                </p>
            </div>
        </div>
    `;
}
