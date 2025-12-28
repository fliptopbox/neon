/**
 * Neon Admin - API Client
 * Handles all API communication with auth headers
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * Get the stored auth token
 */
export function getToken() {
    return localStorage.getItem('neon_token');
}

/**
 * Set the auth token
 */
export function setToken(token) {
    if (token) {
        localStorage.setItem('neon_token', token);
    } else {
        localStorage.removeItem('neon_token');
    }
}

/**
 * Get stored user data
 */
export function getUser() {
    const data = localStorage.getItem('neon_user');
    return data ? JSON.parse(data) : null;
}

/**
 * Set user data
 */
export function setUser(user) {
    if (user) {
        localStorage.setItem('neon_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('neon_user');
    }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    return !!getToken();
}

/**
 * Clear all auth data
 */
export function clearAuth() {
    localStorage.removeItem('neon_token');
    localStorage.removeItem('neon_user');
}

/**
 * Make an API request with automatic auth headers
 * @param {string} endpoint - API endpoint (e.g., '/users')
 * @param {object} options - Fetch options
 * @returns {Promise<any>}
 */
export async function api(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
        clearAuth();
        window.location.reload();
        throw new Error('Session expired');
    }

    // Parse response
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

/**
 * Login user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{token: string, user: object}>}
 */
export async function login(email, password) {
    const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    setToken(data.token);
    setUser(data.user);

    return data;
}

/**
 * Register a new user
 * @param {string} email 
 * @param {string} password 
 * @param {string} fullname 
 * @returns {Promise<{token: string, user: object, message: string}>}
 */
export async function register(email, password, fullname) {
    const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullname }),
    });

    return data;
}

/**
 * Logout user
 */
export function logout() {
    clearAuth();
}

/**
 * Get current user profile
 */
export async function getMe() {
    return api('/users/me');
}

/**
 * Update current user profile
 */
export async function updateMe(data) {
    return api('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// --- Resource APIs ---

/**
 * Get all users (admin only)
 */
export async function getUsers() {
    return api('/users');
}

/**
 * Get single user by ID
 */
export async function getUserById(id) {
    return api(`/users/${id}`);
}

/**
 * Update user
 */
export async function updateUser(id, data) {
    return api(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Toggle user active status
 */
export async function toggleUserActive(id) {
    return api(`/users/${id}/toggle`, {
        method: 'PATCH',
    });
}

/**
 * Toggle user admin status
 */
export async function toggleUserAdmin(id) {
    return api(`/users/${id}/toggle-admin`, {
        method: 'PATCH',
    });
}

/**
 * Delete user
 */
export async function deleteUser(id) {
    return api(`/users/${id}`, {
        method: 'DELETE',
    });
}

/**
 * Get all hosts
 */
export async function getHosts() {
    return api('/hosts');
}

/**
 * Get single host by ID
 */
export async function getHostById(id) {
    return api(`/hosts/${id}`);
}

/**
 * Update host
 */
export async function updateHost(id, data) {
    return api(`/hosts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Get all models
 */
export async function getModels() {
    return api('/models');
}

/**
 * Get single model by ID
 */
export async function getModelById(id) {
    return api(`/models/${id}`);
}
export const getModel = getModelById; // Alias

/**
 * Update model
 */
export async function updateModel(id, data) {
    return api(`/models/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Delete model
 */
export async function deleteModel(id) {
    return api(`/models/${id}`, {
        method: 'DELETE',
    });
}

/**
 * Create Model
 */
export async function createModel(data) {
    return api('/models', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Create Host
 */
export async function createHost(data) {
    return api('/hosts', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Get all venues
 */
export async function getVenues() {
    return api('/venues');
}

/**
 * Get calendar/sessions
 */
export async function getCalendar(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api(`/calendar${query ? `?${query}` : ''}`);
}

/**
 * Create calendar session
 */
export async function createSession(data) {
    return api('/calendar', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Update calendar session
 */
export async function updateSession(id, data) {
    return api(`/calendar/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}
