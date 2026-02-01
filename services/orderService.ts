import { OrderPayload, OrderResponse, KitchenOrder, OrderStatus, N8nPlaceOrderResponse, N8nGetOrdersResponse, N8nUpdateStatusResponse } from '../types';
import { API_ENDPOINTS, API_CONFIG } from '../config';

/**
 * Robust date parsing for various formats (ISO, DD/MM/YYYY, etc.)
 */
const safeParseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // Try standard parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;
  
  // Try parsing DD/MM/YYYY
  const parts = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const year = parseInt(parts[3], 10);
    
    // Check if there's time info
    const timeParts = dateStr.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(am|pm)?/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      const seconds = parseInt(timeParts[3], 10);
      const ampm = timeParts[4]?.toLowerCase();
      
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      return new Date(year, month, day, hours, minutes, seconds);
    }
    
    return new Date(year, month, day);
  }
  
  return new Date();
};

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

    const text = await response.text();
    let data: any;
    
    try {
      data = text ? JSON.parse(text) : { success: true };
    } catch (e) {
      console.warn('[orderService] Failed to parse JSON response, using fallback:', text);
      data = { success: true };
    }

    // Be flexible with n8n response format
    const isSuccess = data.success !== false; // true unless explicitly false
    const orderId = data.order_id || `ORD-${Date.now().toString().slice(-6)}`;

    if (!isSuccess) {
      throw new Error(data.message || 'Server returned an error');
    }

    const orderResponse: OrderResponse = {
      success: true,
      order_id: String(orderId),
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
    const baseUrl = API_ENDPOINTS.GET_ORDERS;
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
    
    console.log('[orderService] Fetching orders from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    let rawData: any;

    try {
      rawData = text ? JSON.parse(text) : [];
    } catch (e) {
      console.warn('[orderService] Failed to parse JSON response for getKitchenOrders:', text);
      rawData = [];
    }

    // Normalize data structure
    let orderList: any[] = [];
    
    if (Array.isArray(rawData)) {
      orderList = rawData;
    } else if (rawData && typeof rawData === 'object') {
      if (Array.isArray(rawData.orders)) {
        orderList = rawData.orders;
      } else if (rawData.order_id) {
        // Single order object
        orderList = [rawData];
      }
    }

    if (orderList.length === 0 && text && !text.includes('[]') && !text.includes('orders')) {
      console.warn('[orderService] No orders found in response, but response was not empty:', text);
    }

    // Convert n8n response to KitchenOrder format
    // Sort by newest first
    const orders: KitchenOrder[] = orderList
      .filter(order => order && (order.order_id || order.orderId)) // Support both snake_case and camelCase
      .map(order => {
        const orderId = String(order.order_id || order.orderId);
        const createdAt = order.created_at || order.timestamp || new Date().toISOString();
        
        return {
          order_id: orderId,
          table: String(order.table || 'N/A'),
          items: String(order.items || ''),
          total: Number(order.total || 0),
          status: (order.status as OrderStatus) || 'PENDING',
          created_at: createdAt,
        };
      })
      .sort((a, b) => {
        const timeA = safeParseDate(a.created_at).getTime();
        const timeB = safeParseDate(b.created_at).getTime();
        return timeB - timeA;
      });

    console.log(`[orderService] Fetched and normalized ${orders.length} orders`);
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

    const text = await response.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : { success: true };
    } catch (e) {
      console.warn('[orderService] Failed to parse JSON response for updateOrderStatus:', text);
      data = { success: true };
    }

    // Be flexible with n8n response format
    const isSuccess = data.success !== false; // true unless explicitly false

    if (!isSuccess) {
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
      // Handle "Item Name x1" or "Item Name x1 (₹Price)"
      const match = part.match(/^(.+?)\s+x(\d+)(?:\s+\(₹\d+(?:\.\d+)?\))?$/);
      if (match) {
        items.push({
          name: match[1].trim(),
          qty: parseInt(match[2], 10),
        });
      } else {
        // Fallback for multi-line or non-standard format
        items.push({ name: part, qty: 1 });
      }
    }

    return items.length > 0 ? items : [{ name: itemsString, qty: 1 }];
  } catch {
    return [{ name: itemsString, qty: 1 }];
  }
};