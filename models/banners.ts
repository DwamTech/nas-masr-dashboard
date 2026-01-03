// models/banners.ts

export interface Banner {
    slug: string;
    banner_url: string | null;
}

export interface BannersResponse {
    success: boolean;
    data: Banner[];
}

export interface UpdateBannerRequest {
    banner: File;
}

export interface UpdateBannerResponse {
    success: boolean;
    message: string;
    data?: {
        slug: string;
        banner_url: string;
    };
}
