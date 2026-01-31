import { OrderPayload, OrderResponse, KitchenOrder, OrderStatus, N8nPlaceOrderResponse, N8nGetOrdersResponse, N8nUpdateStatusResponse } from '../types';
import { API_ENDPOINTS, API_CONFIG } from '../config';

/**
 * CUSTOMER SIDE: Submit order to n8n webhook
 */
export const submitOrder = async (payload: OrderPayload): Promise<OrderResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    console.log('[orderService] Submitting order to:', API_ENDPOINTS.PLACE_ORDER);
    
    const subtotal = payload.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const gst = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + gst;

    const requestBody = {
      table: payload.table,
      items: payload.items.map(item => ({
        name: item.name,
        price: item.price,
        qty: item.qty,
        total: item.price * item.qty
      })),
      subtotal,
      gst,
      total,
      paymentMethod: payload.payment_method,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(API_ENDPOINTS.PLACE_ORDER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: N8nPlaceOrderResponse = await response.json();

    if (!data.success || !data.order_id) {
      throw new Error('Invalid response from server');
    }

    const orderResponse: OrderResponse = {
      success: true,
      order_id: data.order_id,
      table: payload.table,
      items: payload.items.map(item => `${item.name} x${item.qty}`).join(', '),
      subtotal,
      gst,
      total: data.total || total,
    };

    console.log('[orderService] Order placed successfully:', data.order_id);
    return orderResponse;

  } catch (error) {
    clearTimeout(timeoutId);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[orderService] Failed to submit order:', errorMsg);
    throw new Error(`Failed to place order: ${errorMsg}`);
  }
};

/**
 * KITCHEN SIDE: Fetch all orders from Google Sheets via n8n
 */
export const getKitchenOrders = async (): Promise<KitchenOrder[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    console.log('[orderService] Fetching orders from:', API_ENDPOINTS.GET_ORDERS);

    const response = await fetch(API_ENDPOINTS.GET_ORDERS, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: N8nGetOrdersResponse = await response.json();

    if (!data.success || !Array.isArray(data.orders)) {
      throw new Error('Invalid response format');
    }

    // Convert n8n response to KitchenOrder format
    // Sort by newest first
    const orders: KitchenOrder[] = data.orders
      .map(order => ({
        order_id: order.order_id,
        table: order.table,
        items: order.items, // Already formatted as string from n8n
        total: order.total,
        status: order.status as OrderStatus,
        created_at: order.created_at,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`[orderService] Fetched ${orders.length} orders`);
    return orders;

  } catch (error) {
    clearTimeout(timeoutId);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[orderService] Failed to fetch orders:', errorMsg);
    throw new Error(`Failed to fetch orders: ${errorMsg}`);
  }
};

/**
 * KITCHEN SIDE: Update order status in Google Sheets via n8n
 * Valid transitions: PENDING → COOKING → READY → SERVED
 */
export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    console.log(`[orderService] Updating order ${orderId} to ${newStatus}`);

    const response = await fetch(API_ENDPOINTS.UPDATE_ORDER_STATUS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        status: newStatus,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: N8nUpdateStatusResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update status');
    }

    console.log(`[orderService] Order ${orderId} updated to ${newStatus}`);
    return true;

  } catch (error) {
    clearTimeout(timeoutId);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[orderService] Failed to update order status:', errorMsg);
    return false;
  }
};

/**
 * KITCHEN SIDE: Parse items string into readable format
 * Input: "Biryani x2, Coke x1"
 * Output: Array of items with name and qty
 */
export const parseKitchenItems = (itemsString: string): { name: string; qty: number }[] => {
  try {
    const items: { name: string; qty: number }[] = [];
    const parts = itemsString.split(',').map(p => p.trim());

    for (const part of parts) {
      const match = part.match(/^(.+?)\s+x(\d+)$/);
      if (match) {
        items.push({
          name: match[1].trim(),
          qty: parseInt(match[2], 10),
        });
      }
    }

    return items.length > 0 ? items : [{ name: itemsString, qty: 1 }];
  } catch {
    return [{ name: itemsString, qty: 1 }];
  }
};