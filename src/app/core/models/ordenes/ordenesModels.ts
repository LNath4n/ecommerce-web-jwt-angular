export interface OrderSummary {
  id: number;
  createdAt: string;
  total: number;
  status: string;
}

export interface DeliveredItem {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  redemptionInstructions: string | null;
  codes: string[];
}

export interface OrderDetail extends OrderSummary {
  items: DeliveredItem[];
}
