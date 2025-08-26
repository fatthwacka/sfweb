# Site Configuration API Methods - CRITICAL REFERENCE

## ⚠️ IMPORTANT: HTTP METHOD REQUIREMENTS

### Correct API Usage (REQUIRED)

**Always use PATCH method for site configuration updates:**

```typescript
// ✅ CORRECT - Use PATCH method
const response = await apiRequest('PATCH', '/api/site-config/bulk', {
  portfolio: {
    featured: settings
  }
});
```

```typescript
// ✅ CORRECT - Direct fetch with PATCH
const response = await fetch('/api/site-config/bulk', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates)
});
```

### ❌ NEVER USE POST METHOD

```typescript
// ❌ WRONG - DO NOT USE POST (will cause 405 Method Not Allowed)
const response = await apiRequest('POST', '/api/site-config/bulk', data);

// ❌ WRONG - DO NOT USE POST
const response = await fetch('/api/site-config/bulk', {
  method: 'POST', // This will fail
  body: JSON.stringify(data)
});
```

## API Endpoint Documentation

### GET /api/site-config
- **Purpose**: Retrieve current site configuration
- **Method**: GET
- **Cache Headers**: No-cache (always fresh data)
- **Response**: Complete merged configuration (defaults + overrides)

### PATCH /api/site-config/bulk  
- **Purpose**: Update site configuration (bulk update)
- **Method**: PATCH (REQUIRED)
- **Body**: Configuration updates (partial or complete)
- **Response**: Success confirmation with updated fields

### POST /api/upload
- **Purpose**: File upload for images
- **Method**: POST (correct for file uploads)
- **Body**: FormData with file
- **Response**: File path and metadata

## Implementation Examples

### Portfolio Settings Update
```typescript
const saveMutation = useMutation({
  mutationFn: (settings: any) => {
    return apiRequest('PATCH', '/api/site-config/bulk', {
      portfolio: {
        featured: settings
      }
    });
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    queryClient.refetchQueries({ queryKey: ['/api/site-config'] });
  }
});
```

### Hero Slides Update
```typescript
const updateHeroSlides = async (slides: HeroSlide[]) => {
  const response = await apiRequest('PATCH', '/api/site-config/bulk', {
    home: {
      hero: {
        slides: slides
      }
    }
  });
  return response;
};
```

### Contact Information Update
```typescript
const updateContactInfo = async (businessInfo: BusinessInfo) => {
  const response = await apiRequest('PATCH', '/api/site-config/bulk', {
    contact: {
      business: businessInfo
    }
  });
  return response;
};
```

## Server-Side Implementation

The server only accepts PATCH requests for bulk updates:

```typescript
// server/site-config-api.ts
router.patch('/api/site-config/bulk', async (req, res) => {
  try {
    const updates = req.body;
    
    // Merge with existing overrides
    const newOverrides = deepMerge(configOverrides, updates);
    
    // Save to disk atomically
    await saveConfigOverrides(newOverrides);
    
    // Update in-memory cache
    configOverrides = newOverrides;
    
    res.json({ 
      success: true, 
      message: 'Bulk update completed',
      updatedFields: Object.keys(updates)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update site configuration' });
  }
});
```

## Common Mistakes to Avoid

1. **Using POST instead of PATCH** - Server will return 405 Method Not Allowed
2. **Wrong endpoint path** - Use `/api/site-config/bulk` not `/api/site-config`
3. **Missing content-type header** - Always include `Content-Type: application/json`
4. **Not invalidating queries** - Always invalidate React Query cache after updates
5. **Incorrect request body structure** - Match the configuration hierarchy exactly

## Testing the API

```bash
# Test GET endpoint
curl -s http://localhost:3000/api/site-config | jq '.portfolio.featured'

# Test PATCH endpoint (correct method)
curl -X PATCH http://localhost:3000/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d '{"portfolio":{"featured":{"imageCount":6}}}' | jq

# Test POST endpoint (will fail with 405)
curl -X POST http://localhost:3000/api/site-config/bulk \
  -H "Content-Type: application/json" \
  -d '{"portfolio":{"featured":{"imageCount":6}}}' | jq
```

## Migration Notes

If you find any components using the old POST method:

1. **Identify the component** - Search for `POST.*site-config` or `POST.*bulk`
2. **Change method to PATCH** - Update all `apiRequest('POST', ...)` to `apiRequest('PATCH', ...)`
3. **Verify endpoint path** - Ensure using `/api/site-config/bulk`
4. **Test the update** - Confirm settings save and persist across refreshes
5. **Update documentation** - Remove any references to the old method

## References

- **Implementation**: `client/src/components/admin/page-settings/portfolio-settings.tsx`
- **Server Handler**: `server/site-config-api.ts`
- **Documentation**: `SITE_MANAGEMENT_ARCHITECTURE.md`
- **Fix History**: Fixed POST→PATCH method mismatch (August 2025)