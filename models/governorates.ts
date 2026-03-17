// Governorate & City Models

export interface City {
    id: number;
    name: string;
    governorate_id: number;
    is_active?: boolean;
}

export interface Governorate {
    id: number;
    name: string;
    cities: City[];
    is_active?: boolean;
}

export interface GovernoratesResponse {
    data: Governorate[];
}

export interface CitiesMappings {
    by_governorate_id: Record<number, Record<string, number>>;
    by_governorate_name: Record<string, Record<string, number>>;
}

export interface CitiesMappingsResponse {
    success: boolean;
    data: CitiesMappings;
}

export interface CreateGovernorateResponse {
    id: number;
    name: string;
    cities: string[];
}

export interface CreateCityResponse {
    id: number;
    name: string;
    governorate_id: number;
}
