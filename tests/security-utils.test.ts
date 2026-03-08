import { describe, it, expect } from 'vitest';
import {
    escapeHtml,
    sanitizeUrl,
    sanitizeFilename,
    sanitizeCategoryName,
    isSafeText,
} from '@/utils/sanitize';

describe('Security Utilities - XSS Prevention', () => {
    describe('escapeHtml', () => {
        it('should escape HTML special characters', () => {
            expect(escapeHtml('<script>alert("xss")</script>')).toBe(
                '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
            );
        });

        it('should escape ampersands', () => {
            expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
        });

        it('should escape quotes', () => {
            expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
            expect(escapeHtml("It's working")).toBe('It&#x27;s working');
        });

        it('should handle empty strings', () => {
            expect(escapeHtml('')).toBe('');
        });

        it('should handle strings without special characters', () => {
            expect(escapeHtml('Hello World')).toBe('Hello World');
        });
    });

    describe('sanitizeUrl', () => {
        it('should allow safe HTTP URLs', () => {
            const url = 'https://example.com/image.jpg';
            expect(sanitizeUrl(url)).toBe(url);
        });

        it('should block javascript: protocol', () => {
            expect(sanitizeUrl('javascript:alert("xss")')).toBe('');
            expect(sanitizeUrl('JavaScript:alert("xss")')).toBe('');
        });

        it('should block data: protocol', () => {
            expect(sanitizeUrl('data:text/html,<script>alert("xss")</script>')).toBe('');
        });

        it('should block vbscript: protocol', () => {
            expect(sanitizeUrl('vbscript:msgbox("xss")')).toBe('');
        });

        it('should block file: protocol', () => {
            expect(sanitizeUrl('file:///etc/passwd')).toBe('');
        });

        it('should handle empty strings', () => {
            expect(sanitizeUrl('')).toBe('');
        });

        it('should trim whitespace', () => {
            expect(sanitizeUrl('  javascript:alert("xss")  ')).toBe('');
        });
    });

    describe('sanitizeFilename', () => {
        it('should remove path traversal attempts', () => {
            expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
        });

        it('should remove path separators', () => {
            expect(sanitizeFilename('path/to/file.jpg')).toBe('pathtofile.jpg');
            expect(sanitizeFilename('path\\to\\file.jpg')).toBe('pathtofile.jpg');
        });

        it('should remove null bytes', () => {
            expect(sanitizeFilename('file\0.jpg')).toBe('file.jpg');
        });

        it('should trim whitespace', () => {
            expect(sanitizeFilename('  file.jpg  ')).toBe('file.jpg');
        });

        it('should handle empty strings', () => {
            expect(sanitizeFilename('')).toBe('');
        });

        it('should allow safe filenames', () => {
            expect(sanitizeFilename('image-2024.jpg')).toBe('image-2024.jpg');
        });
    });

    describe('sanitizeCategoryName', () => {
        it('should escape HTML in category names', () => {
            expect(sanitizeCategoryName('<script>alert("xss")</script>')).toBe(
                '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
            );
        });

        it('should trim whitespace', () => {
            expect(sanitizeCategoryName('  السيارات  ')).toBe('السيارات');
        });

        it('should handle empty strings', () => {
            expect(sanitizeCategoryName('')).toBe('');
        });

        it('should allow safe Arabic text', () => {
            expect(sanitizeCategoryName('السيارات')).toBe('السيارات');
        });
    });

    describe('isSafeText', () => {
        it('should detect script tags', () => {
            expect(isSafeText('<script>alert("xss")</script>')).toBe(false);
            expect(isSafeText('<SCRIPT>alert("xss")</SCRIPT>')).toBe(false);
        });

        it('should detect event handlers', () => {
            expect(isSafeText('<img onerror="alert(1)">')).toBe(false);
            expect(isSafeText('<div onclick="alert(1)">')).toBe(false);
        });

        it('should detect javascript: protocol', () => {
            expect(isSafeText('javascript:alert(1)')).toBe(false);
            expect(isSafeText('JavaScript:alert(1)')).toBe(false);
        });

        it('should allow safe text', () => {
            expect(isSafeText('Hello World')).toBe(true);
            expect(isSafeText('السيارات')).toBe(true);
            expect(isSafeText('')).toBe(true);
        });
    });
});
