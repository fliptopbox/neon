import crypto from 'crypto';

const DEFAULT_PASSWORD = 'pa55word!';

// Simple password hashing using SHA-256 (same as in API)
export function hashPassword(email, password = null) {
    const fullPassword = `${email.toLowerCase().trim()}:${password ?? DEFAULT_PASSWORD}`;
    return crypto.createHash('sha256').update(fullPassword).digest('hex');
}