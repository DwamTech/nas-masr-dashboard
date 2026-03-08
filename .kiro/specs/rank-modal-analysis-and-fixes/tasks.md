# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Scroll داخل النافذة فقط
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: scroll events داخل scroll container مع محتوى يتطلب scroll
  - Test that scroll events داخل scroll container تحدث في الصفحة الرئيسية بدلاً من محتوى النافذة (from Fault Condition in design)
  - Test implementation details:
    - Mouse wheel scroll داخل منطقة المحتوى يحرك الصفحة الرئيسية
    - Touch scroll على جهاز لوحي يحرك الصفحة الرئيسية
    - Scroll chaining عند الوصول لنهاية المحتوى ينتقل للصفحة الرئيسية
    - محتوى قصير لا يحتاج scroll قد يسبب scroll في الصفحة الرئيسية
  - The test assertions should match: scroll يحدث داخل محتوى النافذة فقط، body.scrollTop لا يتغير، scrollContainer.scrollTop يتغير
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: scroll events تنتقل من scroll container إلى body element
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - السلوكيات الحالية للنافذة
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (التفاعلات التي لا تتعلق بـ scroll المحتوى)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - إغلاق النافذة بالضغط على زر X أو خارج النافذة أو مفتاح Escape
    - منع scroll الصفحة الرئيسية عند فتح النافذة (body overflow: hidden)
    - وظيفة drag & drop لإعادة ترتيب العناصر
    - وظيفة حفظ الترتيب والتعامل مع القوائم الهرمية
    - keyboard navigation و focus trap
    - عرض رسائل الخطأ والنجاح
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix for Rank Modal Scroll Issue

  - [x] 3.1 Implement the fix in RankModal.tsx
    - إضافة `overscrollBehavior: 'contain'` إلى scroll container style object (السطر 382)
    - إضافة `touchAction: 'pan-y'` إلى scroll container style object
    - الحفاظ على جميع الخصائص الحالية: flex: 1, overflow-y: auto, WebkitOverflowScrolling: 'touch', padding, backgroundColor
    - _Bug_Condition: isBugCondition(scrollEvent) where scrollEvent.target IS scrollContainer AND scrollContainer.scrollHeight > scrollContainer.clientHeight AND scrollEvent.deltaY != 0 AND scrollEvent propagates to body element_
    - _Expected_Behavior: scroll يحدث داخل محتوى النافذة فقط، body.scrollTop لا يتغير، scrollContainer.scrollTop يتغير، scroll chaining يتوقف عند نهاية المحتوى_
    - _Preservation: جميع التفاعلات التي لا تتعلق بـ scroll المحتوى (إغلاق النافذة، drag & drop، keyboard navigation، اختيار parent، حفظ الترتيب) تعمل بنفس الطريقة_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Scroll داخل النافذة فقط
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - السلوكيات الحالية للنافذة
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
