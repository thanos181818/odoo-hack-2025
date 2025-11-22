# Stock Oracle API Documentation

Complete API reference for frontend integration.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require JWT authentication via Bearer token.

```http
Authorization: Bearer <your-jwt-token>
```

### Getting JWT Token

**Note**: You'll need to implement a login endpoint. Example user:
- Email: `admin@stockmaster.com`
- Password: `password123` (from seed data)

## Endpoints

### 1. Chat with Agent

Main endpoint for interacting with Stock Oracle.

```http
POST /chat
```

**Request Body:**

```json
{
  "message": "string (required, 1-1000 chars)",
  "conversationId": "string (optional, uuid)",
  "context": "object (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "response": "string (agent's response)",
    "conversationId": "uuid",
    "requiresConfirmation": false,
    "metadata": {
      "toolsCalled": ["tool_name"],
      "executionTime": 1234
    }
  }
}
```

**Example Requests:**

```bash
# Simple query
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me low stock items"
  }'

# With conversation context
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create receipt for those items",
    "conversationId": "existing-uuid-from-previous-chat"
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "response": "⚠️ Low stock items:\n- Steel Rods @ Production Floor: 42/200 kg (need 158 more)\n\nWould you like me to create a receipt?",
    "conversationId": "550e8400-e29b-41d4-a716-446655440000",
    "requiresConfirmation": false,
    "metadata": {
      "toolsCalled": ["get_low_stock"],
      "executionTime": 1250
    }
  }
}
```

### 2. Execute Operation

Execute a draft operation after user approval.

```http
POST /chat/execute
```

**Request Body:**

```json
{
  "operationId": "uuid (required)",
  "approved": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "✅ Operation REC-1234567890 completed successfully!\nStock levels have been updated."
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/chat/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operationId": "550e8400-e29b-41d4-a716-446655440000",
    "approved": true
  }'
```

### 3. Get Conversation History

Retrieve past conversations for the current user.

```http
GET /chat/history?limit=10
```

**Query Parameters:**
- `limit` (optional, default: 10): Number of conversations to return

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "messages": [...],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:05:00.000Z"
    }
  ]
}
```

### 4. Health Check

Check if the server is running.

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Listen for events
socket.on('stock_updated', (data) => {
  console.log('Stock updated:', data);
});

socket.on('operation_completed', (data) => {
  console.log('Operation completed:', data);
});
```

**Events:**
- `stock_updated` - When stock levels change
- `operation_completed` - When an operation is executed
- `alert_triggered` - When system detects issues

## Query Examples

### Stock Queries

```json
{
  "message": "How much Steel is in Production Floor?"
}

{
  "message": "Show me all products in Main Warehouse"
}

{
  "message": "List all items below reorder level"
}

{
  "message": "What's my total inventory value?"
}
```

### Operations

```json
{
  "message": "Create receipt for 200 kg Steel from Reliable Steels"
}

{
  "message": "Deliver 50 chairs to Customer ABC"
}

{
  "message": "Move 100 cement bags from Main Warehouse to Production Floor"
}

{
  "message": "Adjust Steel in Production to 150 kg - physical count"
}
```

### History & Audit

```json
{
  "message": "Show me pending operations"
}

{
  "message": "What was received from Vendor XYZ last month?"
}

{
  "message": "Who adjusted inventory in Production last week?"
}

{
  "message": "Show me details of operation REC-1234567890"
}
```

### Complex Queries

```json
{
  "message": "We need 300 chairs ready by tomorrow morning"
}

{
  "message": "Steel is running low in Production and we have a big order at 10 AM"
}

{
  "message": "Run cycle count on all products in Warehouse 2"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

**Common Status Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- **Window**: 60 seconds
- **Max Requests**: 100 per window
- **Scope**: Per IP address

When rate limit is exceeded:

```json
{
  "error": "Too many requests from this IP",
  "statusCode": 429
}
```

## Frontend Integration Example

### React Hook

```typescript
import { useState } from 'react';

export function useStockOracle() {
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();

  const chat = async (message: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message, 
          conversationId 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setConversationId(data.data.conversationId);
        return data.data;
      }
      
      throw new Error(data.error);
    } finally {
      setLoading(false);
    }
  };

  const executeOperation = async (operationId: string) => {
    const response = await fetch('http://localhost:3000/api/chat/execute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operationId, 
        approved: true 
      }),
    });

    return response.json();
  };

  return { chat, executeOperation, loading };
}
```

### Usage in Component

```typescript
function ChatInterface() {
  const { chat, loading } = useStockOracle();
  const [messages, setMessages] = useState([]);

  const handleSend = async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    const response = await chat(message);
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: response.response,
      requiresConfirmation: response.requiresConfirmation
    }]);
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.content}</div>
      ))}
      {loading && <div>Thinking...</div>}
    </div>
  );
}
```

## Best Practices

1. **Store conversationId**: Keep it in state for context continuity
2. **Handle errors**: Always wrap API calls in try-catch
3. **Show loading states**: API calls can take 1-3 seconds
4. **Parse operation IDs**: Extract from response text when `requiresConfirmation: true`
5. **Use WebSockets**: For real-time dashboard updates
6. **Implement retry logic**: For network failures
7. **Cache responses**: For repeated queries

## Testing Tools

### Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "Stock Oracle API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "token",
      "value": "your-jwt-token"
    }
  ]
}
```

### cURL Examples

See example requests above in each endpoint section.

## Support

For issues or questions:
- Check server logs: `tail -f logs/combined.log`
- Enable debug mode: `NODE_ENV=development`
- Review troubleshooting guide in README.md