// Test file for Category Homepage Management API functions
// This file can be used to verify that API calls are working correctly

import {
    fetchAdminCategories,
    fetchCategoryHomepage,
    updateCategoryHomepage,
    fetchCategoriesUsageReport
} from '../services/makes';

/**
 * Test: Fetch all categories
 * Should return an array of categories
 */
export async function testFetchAllCategories(token?: string) {
    console.log('Testing: fetchAdminCategories...');
    try {
        const categories = await fetchAdminCategories(token);
        console.log('✅ Success! Found', categories.length, 'categories');
        console.log('Sample category:', categories[0]);
        return { success: true, data: categories };
    } catch (error) {
        console.error('❌ Error:', error);
        return { success: false, error };
    }
}

/**
 * Test: Fetch specific category details
 * @param categoryId - The ID of the category to fetch
 */
export async function testFetchCategoryDetails(categoryId: number, token?: string) {
    console.log('Testing: fetchCategoryHomepage for ID', categoryId);
    try {
        const category = await fetchCategoryHomepage(categoryId, token);
        console.log('✅ Success! Category details:', category);
        return { success: true, data: category };
    } catch (error) {
        console.error('❌ Error:', error);
        return { success: false, error };
    }
}

/**
 * Test: Update category name
 * @param categoryId - The ID of the category to update
 * @param newName - The new name for the category
 */
export async function testUpdateCategoryName(
    categoryId: number,
    newName: string,
    token?: string
) {
    console.log('Testing: updateCategoryHomepage - name update');
    try {
        const updated = await updateCategoryHomepage(categoryId, { name: newName }, token);
        console.log('✅ Success! Updated category:', updated);
        return { success: true, data: updated };
    } catch (error) {
        console.error('❌ Error:', error);
        return { success: false, error };
    }
}

/**
 * Test: Update category icon
 * @param categoryId - The ID of the category to update
 * @param iconFile - The new icon file
 */
export async function testUpdateCategoryIcon(
    categoryId: number,
    iconFile: File,
    token?: string
) {
    console.log('Testing: updateCategoryHomepage - icon update');
    try {
        const updated = await updateCategoryHomepage(categoryId, { icon: iconFile }, token);
        console.log('✅ Success! Updated category with new icon:', updated);
        return { success: true, data: updated };
    } catch (error) {
        console.error('❌ Error:', error);
        return { success: false, error };
    }
}

/**
 * Test: Update both name and icon
 * @param categoryId - The ID of the category to update
 * @param newName - The new name for the category
 * @param iconFile - The new icon file
 */
export async function testUpdateCategoryComplete(
    categoryId: number,
    newName: string,
    iconFile: File,
    token?: string
) {
    console.log('Testing: updateCategoryHomepage - complete update');
    try {
        const updated = await updateCategoryHomepage(
            categoryId,
            { name: newName, icon: iconFile },
            token
        );
        console.log('✅ Success! Updated category (name + icon):', updated);
        return { success: true, data: updated };
    } catch (error) {
        console.error('❌ Error:', error);
        return { success: false, error };
    }
}

/**
 * Test: Fetch usage report
 * Should return categories with listing counts
 */
export async function testFetchUsageReport(token?: string) {
    console.log('Testing: fetchCategoriesUsageReport...');
    try {
        const report = await fetchCategoriesUsageReport(token);
        console.log('✅ Success! Usage report:', report);
        return { success: true, data: report };
    } catch (error) {
        console.error('❌ Error:', error);
        return { success: false, error };
    }
}

/**
 * Run all tests
 * NOTE: Some tests require valid categoryId and iconFile
 */
export async function runAllTests() {
    console.log('=== Running All Category Homepage Management Tests ===\n');

    const token = typeof window !== 'undefined'
        ? localStorage.getItem('authToken') ?? undefined
        : undefined;

    // Test 1: Fetch all categories
    await testFetchAllCategories(token);
    console.log('\n---\n');

    // Test 2: Fetch specific category (use ID 1 as example)
    await testFetchCategoryDetails(1, token);
    console.log('\n---\n');

    // Test 3: Fetch usage report
    await testFetchUsageReport(token);
    console.log('\n---\n');

    // NOTE: Uncomment to test updates (requires valid data)
    // await testUpdateCategoryName(1, 'اسم جديد', token);
    // await testUpdateCategoryIcon(1, someIconFile, token);

    console.log('=== Tests Complete ===');
}

/**
 * Example usage in browser console:
 * 
 * import * as tests from './test-category-homepage';
 * 
 * // Run all tests
 * tests.runAllTests();
 * 
 * // Or run individual tests
 * tests.testFetchAllCategories();
 * tests.testFetchCategoryDetails(1);
 */
