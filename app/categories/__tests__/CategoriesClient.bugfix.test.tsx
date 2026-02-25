/**
 * اختبار استكشاف حالة المشكلة - Bug Condition Exploration Test
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * هذا الاختبار يجب أن يفشل على الكود غير المصلح - الفشل يؤكد وجود المشكلة
 * 
 * Property 1: Fault Condition - خيار "غير ذلك" في موضع غير الآخر
 * 
 * الهدف: إظهار أمثلة مضادة توضح وجود المشكلة
 */

import { processOptions, processOptionsMap, processHierarchicalOptions } from '@/utils/optionsHelper';

/**
 * دالة Bug Condition كما هي محددة في التصميم
 * @param input - المدخلات للاختبار
 * @returns true إذا كانت المشكلة موجودة
 */
function isBugCondition(input: { options: string[], componentType: string }): boolean {
    return input.options.includes('غير ذلك')
        && input.options.indexOf('غير ذلك') !== (inpu