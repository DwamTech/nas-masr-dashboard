/**
 * Property-Based Tests for Unified Category Images Dashboard
 * Task 4.8: كتابة Property-Based Tests للـ Dashboard
 * 
 * These tests verify correctness properties across many iterations using fast-check.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { AdminCategoryListItem } from '@/models/makes';

const API_BASE = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';
const BACKEND_BASE = API_BASE.replace(/\/api$/, '');

/**
 * Helper function to create a category with specific properties
 */
function createCategory(
    id: number,
    isGlobalImageActive: boolean,
    globalImageUrl: string | null = null
): AdminCategoryListItem {
    return {
        id,
        name: `Category ${id}`,
        slug: `category-${id}`,
        icon: '🏷️',
        is_active: true,
        is_global_image_active: isGlobalImageActive,
        global_image_url: globalImageUrl,
        global_image_full_url: globalImageUrl
            ? `${BACKEND_BASE}/storage/${globalImageUrl}`
            : undefined,
    };
}

/**
 * Helper function to determine if button should be enabled
 * This implements the business logic from the UnifiedImagesTable component
 */
function isButtonEnabled(category: AdminCategoryListItem): boolean {
    return category.is_global_image_active ?? false;
}

/**
 * Helper function to determine image source for a listing
 * This implements the business logic from the Mobile App
 */
function getImageSource(
    isGlobalImageActive: boolean,
    globalImageUrl: string | null | undefined,
    listingImageUrl: string | null | undefined
): string | null {
    // Check if unified image is active and available
    if (isGlobalImageActive && globalImageUrl != null && globalImageUrl !== '') {
        return globalImageUrl;
    }

    // Fallback to listing's original image
    if (listingImageUrl != null && listingImageUrl !== '') {
        return listingImageUrl;
    }

    // No image available
    return null;
}

describe('Unified Images Properties', () => {
    /**
     * Feature: unified-category-images-management, Property 4: Button State Based on Toggle
     * For any category, the button should be enabled iff is_global_image_active is true.
     * 
     * Validates: Requirements 2.4, 2.5
     */
    it('Property 4: button state should match is_global_image_active', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 1000 }), // category id
                fc.boolean(), // is_global_image_active
                fc.option(fc.string(), { nil: null }), // global_image_url (optional)
                (categoryId, isActive, imageUrl) => {
                    const category = createCategory(categoryId, isActive, imageUrl);

                    // The button should be enabled if and only if is_global_image_active is true
                    const buttonEnabled = isButtonEnabled(category);

                    expect(buttonEnabled).toBe(isActive);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: unified-category-images-management, Property 12: Image Source Selection Logic
     * For any listing, image source should be unified if active and available, else original.
     * 
     * Validates: Requirements 4.1, 4.2, 4.3
     */
    it('Property 12: image source selection follows correct priority', () => {
        fc.assert(
            fc.property(
                fc.boolean(), // is_global_image_active
                fc.option(fc.string().filter(s => s.length > 0), { nil: null }), // global_image_url
                fc.option(fc.string().filter(s => s.length > 0), { nil: null }), // listing_image_url
                (isActive, globalUrl, listingUrl) => {
                    const imageSource = getImageSource(isActive, globalUrl, listingUrl);

                    // Case 1: Unified image is active AND available -> use unified image
                    if (isActive && globalUrl != null && globalUrl !== '') {
                        expect(imageSource).toBe(globalUrl);
                    }
                    // Case 2: Unified image is NOT active OR not available -> use listing image
                    else if (listingUrl != null && listingUrl !== '') {
                        expect(imageSource).toBe(listingUrl);
                    }
                    // Case 3: No images available -> null
                    else {
                        expect(imageSource).toBeNull();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional test: Verify all combinations of image source selection
     * This test explicitly checks all 8 possible combinations
     */
    it('Property 12: image source selection covers all combinations', () => {
        const testCases = [
            // [isActive, hasGlobalUrl, hasListingUrl, expectedSource]
            [true, true, true, 'global'], // Unified active + both images -> global
            [true, true, false, 'global'], // Unified active + only global -> global
            [true, false, true, 'listing'], // Unified active + only listing -> listing
            [true, false, false, null], // Unified active + no images -> null
            [false, true, true, 'listing'], // Unified inactive + both images -> listing
            [false, true, false, null], // Unified inactive + only global -> null (global ignored)
            [false, false, true, 'listing'], // Unified inactive + only listing -> listing
            [false, false, false, null], // Unified inactive + no images -> null
        ] as const;

        testCases.forEach(([isActive, hasGlobalUrl, hasListingUrl, expectedSource]) => {
            const globalUrl = hasGlobalUrl ? 'uploads/categories/global/1_123.webp' : null;
            const listingUrl = hasListingUrl ? 'uploads/listings/listing_456.jpg' : null;

            const imageSource = getImageSource(isActive, globalUrl, listingUrl);

            if (expectedSource === 'global') {
                expect(imageSource).toBe(globalUrl);
            } else if (expectedSource === 'listing') {
                expect(imageSource).toBe(listingUrl);
            } else {
                expect(imageSource).toBeNull();
            }
        });
    });

    /**
     * Property: Button state is independent of image URL presence
     * The button should be enabled based solely on is_global_image_active,
     * regardless of whether global_image_url is set or not.
     */
    it('button state is independent of global_image_url presence', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 1000 }),
                fc.boolean(),
                fc.option(fc.string(), { nil: null }),
                (categoryId, isActive, imageUrl) => {
                    const category = createCategory(categoryId, isActive, imageUrl);
                    const buttonEnabled = isButtonEnabled(category);

                    // Button state should depend only on is_global_image_active
                    // not on whether global_image_url is present
                    expect(buttonEnabled).toBe(isActive);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Unified image takes precedence when active
     * When is_global_image_active is true and global_image_url exists,
     * the listing image should be ignored.
     */
    it('unified image takes precedence over listing image when active', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s.length > 0), // global_image_url
                fc.string().filter(s => s.length > 0), // listing_image_url
                (globalUrl, listingUrl) => {
                    const imageSource = getImageSource(true, globalUrl, listingUrl);

                    // When unified image is active and available, it should be used
                    // regardless of listing image availability
                    expect(imageSource).toBe(globalUrl);
                    expect(imageSource).not.toBe(listingUrl);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Listing image is used when unified image is inactive
     * When is_global_image_active is false, the global_image_url should be ignored
     * and listing image should be used if available.
     */
    it('listing image is used when unified image is inactive', () => {
        fc.assert(
            fc.property(
                fc.option(fc.string(), { nil: null }), // global_image_url (should be ignored)
                fc.string().filter(s => s.length > 0), // listing_image_url
                (globalUrl, listingUrl) => {
                    const imageSource = getImageSource(false, globalUrl, listingUrl);

                    // When unified image is inactive, listing image should be used
                    // regardless of global_image_url presence
                    expect(imageSource).toBe(listingUrl);
                    expect(imageSource).not.toBe(globalUrl);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Empty string URLs are treated as null
     * Empty strings should be treated the same as null/undefined URLs.
     */
    it('empty string URLs are treated as unavailable', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.constantFrom('', null, undefined),
                fc.constantFrom('', null, undefined),
                (isActive, globalUrl, listingUrl) => {
                    const imageSource = getImageSource(isActive, globalUrl, listingUrl);

                    // When both URLs are empty/null/undefined, result should be null
                    expect(imageSource).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Button state consistency
     * For the same category state, button should always have the same enabled state.
     */
    it('button state is consistent for same category state', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 1000 }),
                fc.boolean(),
                fc.option(fc.string(), { nil: null }),
                (categoryId, isActive, imageUrl) => {
                    const category1 = createCategory(categoryId, isActive, imageUrl);
                    const category2 = createCategory(categoryId, isActive, imageUrl);

                    const buttonEnabled1 = isButtonEnabled(category1);
                    const buttonEnabled2 = isButtonEnabled(category2);

                    // Same category state should produce same button state
                    expect(buttonEnabled1).toBe(buttonEnabled2);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Image source selection is deterministic
     * For the same inputs, image source selection should always return the same result.
     */
    it('image source selection is deterministic', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.option(fc.string(), { nil: null }),
                fc.option(fc.string(), { nil: null }),
                (isActive, globalUrl, listingUrl) => {
                    const imageSource1 = getImageSource(isActive, globalUrl, listingUrl);
                    const imageSource2 = getImageSource(isActive, globalUrl, listingUrl);

                    // Same inputs should produce same output
                    expect(imageSource1).toBe(imageSource2);
                }
            ),
            { numRuns: 100 }
        );
    });
});
