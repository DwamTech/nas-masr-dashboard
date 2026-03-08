# Security Implementation - Dashboard

This document describes the security measures implemented in the Dashboard to protect against common web vulnerabilities.

## Overview

The security implementation focuses on three main areas:
1. **XSS Prevention** - Protecting against Cross-Site Scripting attacks
2. **CSRF Protection** - Ensuring Cross-Site Request Forgery protection (handled by Laravel Sanctum)
3. **Retry Mechanism** - Implementing exponential backoff for failed API requests

## XSS Prevention

### Implementation

XSS (Cross-Site Scripting) prevention is implemented through the `sanitize.ts` utility module, which provides several functions to sanitize user-generated content before rendering.

#### Key Functions

1. **escapeHtml(text: string)**
   - Escapes HTML special characters (`<`, `>`, `&`, `"`, `'`, `/`)
   - Used for sanitizing text content that may contain user input
   - Example:
     ```typescript
     escapeHtml('<script>alert("xss")</script>')
     // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
     ```

2. **sanitizeUrl(url: string)**
   - Blocks dangerous protocols (`javascript:`, `data:`, `vbscript:`, `file:`)
   - Prevents protocol-based XSS attacks
   - Example:
     ```typescript
     sanitizeUrl('javascript:alert("xss")')
     // Returns: ''
     ```

3. **sanitizeFilename(filename: string)**
   - Removes path traversal attempts (`../`)
   - Removes path separators (`/`, `\`)
   - Removes null bytes
   - Prevents file system attacks
   - Example:
     ```typescript
     sanitizeFilename('../../../etc/passwd')
     // Returns: 'etcpasswd'
     ```

4. **sanitizeCategoryName(name: string)**
   - Combines HTML escaping with trimming
   - Used specifically for category names
   - Example:
     ```typescript
     sanitizeCategoryName('<script>alert("xss")</script>')
     // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
     ```

5. **isSafeText(text: string)**
   - Validates that text doesn't contain dangerous patterns
   - Checks for script tags, event handlers, and javascript: protocol
   - Returns boolean indicating safety
   - Example:
     ```typescript
     isSafeText('<script>alert(1)</script>')
     // Returns: false
     ```

### Usage in Components

#### UnifiedImagesTable Component
```typescript
import { sanitizeCategoryName } from '@/utils/sanitize';

// Sanitize category name before rendering
const safeName = sanitizeCategoryName(category.name || '');
```

#### ImageUploadModal Component
```typescript
import { sanitizeCategoryName, sanitizeFilename } from '@/utils/sanitize';

// Sanitize category name for display
const safeCategoryName = sanitizeCategoryName(category.name || '');

// Sanitize filename to prevent path traversal
const safeFilename = sanitizeFilename(file.name);
```

#### UnifiedImagesPage Component
```typescript
import { escapeHtml } from '@/utils/sanitize';

// Sanitize error messages before displaying
const errorMsg = err instanceof Error ? escapeHtml(err.message) : 'فشل تحميل الأقسام';
```

### React's Built-in Protection

React automatically escapes content in JSX expressions, providing a baseline level of XSS protection. However, the sanitization utilities provide additional protection for:
- Content used in `dangerouslySetInnerHTML`
- Dynamic attribute values
- URLs and filenames
- Error messages from external sources

## CSRF Protection

### Implementation

CSRF (Cross-Site Request Forgery) protection is handled by Laravel Sanctum on the backend. The Dashboard ensures proper authentication by:

1. **Including Authentication Tokens**
   - All API requests include the `Authorization: Bearer <token>` header
   - Tokens are retrieved from localStorage
   - Example:
     ```typescript
     const headers: Record<string, string> = {
       'Accept': 'application/json',
       'Content-Type': 'application/json',
     };
     if (token) headers.Authorization = `Bearer ${token}`;
     ```

2. **Backend Validation**
   - Laravel Sanctum validates tokens on every request
   - Invalid or expired tokens are rejected with 401 Unauthorized
   - The Dashboard handles authentication errors gracefully

### Best Practices

- Never expose authentication tokens in URLs or logs
- Store tokens securely in localStorage (not in cookies accessible to JavaScript)
- Clear tokens on logout
- Handle token expiration gracefully

## Retry Mechanism with Exponential Backoff

### Implementation

The retry mechanism is implemented in the `retry.ts` utility module, providing resilient API calls that automatically retry on transient failures.

#### Key Functions

1. **retryWithBackoff<T>(operation, options)**
   - Executes an async operation with retry logic
   - Uses exponential backoff between retries
   - Configurable retry behavior
   - Example:
     ```typescript
     await retryWithBackoff(
       async () => fetch('/api/data'),
       {
         maxAttempts: 3,
         initialDelay: 1000,
         maxDelay: 10000,
         backoffMultiplier: 2,
       }
     );
     ```

2. **withRetry<TArgs, TReturn>(fn, options)**
   - Creates a wrapped function with retry logic
   - Preserves function arguments and return type
   - Example:
     ```typescript
     const resilientFetch = withRetry(fetch, { maxAttempts: 3 });
     await resilientFetch('/api/data');
     ```

### Configuration Options

```typescript
interface RetryOptions {
  maxAttempts?: number;          // Default: 3
  initialDelay?: number;         // Default: 1000ms
  maxDelay?: number;             // Default: 10000ms
  backoffMultiplier?: number;    // Default: 2
  shouldRetry?: (error: Error, attempt: number) => boolean;
}
```

### Retry Strategy

The retry mechanism uses different strategies for different operations:

#### Toggle Operations (PUT requests)
```typescript
{
  maxAttempts: 3,
  initialDelay: 1000,
  shouldRetry: (error: Error) => {
    const status = (error as any).status;
    // Retry on network errors or 5xx server errors, not on 4xx client errors
    return !status || status >= 500;
  }
}
```

#### Upload Operations (POST requests)
```typescript
{
  maxAttempts: 2,  // Only retry once to avoid duplicate uploads
  initialDelay: 2000,
  shouldRetry: (error: Error) => {
    const status = (error as any).status;
    // Only retry on network errors, not on server errors
    return !status;
  }
}
```

#### Delete Operations (DELETE requests)
```typescript
{
  maxAttempts: 3,
  initialDelay: 1000,
  shouldRetry: (error: Error) => {
    const status = (error as any).status;
    // Retry on network errors or 5xx server errors, not on 4xx client errors
    return !status || status >= 500;
  }
}
```

### Exponential Backoff

The retry mechanism uses exponential backoff to avoid overwhelming the server:

- **Attempt 1**: Immediate
- **Attempt 2**: Wait `initialDelay` ms (default: 1000ms)
- **Attempt 3**: Wait `initialDelay * backoffMultiplier` ms (default: 2000ms)
- **Attempt 4**: Wait `initialDelay * backoffMultiplier^2` ms (default: 4000ms)
- Maximum delay is capped at `maxDelay` (default: 10000ms)

### Usage in API Services

All unified image API functions use the retry mechanism:

```typescript
export async function toggleCategoryGlobalImage(
  categoryId: number,
  isActive: boolean,
  token?: string
): Promise<void> {
  return retryWithBackoff(async () => {
    // API call implementation
  }, {
    maxAttempts: 3,
    initialDelay: 1000,
    shouldRetry: (error: Error) => {
      const status = (error as any).status;
      return !status || status >= 500;
    },
  });
}
```

## Testing

### Security Utilities Tests

Location: `tests/security-utils.test.ts`

Tests cover:
- HTML escaping for all special characters
- URL sanitization for dangerous protocols
- Filename sanitization for path traversal
- Category name sanitization
- Safe text validation

Run tests:
```bash
npm test -- security-utils.test.ts --run
```

### Retry Utilities Tests

Location: `tests/retry-utils.test.ts`

Tests cover:
- Successful first attempt
- Retry on network errors
- Exponential backoff delays
- Maximum delay respect
- Error throwing after max attempts
- Custom shouldRetry function
- Function wrapping with withRetry

Run tests:
```bash
npm test -- retry-utils.test.ts --run
```

### API Integration Tests

Location: `tests/unified-images-api.test.ts`

Tests cover:
- API calls with retry mechanism
- Authentication error handling
- Upload error handling
- Delete error handling
- Token management

Run tests:
```bash
npm test -- unified-images-api.test.ts --run
```

## Security Checklist

- [x] XSS Prevention implemented
  - [x] HTML escaping utility
  - [x] URL sanitization
  - [x] Filename sanitization
  - [x] Category name sanitization
  - [x] Safe text validation
- [x] CSRF Protection verified
  - [x] Authentication tokens in headers
  - [x] Backend validation with Laravel Sanctum
- [x] Retry Mechanism implemented
  - [x] Exponential backoff
  - [x] Configurable retry strategy
  - [x] Different strategies for different operations
- [x] Comprehensive test coverage
  - [x] Security utilities tests
  - [x] Retry utilities tests
  - [x] API integration tests

## Best Practices

1. **Always sanitize user input** before rendering or using in operations
2. **Use React's JSX escaping** as the first line of defense
3. **Apply additional sanitization** for special cases (URLs, filenames, etc.)
4. **Include authentication tokens** in all API requests
5. **Handle errors gracefully** and provide user-friendly messages
6. **Use retry mechanism** for all API calls to improve reliability
7. **Configure retry strategy** based on operation type (read vs. write)
8. **Test security measures** regularly with comprehensive test suites

## Future Enhancements

- [ ] Implement Content Security Policy (CSP) headers
- [ ] Add rate limiting on client side
- [ ] Implement request signing for additional security
- [ ] Add security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Implement secure session management
- [ ] Add audit logging for security events
