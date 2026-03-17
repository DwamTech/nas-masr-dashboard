import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EditModal from '../EditModal';
import type { Category, CategoryField } from '@/types/filters-lists';
import * as categoryFieldsService from '@/services/categoryFields';
import * as makesService from '@/services/makes';
import * as optionRanksService from '@/services/optionRanks';

vi.mock('@/services/categoryFields');
vi.mock('@/services/makes');
vi.mock('@/services/optionRanks');

describe('EditModal automotive shared save', () => {
    const category: Category = {
        id: 1,
        slug: 'cars',
        name: 'سيارات',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    };

    const brandField: CategoryField = {
        id: 11,
        category_slug: 'cars',
        field_name: 'brand',
        display_name: 'الماركة',
        type: 'select',
        required: false,
        filterable: true,
        options: ['تويوتا', 'غير ذلك'],
        is_active: true,
        sort_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    };

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
            data: [brandField],
            governorates: [],
            makes: [],
            supports_make_model: true,
            supports_sections: false,
            main_sections: [],
        });

        vi.mocked(makesService.fetchAdminMakesWithIds).mockResolvedValue([
            {
                id: 10,
                name: 'تويوتا',
                models: ['كورولا', 'غير ذلك'],
                model_objects: [
                    { id: 101, name: 'كورولا', make_id: 10 },
                    { id: 102, name: 'غير ذلك', make_id: 10 },
                ],
            },
        ]);

        vi.mocked(makesService.postAdminMake).mockResolvedValue({
            id: 20,
            name: 'هيونداي',
            models: [],
        } as any);

        vi.mocked(optionRanksService.updateOptionRanks).mockResolvedValue({
            success: true,
            message: 'ok',
            data: { updated_count: 2, field: 'brand' },
        } as any);
    });

    it('persists bulk-added brands to makes source and updates ranks', async () => {
        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={category}
                field={brandField}
                initialFieldName="brand"
                fieldScope="onlyAutomotiveShared"
            />
        );

        await waitFor(() => {
            expect(screen.queryByText(/جاري تحميل الخيارات/i)).not.toBeInTheDocument();
        });

        fireEvent.change(
            screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل أو كل خيار في سطر جديد/i),
            { target: { value: 'هيونداي' } }
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /إضافة الكل/i })).not.toBeDisabled();
        });

        fireEvent.click(screen.getByRole('button', { name: /إضافة الكل/i }));

        await waitFor(() => {
            expect(makesService.postAdminMake).toHaveBeenCalledWith('هيونداي');
            expect(optionRanksService.updateOptionRanks).toHaveBeenCalledWith(
                'cars',
                'brand',
                [
                    { option: 'هيونداي', rank: 1 },
                    { option: 'تويوتا', rank: 2 },
                ]
            );
        });
    });
});
