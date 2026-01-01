/**
 * Login View
 */

export function renderLogin() {
    return `
        <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
                <div class="text-center">
                    <div class="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <span class="material-symbols-outlined text-primary text-2xl">palette</span>
                    </div>
                    <h2 class="text-3xl font-extrabold text-gray-900">Sign in</h2>
                    <p class="mt-2 text-sm text-gray-600">to access the Admin Console</p>
                </div>
                
                <form class="mt-8 space-y-6" id="login-form">
                    <div class="rounded-md shadow-sm space-y-4">
                        <div>
                            <label for="email" class="sr-only">Email address</label>
                            <input id="email" name="email" type="email" autocomplete="email" required 
                                class="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" 
                                placeholder="Email address">
                        </div>
                        <div>
                            <label for="password" class="sr-only">Password</label>
                            <input id="password" name="password" type="password" autocomplete="current-password" required 
                                class="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" 
                                placeholder="Password">
                        </div>
                    </div>

                    <div id="login-error" class="hidden text-sm text-red-600 text-center bg-red-50 p-2 rounded-lg"></div>

                    <div>
                        <button type="submit" 
                            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}
