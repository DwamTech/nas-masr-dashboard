/**
 * XSS Prevention Utilities
 * 
 * These utilities help prevent Cross-Site Scripting (XSS) attacks by sanitizing
 * user-generated content before rendering it in the UI.
 * 
 * Note: React automatically escapes content in JSX expressions, but these utilities
 * provide additional protection for edge cases like dangerouslySetInnerHTML or
 * dynamic attribute values.
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * 
 * @param text - The text to escape
 * @returns Escaped text safe for HTML rendering
 */
export function escapeHtml(text: string): string {
    const htmlEscapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitizes a URL to prevent javascript: and data: protocol attacks
 * 
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if dangerous
 */
export function sanitizeUrl(url: string): string {
    if (!url) return '';

    const trimmed = url.trim().toLowerCase();

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some((protocol) => trimmed.startsWith(protocol))) {
        return '';
    }

    return url;
}

/**
 * Sanitizes a filename to prevent path traversal attacks
 * 
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
    if (!filename) return '';

    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '');

    // Remove path separators
    sanitized = sanitized.replace(/[/\\]/g, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
}

/**
 * Validates and sanitizes category name for display
 * 
 * @param name - The category name to sanitize
 * @returns Sanitized category name
 */
export function sanitizeCategoryName(name: string): string {
    if (!name) return '';

    // Escape HTML to prevent XSS
    return escapeHtml(name.trim());
}

/**
 * Validates that a string contains only safe characters
 * 
 * @param text - The text to validate
 * @returns True if the text is safe
 */
export function isSafeText(text: string): boolean {
    if (!text) return true;

    // Check for script tags
    if (/<script[^>]*>.*?<\/script>/gi.test(text)) {
        return false;
    }

    // Check for event handlers
    if (/on\w+\s*=/gi.test(text)) {
        return false;
    }

    // Check for javascript: protocol
    if (/javascript:/gi.test(text)) {
        return false;
    }

    return true;
}
