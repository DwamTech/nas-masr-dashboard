export interface MakeItem {
  name: string;
  models: string[];
}

export interface CarMakesResponse {
  count?: number;
  makes: MakeItem[];
}

export interface CategoryField {
  field_name: string;
  options: string[];
}

export interface CityItem {
  id?: number;
  governorate_id?: number;
  name: string;
}

export interface GovernorateItem {
  id?: number;
  name: string;
  cities: string[];
}

export interface GovernoratesResponse {
  count?: number;
  governorates: GovernorateItem[];
}
export type CategorySlug =
  | 'real_estate'
  | 'cars'
  | 'cars_rent'
  | 'spare-parts'
  | 'stores'
  | 'restaurants'
  | 'groceries'
  | 'food-products'
  | 'electronics'
  | 'home-tools'
  | 'furniture'
  | 'doctors'
  | 'health'
  | 'teachers'
  | 'education'
  | 'jobs'
  | 'shipping'
  | 'mens-clothes'
  | 'watches-jewelry'
  | 'free-professions'
  | 'kids-toys'
  | 'gym'
  | 'construction'
  | 'maintenance'
  | 'car-services'
  | 'home-services'
  | 'lighting-decor'
  | 'animals'
  | 'farm-products'
  | 'wholesale'
  | 'production-lines'
  | 'light-vehicles'
  | 'heavy-transport'
  | 'tools'
  | 'home-appliances'
  | 'missing';
export const CATEGORY_SLUGS: CategorySlug[] = [
  'real_estate',
  'cars',
  'cars_rent',
  'spare-parts',
  'stores',
  'restaurants',
  'groceries',
  'food-products',
  'electronics',
  'home-appliances',
  'home-tools',
  'furniture',
  'doctors',
  'health',
  'teachers',
  'education',
  'jobs',
  'shipping',
  'mens-clothes',
  'watches-jewelry',
  'free-professions',
  'kids-toys',
  'gym',
  'construction',
  'maintenance',
  'car-services',
  'home-services',
  'lighting-decor',
  'animals',
  'farm-products',
  'wholesale',
  'production-lines',
  'light-vehicles',
  'heavy-transport',
  'tools',
  'missing',
];
export type CategoryFieldMap = Record<string, string[]>;
export type CategoryFieldsBySlug = Partial<Record<CategorySlug, CategoryField[]>>;
export type CategoryFieldMapBySlug = Partial<Record<CategorySlug, CategoryFieldMap>>;

export interface AdminCategoryFieldUpdateRequest {
  field_name: string;
  options: string[];
}

export interface AdminCategoryFieldRecord {
  id: number;
  category_slug: string;
  field_name: string;
  display_name?: string;
  type?: string;
  required?: boolean;
  filterable?: boolean;
  options: string[];
  rules_json?: unknown;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminCategoryFieldApiResponse {
  message: string;
  data: AdminCategoryFieldRecord;
}

export interface AdminMakeCreateResponse {
  id: number;
  name: string;
  models: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AdminModelRecord {
  id: number;
  name: string;
  make_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminMakeModelsResponse {
  make_id: number;
  models: AdminModelRecord[];
}

export interface AdminMakeListItem {
  id: number;
  name: string;
  models: string[];
  model_objects?: AdminModelRecord[];
}

export interface AdminMainSectionRecord {
  id: number;
  category_id: number;
  name: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  sub_sections?: AdminSubSectionRecord[];
}

export interface AdminSubSectionRecord {
  id: number;
  category_id: number;
  main_section_id: number;
  name: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminSubSectionsResponse {
  main_section_id: number;
  sub_sections: AdminSubSectionRecord[];
}

export interface AdminMainSectionsListResponse {
  category?: {
    id: number;
    slug?: string;
    name: string;
  };
  main_sections: AdminMainSectionRecord[];
}

export interface AdminCategoryListItem {
  id: number;
  slug?: string;
  name: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
  show_on_homepage?: boolean;
  homepage_image?: string;
  cards_count?: number;
  fields?: CategoryField[];
}

export interface CategoryHomepageItem {
  id: number;
  name: string;
  slug?: string;
  icon_url?: string;
  is_active?: number | boolean;
  sort_order?: number;
}

export interface CategoryHomepageUpdateRequest {
  name?: string;
  icon?: File | null;
  is_active?: number | boolean;
}

export interface CategoryHomepageResponse {
  message: string;
  data: CategoryHomepageItem;
}
