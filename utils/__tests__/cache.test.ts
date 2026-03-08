/**
 * Cache Utility Property Tests
 * 
 * Feature: filters-lists-management
 * 
 * **Property 14: Cache Invalidation on Mutation**
 * **Validates: Requirements 14.6**
 * 
 * For any successful mutation operation (add, edit, rank, hide/show), 
 * the cache entries related to the modified data (category fields, 
 * specific field options) must be invalidated, ensuring subsequent 
 * reads fetch fresh data.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { cache, CACHE_TIMES, INVALIDATION_PATTERNS } from '../cache';

describe('Feature: filters-lists-management, Property 14: Cache Invalidation on Mutation', () => {

    beforeEach(() => {
        // Clear cache before each test
        cache.clear();
    });

    describe('Unit Tests - Cache Basic Operations', () => {

        it('should store and retrieve data from cache', () => {
            const key = 'test-key';
            const data = { value: 'test-data' };
            const staleTime = 1000;

            cache.set(key, data, staleTime);
            const retrieved = cache.get(key);

            expect(retrieved).toEqual(data);
        });

        it('should return null for non-existent keys', () => {
            const result = cache.get('non-existent-key');
            expect(result).toBeNull();
        });

        it('should return null for stale data', async () => {
            const key = 'stale-key';
            const data = { value: 'test' };
            const staleTime = 10; // 10ms

            cache.set(key, data, staleTime);

            // Wait for data to become stale
            await new Promise(resolve => setTimeout(resolve, 20));

            const result = cache.get(key);
            expect(result).toBeNull();
        });

        it('should invalidate cache entries by pattern', () => {
            cache.set('fields:cars', { data: 'cars' }, 1000);
            cache.set('fields:jobs', { data: 'jobs' }, 1000);
            cache.set('categories', { data: 'categories' }, 1000);

            cache.invalidate('fields:');

            expect(cache.get('fields:cars')).toBeNull();
            expect(cache.get('fields:jobs')).toBeNull();
            expect(cache.get('categories')).not.toBeNull();
        });

        it('should clear all cache entries', () => {
            cache.set('key1', 'data1', 1000);
            cache.set('key2', 'data2', 1000);
            cache.set('key3', 'data3', 1000);

            cache.clear();

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
            expect(cache.get('key3')).toBeNull();
        });

    });

    describe('Property Tests - Cache Invalidation on Mutation', () => {

        it('should invalidate cache after rank update mutation', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }), // categorySlug
                    fc.array(fc.record({
                        option: fc.string({ minLength: 1, maxLength: 50 }),
                        rank: fc.nat({ max: 100 })
                    }), { minLength: 1, maxLength: 20 }), // rank data
                    (categorySlug, rankData) => {
                        // Arrange: Set up cache with category field data
                        const cacheKey = `fields:${categorySlug}`;
                        const initialData = { fields: rankData };
                        cache.set(cacheKey, initialData, CACHE_TIMES.CATEGORY_FIELDS);

                        // Verify data is cached
                        expect(cache.get(cacheKey)).toEqual(initialData);

                        // Act: Simulate mutation by invalidating cache
                        const invalidationPattern = INVALIDATION_PATTERNS.RANK_UPDATE(categorySlug);
                        cache.invalidate(invalidationPattern);

                        // Assert: Cache should be invalidated
                        expect(cache.get(cacheKey)).toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should invalidate specific field cache after option update mutation', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }), // categorySlug
                    fc.string({ minLength: 1, maxLength: 20 }), // fieldName
                    fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 20 }), // options
                    (categorySlug, fieldName, options) => {
                        // Arrange: Set up cache with field options
                        const cacheKey = `fields:${categorySlug}:${fieldName}`;
                        const initialData = { options };
                        cache.set(cacheKey, initialData, CACHE_TIMES.CATEGORY_FIELDS);

                        // Verify data is cached
                        expect(cache.get(cacheKey)).toEqual(initialData);

                        // Act: Simulate option update mutation
                        const invalidationPattern = INVALIDATION_PATTERNS.OPTION_UPDATE(categorySlug, fieldName);
                        cache.invalidate(invalidationPattern);

                        // Assert: Specific field cache should be invalidated
                        expect(cache.get(cacheKey)).toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should invalidate only related cache entries, not unrelated ones', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }), // categorySlug1
                    fc.string({ minLength: 1, maxLength: 20 }), // categorySlug2
                    fc.string({ minLength: 1, maxLength: 20 }), // fieldName
                    (categorySlug1, categorySlug2, fieldName) => {
                        // Ensure different category slugs
                        fc.pre(categorySlug1 !== categorySlug2);

                        // Arrange: Set up cache for multiple categories
                        const key1 = `fields:${categorySlug1}`;
                        const key2 = `fields:${categorySlug2}`;
                        const key3 = `fields:${categorySlug1}:${fieldName}`;
                        const unrelatedKey = `categories`;

                        cache.set(key1, { data: 'category1' }, CACHE_TIMES.CATEGORY_FIELDS);
                        cache.set(key2, { data: 'category2' }, CACHE_TIMES.CATEGORY_FIELDS);
                        cache.set(key3, { data: 'field' }, CACHE_TIMES.CATEGORY_FIELDS);
                        cache.set(unrelatedKey, { data: 'categories' }, CACHE_TIMES.CATEGORIES);

                        // Act: Invalidate only category1 related caches
                        const invalidationPattern = INVALIDATION_PATTERNS.RANK_UPDATE(categorySlug1);
                        cache.invalidate(invalidationPattern);

                        // Assert: Only category1 caches should be invalidated
                        expect(cache.get(key1)).toBeNull();
                        expect(cache.get(key3)).toBeNull();
                        expect(cache.get(key2)).not.toBeNull();
                        expect(cache.get(unrelatedKey)).not.toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should ensure subsequent reads return null after invalidation', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }), // categorySlug
                    fc.array(fc.record({
                        field: fc.string({ minLength: 1, maxLength: 20 }),
                        data: fc.anything()
                    }), { minLength: 1, maxLength: 10 }), // multiple fields
                    (categorySlug, fields) => {
                        // Arrange: Cache multiple fields for a category
                        fields.forEach(({ field, data }) => {
                            const key = `fields:${categorySlug}:${field}`;
                            cache.set(key, data, CACHE_TIMES.CATEGORY_FIELDS);
                        });

                        // Verify all fields are cached
                        fields.forEach(({ field, data }) => {
                            const key = `fields:${categorySlug}:${field}`;
                            expect(cache.get(key)).toEqual(data);
                        });

                        // Act: Invalidate all category fields
                        const invalidationPattern = INVALIDATION_PATTERNS.RANK_UPDATE(categorySlug);
                        cache.invalidate(invalidationPattern);

                        // Assert: All subsequent reads should return null
                        fields.forEach(({ field }) => {
                            const key = `fields:${categorySlug}:${field}`;
                            expect(cache.get(key)).toBeNull();
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should handle cache invalidation for hierarchical list mutations', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }), // categorySlug
                    fc.string({ minLength: 1, maxLength: 20 }), // parentField
                    fc.string({ minLength: 1, maxLength: 20 }), // childField
                    fc.string({ minLength: 1, maxLength: 20 }), // parentValue
                    (categorySlug, parentField, childField, parentValue) => {
                        // Arrange: Cache parent and child data
                        const parentKey = `fields:${categorySlug}:${parentField}`;
                        const childKey = `fields:${categorySlug}:${childField}:${parentValue}`;

                        cache.set(parentKey, { data: 'parent' }, CACHE_TIMES.CATEGORY_FIELDS);
                        cache.set(childKey, { data: 'child' }, CACHE_TIMES.CATEGORY_FIELDS);

                        // Act: Invalidate child field only
                        cache.invalidate(`fields:${categorySlug}:${childField}`);

                        // Assert: Only child cache should be invalidated
                        expect(cache.get(childKey)).toBeNull();
                        expect(cache.get(parentKey)).not.toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should maintain cache consistency after multiple mutations', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }), // categorySlug
                    fc.array(fc.record({
                        field: fc.string({ minLength: 1, maxLength: 20 }),
                        mutationType: fc.constantFrom('add', 'edit', 'rank', 'hide')
                    }), { minLength: 1, maxLength: 5 }), // multiple mutations
                    (categorySlug, mutations) => {
                        // Arrange: Set up initial cache state
                        mutations.forEach(({ field }) => {
                            const key = `fields:${categorySlug}:${field}`;
                            cache.set(key, { data: 'initial' }, CACHE_TIMES.CATEGORY_FIELDS);
                        });

                        // Act: Simulate multiple mutations
                        mutations.forEach(({ field, mutationType }) => {
                            // Each mutation should invalidate its related cache
                            const pattern = INVALIDATION_PATTERNS.OPTION_UPDATE(categorySlug, field);
                            cache.invalidate(pattern);

                            // Verify invalidation
                            const key = `fields:${categorySlug}:${field}`;
                            expect(cache.get(key)).toBeNull();

                            // Simulate refetch after mutation
                            cache.set(key, { data: `updated-${mutationType}` }, CACHE_TIMES.CATEGORY_FIELDS);
                        });

                        // Assert: All caches should have updated data
                        mutations.forEach(({ field, mutationType }) => {
                            const key = `fields:${categorySlug}:${field}`;
                            const cached = cache.get(key);
                            expect(cached).toEqual({ data: `updated-${mutationType}` });
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });

    });

});