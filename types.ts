export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

export interface CartItem extends MenuItem {
  qty: number;
}

export interface OrderItemPayload {
  name: string;
  price: number;
  qty: number;
}

export interface OrderPayload {
  table: string;
  items: OrderItemPayload[];
  payment_method: string;
}

export interface OrderResponse {
  success: boolean;
  order_id: string;
  table: string;
  items: string;
  subtotal: number;
  gst: number;
  total: number;
}

export enum TableId {
  T1 = 'T1',
  T2 = 'T2',
  T3 = 'T3',
  T4 = 'T4',
  T5 = 'T5',
  T6 = 'T6',
  T7 = 'T7',
  T8 = 'T8',
  T9 = 'T9',
  T10 = 'T10',
}

export type OrderStatus = 'PENDING' | 'COOKING' | 'READY' | 'SERVED';

export interface KitchenOrder {
  order_id: string;
  table: string;
  items: string; // formatted text from n8n
  total: number;
  status: OrderStatus;
  created_at: string;
}

// n8n Webhook Response Types
export interface N8nPlaceOrderResponse {
  success: boolean;
  order_id: string;
  total: number;
}

export interface N8nOrderItem {
  order_id: string;
  table: string;
  items: string;
  total: number;
  status: OrderStatus;
  created_at: string;
}

export interface N8nGetOrdersResponse {
  success: boolean;
  orders: N8nOrderItem[];
}

export interface N8nUpdateStatusResponse {
  success: boolean;
  message?: string;
}