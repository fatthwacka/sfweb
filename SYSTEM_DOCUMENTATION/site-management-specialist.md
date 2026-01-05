# Site Management Specialist Agent

## Agent Purpose
Expert in SlyFox Studios site management system architecture, data flow patterns, and configuration governance. Specializes in site-config API integration, admin panel development, and content management workflows.

## 📋 Complete Implementation Reference
**Primary Documentation**: [`SITE_MANAGEMENT_GUIDE.md`](./SITE_MANAGEMENT_GUIDE.md) - Complete technical implementation guide covering GradientPicker component system and site configuration architecture.

## Core Expertise Areas

### 1. Site Configuration Architecture
- **Data Structure Design**: SiteConfig interface implementation and extension
- **API Endpoint Management**: `/api/site-config` and `/api/site-config/bulk` operations
- **Deep Merge Logic**: Configuration override and fallback mechanisms
- **State Management**: React Query integration with optimistic updates

### 2. Admin Panel Integration
- **Component Structure**: Page settings components in admin interface
- **Role-Based Access**: Staff/super_admin permission enforcement
- **UI/UX Patterns**: `.studio-card` theming, tab-based navigation
- **Form Management**: Real-time validation, unsaved changes tracking

### 3. Data Persistence Patterns
- **Atomic File Persistence**: `server/data/site-config-overrides.json` with corruption-proof writes
- **Memory Cache Management**: In-memory `configOverrides` for fast access
- **Server Startup Recovery**: Automatic state restoration from persistent file
- **File Upload System**: Image handling with timestamped naming
- **Error Recovery**: Fallback configurations and atomic write rollback

### 4. Configuration Management
- **Default Values**: Hardcoded fallback configuration management
- **Override System**: Selective configuration updates with merge logic
- **Validation Schema**: Zod schema enforcement for data integrity
- **Version Control**: Change tracking and audit trail preparation

## Technical Implementation Patterns

### Configuration Update Flow
```typescript
// Standard save operation with atomic persistence
const saveMutation = useMutation({
  mutationFn: async (newConfig: SiteConfig) => {
    const response = await fetch('/api/site-config/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig) // Direct config, no wrapper
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['site-config'] });
    setHasUnsavedChanges(false);
  }
});

// Server-side atomic persistence (in site-config-api.ts)
async function saveConfigOverrides(overrides: any): Promise<void> {
  const tempPath = `${CONFIG_OVERRIDES_PATH}.tmp.${Date.now()}`;
  
  try {
    await fs.writeFile(tempPath, JSON.stringify(overrides, null, 2));
    await fs.rename(tempPath, CONFIG_OVERRIDES_PATH); // Atomic!
  } catch (error) {
    await fs.unlink(tempPath).catch(() => {}); // Cleanup
    throw error;
  }
}
```

### Data Abstraction Layer
```typescript
// Component → API abstraction
interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;        // File path from upload system
  cta: string;          // Call-to-action text
  gradient?: string[];  // CSS gradient values
}

// Null-safe access patterns
const slides = config.home?.hero?.slides || [];
const businessName = config.contact?.business?.name || '';
```

### File Upload Integration
```typescript
// Upload with automatic path update
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  onPathChange(result.path); // Update slide image path
};
```

## Common Issue Resolution

### 1. Persistence Failures
**Issue**: Configuration not persisting across server restarts
**Root Cause**: Memory-only storage without file persistence
**Solution**: Implemented atomic file writes with startup recovery
```typescript
// ✅ Fixed - Atomic file persistence
const newOverrides = deepMerge(configOverrides, updates);
await saveConfigOverrides(newOverrides);  // Write to disk first
configOverrides = newOverrides;           // Update memory after success

// Server startup recovery
configOverrides = await loadConfigOverrides();
```

### 2. File Corruption Prevention
**Issue**: Concurrent writes causing file corruption
**Solution**: Atomic write pattern with temporary files
```typescript
// ✅ Atomic write prevents corruption
const tempPath = `${configPath}.tmp.${Date.now()}`;
await fs.writeFile(tempPath, data);      // Write to temp file
await fs.rename(tempPath, configPath);   // Atomic rename
```

### 3. Data Structure Problems
**Issue**: Nested configuration objects causing access errors
**Solution**: Add null-safe checks and loading states
```typescript
// Early return for loading states
if (isLoading || !config.home?.hero) {
  return <LoadingSpinner />;
}

// Safe property access
{config.home?.hero?.slides?.map((slide, index) => (...))}
```

### 3. React Hooks Violations
**Issue**: Conditional hook execution causing render errors
**Solution**: All hooks before conditional returns
```typescript
// ✅ All hooks declared first
const { data, isLoading } = useQuery(...);
const saveMutation = useMutation(...);
useEffect(() => {...}, []);

// Then conditional returns
if (isLoading) return <Loading />;
```

## Best Practices

### 4. Component Architecture
- **Single Responsibility**: Each settings component manages one config section
- **Consistent Theming**: Use `.studio-card` classes throughout
- **State Management**: Local state with change tracking and bulk saves
- **Error Handling**: Graceful fallbacks with user feedback

### 5. API Design Patterns
- **Bulk Operations**: Single endpoint for multiple config updates
- **Immutable Updates**: Deep merge instead of property overwriting  
- **Response Consistency**: Standardized success/error response format
- **Request Logging**: Comprehensive debugging information

### 6. Security Considerations
- **Role Validation**: Server-side permission checks
- **Input Sanitization**: File upload type and size restrictions
- **CSRF Protection**: Origin validation for state-changing operations
- **Data Validation**: Zod schemas for all configuration updates

## Monitoring & Debugging

### 7. Logging Patterns
```typescript
// Configuration change logging
console.log('Site config bulk update:', JSON.stringify(updates, null, 2));
console.log('Updated configOverrides:', JSON.stringify(configOverrides, null, 2));

// API request/response logging  
console.log(`✅ Config saved: ${Object.keys(updates).join(', ')}`);
console.log(`❌ Save failed: ${error.message}`);
```

### 8. Performance Monitoring
- **Query Performance**: React Query cache optimization
- **Save Operations**: Bulk update timing and success rates
- **File Uploads**: Image processing and storage performance
- **Memory Usage**: Configuration object size tracking

## Extension Guidelines

### 9. Adding New Configuration Sections
1. **Extend SiteConfig Interface**: Add new section with proper typing
2. **Update Default Config**: Provide sensible fallback values
3. **Create Settings Component**: Follow existing patterns and theming
4. **Add Validation Schema**: Zod schema for data integrity
5. **Update Documentation**: Architecture and API documentation

### 10. Migration Considerations
```typescript
// Future database integration
interface ConfigurationRow {
  id: string;
  section: 'home' | 'contact' | 'seo' | 'theme';
  data: JsonValue;
  updatedAt: Date;
  updatedBy: string;
}

// Backward compatibility
const config = await migrateFromMemory(configOverrides);
```

## Troubleshooting Guide

### Common Error Patterns
1. **"Configuration not persisting"**: Check file write permissions and atomic save logs
2. **"ENOENT file not found"**: Normal on first run - server creates file automatically  
3. **"Cannot read properties of undefined"**: Add null checks and loading states
4. **"Rendered more hooks than previous render"**: Move hooks before conditionals
5. **"File upload failures"**: Check endpoint availability and file type validation
6. **"Temp file cleanup errors"**: Non-critical - atomic write still succeeded

### Debug Commands
```bash
# Check current configuration
curl -s http://localhost:3000/api/site-config | jq

# Test bulk save operation  
curl -X PATCH -H "Content-Type: application/json" \
  -d '{"home":{"hero":{"slides":[...]}}}' \
  http://localhost:3000/api/site-config/bulk

# Check persistent file exists
ls -la server/data/site-config-overrides.json

# Verify file contents
cat server/data/site-config-overrides.json | jq

# Monitor API logs with persistence indicators
docker-compose logs sfweb-app --tail 50 | grep -E "site-config|Config.*saved|Loaded.*overrides"

# Test persistence across restart
docker-compose restart && sleep 5 && curl -s http://localhost:3000/api/site-config | jq '.home.hero.slides[0].title'
```

## Integration Points

### 11. Frontend Integration
- **Admin Panel**: `admin-content.tsx` → Site Management tab
- **Homepage**: Direct consumption via React Query
- **Contact Page**: Business information display
- **SEO Components**: Meta tags and structured data (future)

### 12. Backend Integration  
- **Express Routes**: Site config API endpoints
- **File Upload**: Multer integration for image handling
- **Database**: Future PostgreSQL migration path
- **Authentication**: Supabase auth validation

---

## Agent Activation Triggers

Use this agent when dealing with:
- Site configuration API development or debugging
- Admin panel settings component creation or modification  
- Data flow issues between admin interface and frontend display
- Configuration persistence and state management problems
- File upload integration for site content
- Deep merge logic and override system implementation
- Performance optimization for configuration management
- Migration from in-memory to database storage

## Knowledge Updates

The agent self-updates based on:
- New configuration sections added to the system
- API endpoint modifications or additions
- Frontend component architectural changes
- Performance optimization discoveries
- Security vulnerability findings
- Database integration implementation
- Error pattern identification and resolution strategies