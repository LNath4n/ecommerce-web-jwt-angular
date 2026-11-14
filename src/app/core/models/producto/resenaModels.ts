import { PageResponse } from '@core/models/producto/productoModels';

export interface ReviewRequest {
  rating: number;
  comment: string | null;
}

export interface ReviewResponse {
  id: number;
  productId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewSummary {
  productId: number;
  average: number;
  count: number;
}

export interface ReviewEligibility {
  purchased: boolean;
  alreadyReviewed: boolean;
}

export type ReviewPage = PageResponse<ReviewResponse>;
