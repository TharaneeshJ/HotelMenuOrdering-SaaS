/**
 * API Configuration for n8n Webhooks
 * Point to your self-hosted n8n instance
 */

const BASE_URL = import.meta.env.VITE_N8N_URL || 'http://localhost:5678';

export const API_ENDPOINTS = {
  PLACE_ORDER: `${BASE_URL}/webhook/place-order`,
  GET_ORDERS: `${BASE_URL}/webhook/get-orders`,
  UPDATE_ORDER_STATUS: `${BASE_URL}/webhook/order-status`,
} as const;

export const API_CONFIG = {
  TIMEOUT: 10000, // 10 second timeout
  RETRY_ATTEMPTS: 2,
  POLL_INTERVAL: 5000, // Kitchen dashboard polls every 5 seconds
} as const;
