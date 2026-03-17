import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EditModal from '../EditModal';
import type { Category, CategoryField } from '@/types/filters-lists';
import * as categoryFieldsService from '@/services/categoryFields';
import * as makesService from '@/services/makes';
import * as optionRanksService from '@/services/optionRanks';
import * as sectionsService from '@/services/sections';

vi.mock('@/services/categoryFields');
vi.mock('@/services/makes');
vi.mock('@/services/optionRanks');
vi.mock('@/services/sections');

describe('EditModal spare-parts sections save', () => {
    const category: Category = {
        id: 2,
        slug: 'spare-parts',
        name: 'قطع غيار سيارات',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    };

    const mainSectionField: CategoryField = {
        id: -1,
        category_slug: 'spare-parts',
        field_name: 'main_section',
        display_name: 'الرئيسي',
        type: 'select',
        required: false,
        filterable: true,
        options: ['محركات'],
        is_active: true,
        sort_order: 9999,
        created_at: '',
        updated_at: '',
        rules_json: {},
    };

    const subSectionField: CategoryField = {
        ...mainSectionField,
        field_name: 'sub_section',
        display_name: 'الفرعي',
        options: ['ديزل'],
    };

    beforeEach(() => {
        vi.resetAllMocks();

        vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
            data: [mainSectionField, subSectionField],
            governorates: [],
            makes: [],
            supports_make_model: true,
            supports_sections: true,
            main_sections: [
                {
                    id: 101,
                    name: 'محركات',
                    sub_sections: [
                        { id: 201, name: 'ديزل', main_section_id: 101, is_active: true },
                    ],
                },
            ],
        });

        vi.mocked(sectionsService.fetchMainSections).mockResolvedValue({
            category: { id: 2, slug: 'spare-parts', name: 'قطع غيار سيارات' },
            main_sections: [
                {
                    id: 101,
                    name: 'محركات',
                    is_active: true,
                    sub_sections: [
                        { id: 201, name: 'ديزل', main_section_id: 101, is_active: true },
                    ],
                },
            ],
        });

        vi.mocked(sectionsService.createMainSection).mockResolvedValue({
            id: 102,
            name: 'إكسسوارات',
            is_active: true,
            sub_sections: [],
        } as any);

        vi.mocked(sectionsService.addSubSections).mockResolvedValue({
            main_section_id: 101,
            sub_sections: [{ id: 202, name: 'بنزين', main_section_id: 101, is_active: true }],
        });

        vi.mocked(sectionsService.updateMainSection).mockResolvedValue({ id: 101, name: 'محركات' } as any);
        vi.mocked(sectionsService.updateSubSection).mockResolvedValue({ id: 201, name: 'ديزل' } as any);
        vi.mocked(sectionsService.setMainSectionVisibility).mockResolvedValue({ id: 101, name: 'محركات' } as any);
        vi.mocked(sectionsService.setSubSectionVisibility).mockResolvedValue({ id: 201, name: 'ديزل' } as any);
        vi.mocked(sectionsService.updateMainSectionRanks).mockResolvedValue();
        vi.mocked(sectionsService.updateSubSectionRanks).mockResolvedValue();

        vi.mocked(makesService.fetchAdminMakesWithIds).mockResolvedValue([]);
        vi.mocked(optionRanksService.updateOptionRanks).mockResolvedValue({
            success: true,
            message: 'ok',
            data: { updated_count: 0, field: 'brand' },
        } as any);
    });

    it('creates a new main section on single add instead of hitting category-fields update', async () => {
        vi.mocked(sectionsService.fetchMainSections)
            .mockResolvedValueOnce({
                category: { id: 2, slug: 'spare-parts', name: 'قطع غيار سيارات' },
                main_sections: [
                    { id: 102, name: 'إكسسوارات', is_active: true, sub_sections: [] },
                    { id: 101, name: 'محركات', is_active: true, sub_sections: [] },
                ],
            });

        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={category}
                field={mainSectionField}
                initialFieldName="main_section"
            />
        );

        await waitFor(() => {
            expect(screen.queryByText(/جاري تحميل الخيارات/i)).not.toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText(/أدخل اسم الخيار الجديد/i), {
            target: { value: 'إكسسوارات' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'إضافة الخيار الجديد' }));

        await waitFor(() => {
            expect(sectionsService.createMainSection).toHaveBeenCalledWith('spare-parts', 'إكسسوارات');
            expect(sectionsService.updateMainSectionRanks).toHaveBeenCalledWith([
                { id: 102, rank: 1 },
                { id: 101, rank: 2 },
            ]);
            expect(makesService.updateCategoryFieldOptions).not.toHaveBeenCalled();
        });
    });

    it('bulk-adds sub sections under the selected main section using sections endpoints', async () => {
        vi.mocked(sectionsService.fetchMainSections)
            .mockResolvedValueOnce({
                category: { id: 2, slug: 'spare-parts', name: 'قطع غيار سيارات' },
                main_sections: [
                    {
                        id: 101,
                        name: 'محركات',
                        is_active: true,
                        sub_sections: [{ id: 201, name: 'ديزل', main_section_id: 101, is_active: true }],
                    },
                ],
            })
            .mockResolvedValueOnce({
                category: { id: 2, slug: 'spare-parts', name: 'قطع غيار سيارات' },
                main_sections: [
                    {
                        id: 101,
                        name: 'محركات',
                        is_active: true,
                        sub_sections: [{ id: 201, name: 'ديزل', main_section_id: 101, is_active: true }],
                    },
                ],
            })
            .mockResolvedValueOnce({
                category: { id: 2, slug: 'spare-parts', name: 'قطع غيار سيارات' },
                main_sections: [
                    {
                        id: 101,
                        name: 'محركات',
                        is_active: true,
                        sub_sections: [{ id: 201, name: 'ديزل', main_section_id: 101, is_active: true }],
                    },
                ],
            })
            .mockResolvedValueOnce({
                category: { id: 2, slug: 'spare-parts', name: 'قطع غيار سيارات' },
                main_sections: [
                    {
                        id: 101,
                        name: 'محركات',
                        is_active: true,
                        sub_sections: [
                            { id: 202, name: 'بنزين', main_section_id: 101, is_active: true },
                            { id: 201, name: 'ديزل', main_section_id: 101, is_active: true },
                        ],
                    },
                ],
            });

        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={category}
                field={subSectionField}
                initialFieldName="sub_section"
            />
        );

        await waitFor(() => {
            expect(screen.queryByText(/جاري تحميل الخيارات/i)).not.toBeInTheDocument();
        });

        fireEvent.change(
            screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل أو كل خيار في سطر جديد/i),
            { target: { value: 'بنزين' } }
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /إضافة الكل \(1\)/i })).toBeEnabled();
        });

        fireEvent.click(screen.getByRole('button', { name: /إضافة الكل \(1\)/i }));

        await waitFor(() => {
            expect(sectionsService.addSubSections).toHaveBeenCalledWith(101, ['بنزين']);
            expect(sectionsService.updateSubSectionRanks).toHaveBeenCalledWith([
                { id: 202, rank: 1 },
                { id: 201, rank: 2 },
            ]);
            expect(makesService.updateCategoryFieldOptions).not.toHaveBeenCalled();
        });
    });
});
