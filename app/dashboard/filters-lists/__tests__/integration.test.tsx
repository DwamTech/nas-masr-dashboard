/**
 * Integration Tests for Filters and Lists Management
 * 
 * Task 23.1: Wire all components together
 * 
 * These tests verify:
 * - All modals integrate with URL state
 * - Cache invalidation triggers correctly
 * - All user flows work end-to-end
 * - Error handling across all components
 * 
 * Requirements: 12.1, 12.3, 12.4, 12.5, 12.6, 12.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import FiltersListsPage from '../page';
import * as categoriesService from '@/services/categories';
import * as categoryFieldsService from '@/services/categoryFields';
import * as optionRanksService from '@/services/optionRanks';
import { cache } from '@/utils/cache';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}));

// Mock services
vi.mock('@/services/categories');
vi.mock('@/services/categoryFields');
vi.mock('@/services/optionRanks');

describe('Filters and Lists Management - Integration Tests', () => {
    let mockRouter: any;
    let mockSearchParams: any;
    let mockPush: any;

    beforeEach(() => {
        // Clear cache before each test
        cache.clear();

        // Setup router mock
        mockPush = vi.fn();
        mockRouter = {
            push: mockPush,
        };
        vi.mocked(useRouter).mockReturnValue(mockRouter);

        // Setup search params mock (no modal open initially)
        mockSearchParams = {
            get: vi.fn((key: string) => null),
        };
        vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

        // Setup localStorage mock
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn((key: string) => {
                    if (key === 'isAuthenticated') return 'true';
                    if (key === 'authToken') return 'test-token';
                    return null;
                }),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            },
            writable: true,
        });

        // Mock categories service
        vi.mocked(categoriesService.fetchCategories).mockResolvedValue({
            data: [
                {
                    id: 1,
                    slug: 'cars',
                    name: 'سيارات',
                    icon: 'car.png',
                    is_active: true,
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
            ],
        });

        // Mock category fields service
        vi.mocked(categoryFieldsServic