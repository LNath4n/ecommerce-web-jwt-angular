export interface AddCartItemRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemQuantityRequest {
  productId: number;
  quantity: number;
}

export interface CartItemResponse {
  productId: number;
  slug: string;
  name: string;
  sku: string;
  platform: string | null;
  quantity: number;
  salePrice: number;
  imageUrl: string | null;
}

export interface CartResponse {
  items: CartItemResponse[];
  createdAt: string;
  subtotal: number;
}
