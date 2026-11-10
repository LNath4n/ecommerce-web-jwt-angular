export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface PublicProductResponse {
  id: number;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  platform: string | null;
  type: ProductType;
  region: string | null;
  faceValue: number | null;
  currency: string | null;
  salePrice: number;
  redemptionInstructions: string | null;
  imageUrl: string | null;
  stock: number;
  views: number;
  averageRating: number;
  totalReviews: number;
}

export interface AdminProductResponse extends PublicProductResponse {
  costPrice: number | null;
  active: boolean;
  categoryId: number | null;
  createdAt: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  description?: string | null;
  platform?: string | null;
  type: ProductType;
  region?: string | null;
  faceValue?: number | null;
  currency?: string | null;
  salePrice: number;
  costPrice?: number | null;
  redemptionInstructions?: string | null;
  active?: boolean | null;
  categoryId?: number | null;
}

export interface CategoryOptionResponse {
  id: number;
  name: string;
}

export interface CategoryRequest {
  name: string;
}

export type ProductType =
  | 'GIFT_CARD'
  | 'CLAVE_JUEGO'
  | 'LICENCIA_SOFTWARE'
  | 'RECARGA'
  | 'SUSCRIPCION';

export type ProductOrder =
  | ''
  | 'calificacion'
  | 'vistas'
  | 'resenas'
  | 'precio_asc'
  | 'precio_desc';
