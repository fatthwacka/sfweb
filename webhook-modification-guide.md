# n8n Workflow Modification Guide: Replace Manual Trigger with Webhook

## Target Workflow
- **Name**: Rip page and make content (Gemini)
- **ID**: `aZ45BRkUzOn6js0h`
- **Status**: Currently Active

## Required Changes

### 1. Remove Manual Trigger Node
The first node in the workflow (Manual Trigger) needs to be deleted. This node currently has a popup form that collects the URL input.

### 2. Add Webhook Node Configuration

**New First Node**: Webhook
- **Node Type**: Webhook
- **HTTP Method**: POST
- **Path**: `/webhook/rip-content` (or custom path)
- **Authentication**: None (or Bearer token if needed)
- **Response Mode**: 'Response Immediately'

**Webhook Settings:**
```json
{
  "httpMethod": "POST",
  "path": "rip-content",
  "responseMode": "responseImmediate",
  "options": {}
}
```

### 3. Expected JSON Payload Structure
The webhook should accept a POST request with this JSON structure:
```json
{
  "url": "https://example.com/page-to-scrape"
}
```

### 4. Output Data Mapping
The webhook node should output the received data in a format that matches what the next node expects. The URL should be accessible as:
- `{{ $json.url }}` - for the URL value

### 5. Connection Preservation
Ensure the webhook node connects to the same second node that the Manual Trigger was connected to (likely "Extract Content & Images" or similar).

## Implementation Steps

### Via n8n Web Interface (Manual Method):
1. **Access n8n**: Navigate to http://168.231.86.89:5678
2. **Open Workflow**: Find and edit workflow `aZ45BRkUzOn6js0h`
3. **Delete Manual Trigger**: Select the first node and delete it
4. **Add Webhook Node**:
   - Click "+" to add new node
   - Search for "Webhook"
   - Select "Webhook" trigger node
5. **Configure Webhook**:
   - Set HTTP Method to POST
   - Set Path to `rip-content`
   - Set Response Mode to "Response Immediately"
6. **Connect Nodes**: Connect the webhook output to the second node in the workflow
7. **Save & Activate**: Save the workflow and ensure it remains active

### Via n8n API (Programmatic Method):
```bash
# Get current workflow structure
curl -X GET "http://168.231.86.89:5678/api/v1/workflows/aZ45BRkUzOn6js0h" \
  -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Update workflow with new webhook configuration
# (Requires full workflow JSON with webhook node replacing manual trigger)
```

## Testing the Modified Workflow

### Test Webhook Endpoint:
```bash
# Test the webhook after modification
curl -X POST "http://168.231.86.89:5678/webhook/rip-content" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Integration with Slyfox Frontend:
```typescript
// Frontend integration for triggering the workflow
const triggerWorkflow = async (url: string) => {
  const response = await fetch('http://168.231.86.89:5678/webhook/rip-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url })
  });
  
  return response.json();
};
```

## Expected Workflow Structure After Modification

```
Webhook (POST /webhook/rip-content)
    ↓ (receives: {url: "..."})
Extract Content & Images
    ↓
[Rest of existing workflow...]
    ↓
Generate Content with Gemini
    ↓
[Final output/response]
```

## Verification Checklist

- [ ] Manual Trigger node removed
- [ ] Webhook node added as first node
- [ ] Webhook configured for POST method
- [ ] JSON payload structure accepts "url" field
- [ ] Connections preserved to next node
- [ ] Workflow remains active
- [ ] Test webhook responds successfully
- [ ] URL data passes correctly to content extraction

## Webhook URL for Frontend Integration

After modification, the workflow will be accessible at:
```
POST http://168.231.86.89:5678/webhook/rip-content
Content-Type: application/json
Body: {"url": "https://target-website.com"}
```

This allows programmatic execution from the Slyfox frontend while maintaining all existing AI content generation functionality.