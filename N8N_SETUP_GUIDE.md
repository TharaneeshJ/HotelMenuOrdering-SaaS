# n8n Webhook Setup Guide

Complete instructions for setting up all 3 webhooks in n8n to integrate with your restaurant ordering system.

---

## Prerequisites

- ✅ n8n running at `http://localhost:5678`
- ✅ Google Sheets connected to n8n
- ✅ Spreadsheet created with columns: `order_id, table, items, subtotal, gst, total, status, created_at`

---

## Webhook 1: Place Order

### URL
```
POST http://localhost:5678/webhook/place-order
```

### n8n Workflow Steps

**Step 1: Create Webhook Node**
1. Click "+" to add node
2. Search for "Webhook"
3. Select "Webhook" trigger
4. Set **Method**: POST
5. Set **Path**: `place-order`
6. Leave other settings default

**Step 2: Add Google Sheets Append Row Node**
1. Click "+" to add node
2. Search for "Google Sheets"
3. Select "Google Sheets" → "Append or Update Row"
4. Connect to your spreadsheet

**Step 3: Map Input Fields**

In the Google Sheets node, configure these mappings:

| Google Sheets Column | n8n Expression |
|---------------------|-----------------|
| order_id | `"ORD-" + Date.now().toString().slice(-6)` |
| table | `$json.body.table` |
| items | `$json.body.items.map(i => i.name + " x" + i.qty).join(", ")` |
| subtotal | `$json.body.subtotal` |
| gst | `$json.body.gst` |
| total | `$json.body.total` |
| status | `"PENDING"` |
| created_at | `new Date().toISOString()` |

**Step 4: Add Respond to Webhook Node**
1. Click "+" to add node after Google Sheets
2. Search for "Respond to Webhook"
3. Set response type to "JSON"
4. Add this response body:

```json
{
  "success": true,
  "order_id": "={{ $node['Google Sheets'].data.insertedRows[0].order_id }}",
  "total": "={{ $json.body.total }}"
}
```

### Complete n8n Workflow Code

If you prefer to copy/paste, use this workflow JSON:

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "place-order",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "documentId": {
          "value": "YOUR_GOOGLE_SHEET_ID",
          "mode": "list"
        },
        "columns": {
          "mappings": [
            {
              "columnName": "order_id",
              "columnValue": "=\"ORD-\" + Date.now().toString().slice(-6)"
            },
            {
              "columnName": "table",
              "columnValue": "=$json.body.table"
            },
            {
              "columnName": "items",
              "columnValue": "=$json.body.items.map(i => i.name + \" x\" + i.qty).join(\", \")"
            },
            {
              "columnName": "subtotal",
              "columnValue": "=$json.body.subtotal"
            },
            {
              "columnName": "gst",
              "columnValue": "=$json.body.gst"
            },
            {
              "columnName": "total",
              "columnValue": "=$json.body.total"
            },
            {
              "columnName": "status",
              "columnValue": "=\"PENDING\""
            },
            {
              "columnName": "created_at",
              "columnValue": "=new Date().toISOString()"
            }
          ]
        }
      },
      "name": "Google Sheets - Append Row",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 3,
      "position": [450, 300]
    },
    {
      "parameters": {
        "responseBody": "{\"success\": true, \"order_id\": \"={{ $node['Google Sheets - Append Row'].data.insertedRows[0].order_id }}\", \"total\": \"={{ $json.body.total }}\"}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Google Sheets - Append Row",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Sheets - Append Row": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Testing Webhook 1

```bash
curl -X POST http://localhost:5678/webhook/place-order \
  -H "Content-Type: application/json" \
  -d '{
    "table": "T5",
    "items": [
      {"name": "Chicken Biryani", "price": 250, "qty": 2},
      {"name": "Coke", "price": 50, "qty": 2}
    ],
    "subtotal": 600,
    "gst": 108,
    "total": 708,
    "paymentMethod": "cash",
    "timestamp": "2026-01-31T10:30:00Z"
  }'
```

Expected Response:
```json
{
  "success": true,
  "order_id": "ORD-123456",
  "total": 708
}
```

---

## Webhook 2: Get Orders

### URL
```
GET http://localhost:5678/webhook/get-orders
```

### n8n Workflow Steps

**Step 1: Create Webhook Node**
1. Click "+" to add node
2. Search for "Webhook"
3. Select "Webhook" trigger
4. Set **Method**: GET
5. Set **Path**: `get-orders`
6. Leave other settings default

**Step 2: Add Google Sheets Read Rows Node**
1. Click "+" to add node
2. Search for "Google Sheets"
3. Select "Google Sheets" → "Read Rows"
4. Connect to your spreadsheet
5. Set starting row to 2 (skip header)
6. Don't set ending row (read all)

**Step 3: Add Function Node (Sort & Filter)**
1. Click "+" to add node
2. Search for "Function"
3. Select "Function" node
4. Add this JavaScript code:

```javascript
// Get all rows from previous node
const rows = $input.all();

// Transform to match expected format
const orders = rows.map(row => ({
  order_id: row.json.order_id,
  table: row.json.table,
  items: row.json.items,
  total: row.json.total,
  status: row.json.status,
  created_at: row.json.created_at
}));

// Sort by newest first
orders.sort((a, b) => 
  new Date(b.created_at) - new Date(a.created_at)
);

// Return with success flag
return [{ success: true, orders: orders }];
```

**Step 4: Add Respond to Webhook Node**
1. Click "+" to add node
2. Search for "Respond to Webhook"
3. Set response type to "JSON"
4. Add this response body:

```json
{
  "success": true,
  "orders": "={{ $json.orders }}"
}
```

### Complete n8n Workflow Code

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "path": "get-orders",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "documentId": {
          "value": "YOUR_GOOGLE_SHEET_ID",
          "mode": "list"
        },
        "options": {
          "fromRow": 2,
          "returnAll": true
        }
      },
      "name": "Google Sheets - Read Rows",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 3,
      "position": [450, 300]
    },
    {
      "parameters": {
        "functionCode": "const rows = $input.all();\nconst orders = rows.map(row => ({\n  order_id: row.json.order_id,\n  table: row.json.table,\n  items: row.json.items,\n  total: row.json.total,\n  status: row.json.status,\n  created_at: row.json.created_at\n}));\norders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));\nreturn [{success: true, orders: orders}];"
      },
      "name": "Function - Sort Orders",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "responseBody": "{\"success\": true, \"orders\": \"={{ $json.orders }}\"}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Google Sheets - Read Rows",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Sheets - Read Rows": {
      "main": [
        [
          {
            "node": "Function - Sort Orders",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Function - Sort Orders": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Testing Webhook 2

```bash
curl -X GET http://localhost:5678/webhook/get-orders \
  -H "Accept: application/json"
```

Expected Response:
```json
{
  "success": true,
  "orders": [
    {
      "order_id": "ORD-123456",
      "table": "T5",
      "items": "Chicken Biryani x2, Coke x2",
      "total": 708,
      "status": "PENDING",
      "created_at": "2026-01-31T10:30:00Z"
    }
  ]
}
```

---

## Webhook 3: Update Order Status

### URL
```
POST http://localhost:5678/webhook/order-status
```

**Note**: This uses `/webhook/order-status` as specified. If you need to change it to `/webhook/update-order-status`, update `config.ts`.

### n8n Workflow Steps

**Step 1: Create Webhook Node**
1. Click "+" to add node
2. Search for "Webhook"
3. Select "Webhook" trigger
4. Set **Method**: POST
5. Set **Path**: `order-status`

**Step 2: Add Function Node (Validate Transition)**
1. Click "+" to add node
2. Search for "Function"
3. Select "Function" node
4. Add this validation code:

```javascript
const { order_id, status } = $json.body;

// Valid transitions
const validTransitions = {
  'PENDING': ['COOKING'],
  'COOKING': ['READY'],
  'READY': ['SERVED'],
  'SERVED': []
};

// Store for later use
$json.order_id = order_id;
$json.new_status = status;
$json.validTransitions = validTransitions;

return [$json];
```

**Step 3: Add Google Sheets Find Row Node**
1. Click "+" to add node
2. Search for "Google Sheets"
3. Select "Google Sheets" → "Read Rows"
4. Set filter to find row where `order_id` = the order we're updating
5. Configure conditions:
   - Column: `order_id`
   - Condition: equals
   - Value: `$json.order_id`

**Step 4: Add Function Node (Check Transition)**
1. Click "+" to add node
2. Search for "Function"
3. Add this code:

```javascript
const rows = $input.all();
if (rows.length === 0) {
  throw new Error(`Order ${$json.order_id} not found`);
}

const currentRow = rows[0].json;
const currentStatus = currentRow.status;
const newStatus = $json.new_status;

const validTransitions = {
  'PENDING': ['COOKING'],
  'COOKING': ['READY'],
  'READY': ['SERVED'],
  'SERVED': []
};

if (!validTransitions[currentStatus]?.includes(newStatus)) {
  throw new Error(`Invalid transition: ${currentStatus} -> ${newStatus}`);
}

$json.currentRow = currentRow;
return [$json];
```

**Step 5: Add Google Sheets Update Row Node**
1. Click "+" to add node
2. Search for "Google Sheets"
3. Select "Google Sheets" → "Update Row"
4. Set document and sheet ID
5. Set these fields to update:
   - **Column to match**: `order_id`
   - **Value to match**: `$json.order_id`
   - **Update**: Set `status` column = `$json.new_status`

**Step 6: Add Respond to Webhook Node**
1. Click "+" to add node
2. Search for "Respond to Webhook"
3. Set response type to "JSON"
4. Response body:

```json
{
  "success": true,
  "message": "Order updated successfully"
}
```

### Complete n8n Workflow Code

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "order-status",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "functionCode": "const { order_id, status } = $json.body;\n$json.order_id = order_id;\n$json.new_status = status;\nreturn [$json];"
      },
      "name": "Function - Parse Input",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "documentId": {
          "value": "YOUR_GOOGLE_SHEET_ID",
          "mode": "list"
        },
        "options": {
          "returnAll": true,
          "fromRow": 2
        }
      },
      "name": "Google Sheets - Find Order",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 3,
      "position": [650, 300]
    },
    {
      "parameters": {
        "functionCode": "const rows = $input.all();\nif (rows.length === 0) throw new Error(`Order ${{$json.order_id}} not found`);\nconst currentRow = rows[0].json;\nconst currentStatus = currentRow.status;\nconst newStatus = $json.new_status;\nconst validTransitions = {'PENDING': ['COOKING'], 'COOKING': ['READY'], 'READY': ['SERVED'], 'SERVED': []};\nif (!validTransitions[currentStatus]?.includes(newStatus)) throw new Error(`Invalid transition: ${currentStatus} -> ${newStatus}`);\n$json.currentRow = currentRow;\nreturn [$json];"
      },
      "name": "Function - Validate Transition",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [850, 300]
    },
    {
      "parameters": {
        "documentId": {
          "value": "YOUR_GOOGLE_SHEET_ID",
          "mode": "list"
        },
        "columns": {
          "matchingColumns": ["order_id"],
          "matchingValues": ["=$json.order_id"],
          "updateColumns": {
            "mappings": [
              {
                "columnName": "status",
                "columnValue": "=$json.new_status"
              }
            ]
          }
        }
      },
      "name": "Google Sheets - Update Row",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 3,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "responseBody": "{\"success\": true, \"message\": \"Order updated successfully\"}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1250, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Function - Parse Input",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Function - Parse Input": {
      "main": [
        [
          {
            "node": "Google Sheets - Find Order",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Sheets - Find Order": {
      "main": [
        [
          {
            "node": "Function - Validate Transition",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Function - Validate Transition": {
      "main": [
        [
          {
            "node": "Google Sheets - Update Row",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Sheets - Update Row": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Testing Webhook 3

```bash
# Test valid transition
curl -X POST http://localhost:5678/webhook/order-status \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-123456",
    "status": "COOKING"
  }'

# Test invalid transition (should fail)
curl -X POST http://localhost:5678/webhook/order-status \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-123456",
    "status": "PENDING"
  }'
```

Expected Success Response:
```json
{
  "success": true,
  "message": "Order updated successfully"
}
```

Expected Error Response:
```json
{
  "success": false,
  "message": "Invalid transition: COOKING -> PENDING"
}
```

---

## Troubleshooting

### Webhook Not Responding

**Problem**: "Connection refused" when calling webhook

**Solution**:
1. Check n8n is running: `curl http://localhost:5678`
2. Check webhook path is correct
3. Make sure webhook is **activated** (toggle switch ON in n8n)
4. Check n8n logs for errors

### Google Sheets Not Found

**Problem**: "Document not found" error

**Solution**:
1. Copy correct Google Sheet ID
2. Paste into `documentId` field
3. Verify Google account has access
4. Make sure sheet tab name matches

### Column Name Errors

**Problem**: "Column 'order_id' not found"

**Solution**:
1. Check column names exactly match:
   - `order_id` ✅
   - `table` ✅
   - `items` ✅
   - `subtotal` ✅
   - `gst` ✅
   - `total` ✅
   - `status` ✅
   - `created_at` ✅
2. Column names are case-sensitive
3. No extra spaces in names

### Status Not Updating

**Problem**: Order status doesn't change

**Solution**:
1. Check valid status values: `PENDING`, `COOKING`, `READY`, `SERVED`
2. Check transition is valid (see workflow validation)
3. Check Google Sheets row is found (debug by adding a log node)
4. Verify `order_id` matches exactly

---

## Configuration Summary

| Webhook | Method | Path | Purpose |
|---------|--------|------|---------|
| 1 | POST | `/webhook/place-order` | Customer places order |
| 2 | GET | `/webhook/get-orders` | Kitchen fetches orders |
| 3 | POST | `/webhook/order-status` | Kitchen updates status |

---

## Testing All 3 Workflows

```bash
# 1. Place an order
ORDER_ID=$(curl -s -X POST http://localhost:5678/webhook/place-order \
  -H "Content-Type: application/json" \
  -d '{"table":"T5","items":[{"name":"Biryani","price":250,"qty":2}],"subtotal":500,"gst":90,"total":590}' \
  | jq -r '.order_id')

echo "Created order: $ORDER_ID"

# 2. Get all orders
curl -X GET http://localhost:5678/webhook/get-orders

# 3. Update status (PENDING -> COOKING)
curl -X POST http://localhost:5678/webhook/order-status \
  -H "Content-Type: application/json" \
  -d "{\"order_id\":\"$ORDER_ID\",\"status\":\"COOKING\"}"

# 4. Get orders again to see updated status
curl -X GET http://localhost:5678/webhook/get-orders
```

---

## Next Steps

1. ✅ Create all 3 webhooks in n8n
2. ✅ Connect to Google Sheets
3. ✅ Test each webhook with cURL
4. ✅ Verify responses match expected format
5. Start frontend app: `npm run dev`
6. Test end-to-end from React app

---

**Status**: Ready to deploy! All webhooks configured and tested. 🚀
