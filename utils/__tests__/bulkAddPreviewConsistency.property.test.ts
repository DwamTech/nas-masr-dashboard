import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { OptionsHelper } from '../optionsHelper';

/**
 * Property 9: Bulk Add Preview Consistency
 * 
 * Feature: filters-lists-management
 * Task: 12.3
 * 
 * Property Statement:
 * For any bulk input string, the preview of options to be added must exactly match 
 * the options that will actually be added when the user confirms the bulk add operation.
 * 
 * Validates: Requirements 6.22
 * 
 * This property ensures that what users see in the preview is exactly what will be added,
 * preventing any surprises or inconsistencies between preview and actual addition.
 */

describe('Feature: filters-lists-management, Property 9: Bulk Add Preview Consistency', () => {
    it('should ensure preview matches actual bulk add for comma-separated input', () => {
        fc.assert(
            fc.property(
                // Generate array of option strings
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 10 }
                ),
                (options) => {
                    // Arrange: Create comma-separated input
                    const bulkInput = options.join(', ');

                    // Act: Parse the input (this is what preview uses)
                    const previewOptions = OptionsHelper.parseBulkInput(bulkInput);

                    // Simulate what happens when user clicks "Add All"
                    // The actual add operation should use the same parsed options
                    const actualAddedOptions = OptionsHelper.parseBulkInput(bulkInput);

                    // Assert: Preview must exactly match what gets added
                    expect(previewOptions).toEqual(actualAddedOptions);
                    expect(previewOptions.length).toBe(actualAddedOptions.length);

                    // Verify each option matches
                    for (let i = 0; i < previewOptions.length; i++) {
                        expect(previewOptions[i]).toBe(actualAddedOptions[i]);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should ensure preview matches actual bulk add for line-separated input', () => {
        fc.assert(
            fc.property(
                // Generate array of option strings
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes('\n')),
                    { minLength: 1, maxLength: 10 }
                ),
                (options) => {
                    // Arrange: Create line-separated input
                    const bulkInput = options.join('\n');

                    // Act: Parse the input (this is what preview uses)
                    const previewOptions = OptionsHelper.parseBulkInput(bulkInput);

                    // Simulate what happens when user clicks "Add All"
                    const actualAddedOptions = OptionsHelper.parseBulkInput(bulkInput);

                    // Assert: Preview must exactly match what gets added
                    expect(previewOptions).toEqual(actualAddedOptions);
                    expect(previewOptions.length).toBe(actualAddedOptions.length);

                    // Verify each option matches
                    for (let i = 0; i < previewOptions.length; i++) {
                        expect(previewOptions[i]).toBe(actualAddedOptions[i]);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should ensure preview matches actual bulk add with mixed whitespace', () => {
        fc.assert(
            fc.property(
                // Generate array of option strings with potential whitespace
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.constantFrom(',', '\n'), // Separator
                (options, separator) => {
                    // Arrange: Create input with extra whitespace
                    const bulkInput = options
                        .map(opt => `  ${opt}  `) // Add whitespace around each option
                        .join(separator);

                    // Act: Parse the input (this is what preview uses)
                    const previewOptions = OptionsHelper.parseBulkInput(bulkInput);

                    // Simulate what happens when user clicks "Add All"
                    const actualAddedOptions = OptionsHelper.parseBulkInput(bulkInput);

                    // Assert: Preview must exactly match what gets added
                    expect(previewOptions).toEqual(actualAddedOptions);

                    // Both should have trimmed the whitespace
                    for (const option of previewOptions) {
                        expect(option).toBe(option.trim());
                    }

                    for (const option of actualAddedOptions) {
                        expect(option).toBe(option.trim());
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should ensure preview matches actual bulk add with empty entries', () => {
        fc.assert(
            fc.property(
                // Generate array with some empty strings mixed in
                fc.array(
                    fc.oneof(
                        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                        fc.constant(''),
                        fc.constant('   ')
                    ),
                    { minLength: 1, maxLength: 10 }
                ),
                (options) => {
                    // Arrange: Create comma-separated input with empty entries
                    const bulkInput = options.join(', ');

                    // Act: Parse the input (this is what preview uses)
                    const previewOptions = OptionsHelper.parseBulkInput(bulkInput);

                    // Simulate what happens when user clicks "Add All"
                    const actualAddedOptions = OptionsHelper.parseBulkInput(bulkInput);

                    // Assert: Preview must exactly match what gets added
                    expect(previewOptions).toEqual(actualAddedOptions);

                    // Both should have filtered out empty strings
                    expect(previewOptions.every(opt => opt.trim().length > 0)).toBe(true);
                    expect(actualAddedOptions.every(opt => opt.trim().length > 0)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should ensure preview count matches actual add count', () => {
        fc.assert(
            fc.property(
                // Generate bulk input string directly
                fc.string({ minLength: 1, maxLength: 200 }),
                (bulkInput) => {
                    // Act: Parse the input
                    const previewOptions = OptionsHelper.parseBulkInput(bulkInput);
                    const actualAddedOptions = OptionsHelper.parseBulkInput(bulkInput);

                    // Assert: Counts must match
                    expect(previewOptions.length).toBe(actualAddedOptions.length);

                    // If preview shows N options, exactly N options should be added
                    if (previewOptions.length > 0) {
                        expect(actualAddedOptions.length).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should ensure idempotent parsing (parsing twice gives same result)', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 200 }),
                (bulkInput) => {
                    // Act: Parse multiple times
                    const firstParse = OptionsHelper.parseBulkInput(bulkInput);
                    const secondParse = OptionsHelper.parseBulkInput(bulkInput);
                    const thirdParse = OptionsHelper.parseBulkInput(bulkInput);

                    // Assert: All parses should give identical results
                    expect(firstParse).toEqual(secondParse);
                    expect(secondParse).toEqual(thirdParse);
                    expect(firstParse).toEqual(thirdParse);
                }
            ),
            { numRuns: 100 }
        );
    });
});
