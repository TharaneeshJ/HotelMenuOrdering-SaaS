# Webhook Integration Guide

This document describes how the application connects to the webhook for order placement.

## Environment Configuration

The following environment variables control the webhook endpoints:

### `.env.local`

```dotenv
# Webhook endpoint for order placement
VITE_WEBHOOK_URL=http://localhost:5678/webhook/place-order

# Stripe Checkout Session (for card payments)
VITE_STRIPE_ENDPOINT=http://localhost:3001/create-checkout-session
```

## Webhook Request Format

When a user places an order, the app sends a POST request to `VITE_WEBHOOK_URL` with the following structure:

### Request Body

```json
{
  "table": "T1",
  "items": [
    {
      "name": "Vanilla",
      "price": 75,
      "qty": 2,
      "total": 150
    }
  ],
  "subtotal": 150,
  "gst": 8,
  "total": 158,
  "paymentMethod": "cash",
  "timestamp": "2026-01-31T10:30:00.000Z"
}
```

### Request Headers

```
Content-Type: application/json
Accept: application/json
```

## Expected Webhook Response

Your webhook endpoint should return a JSON response with the following structure:

```json
{
  "success": true,
  "order_id": "ORD-123456"
}
```

### Response Fields

- `success` (boolean, required): Indicates if the order was placed successfully
- `order_id` (string, required): Unique identifier for the placed order

## Error Handling

The application includes intelligent error handling:

1. **Webhook Reachable**: Order is sent to the webhook and response is validated
2. **Webhook Unreachable**: Falls back to mock/demo mode automatically
3. **Timeout**: If the request takes longer than 10 seconds, it uses mock data
4. **Invalid Response**: If webhook returns incomplete data, falls back to mock mode

All actions are logged to the browser console with `[Order Service]` prefix for debugging.

## Setup Instructions

### For Local Development

1. Start your backend webhook server on port 5678:
   ```bash
   node server.js  # or your startup command
   ```

2. The webhook endpoint should be:
   ```
   POST http://localhost:5678/webhook/place-order
   ```

3. Start the app:
   ```bash
   npm run dev
   ```

### For Production

Update `.env.local` with your production webhook URL:

```dotenv
VITE_WEBHOOK_URL=https://your-api.com/webhook/place-order
VITE_STRIPE_ENDPOINT=https://your-api.com/create-checkout-session
```

## Testing

To test the webhook connection:

1. Open the browser's DevTools (F12)
2. Go to the Console tab
3. Place an order in the app
4. Look for `[Order Service]` logs showing:
   - Webhook URL being called
   - Request body being sent
   - Response received
   - Success or fallback status

## Example Backend (Node.js/Express)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook/place-order', (req, res) => {
  const { table, items, subtotal, gst, total, paymentMethod } = req.body;
  
  console.log('Order received:', { table, items, total, paymentMethod });
  
  // Process the order (save to database, send to kitchen, etc.)
  
  res.json({
    success: true,
    order_id: `ORD-${Date.now()}`
  });
});

app.listen(5678, () => {
  console.log('Webhook server running on port 5678');
});
```

## Debugging

If orders are failing:

1. Check if your webhook server is running
2. Verify the webhook URL is correct in `.env.local`
3. Check browser console for error messages
4. Ensure your webhook returns the correct JSON response format
5. Check network tab in DevTools to see the actual request/response

The app will automatically fall back to demo mode if the webhook is unavailable, so you can always test the UI without a backend.
