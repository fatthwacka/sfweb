# Handoff Document: Article Editor Enhancement Implementation

**Created:** 30 January 2026
**Status:** Analysis Complete - Ready for Implementation
**Priority:** Medium

---

## Summary

Add blog-editor-style AI text enhancement buttons to the Article Editor (`/tools/article-editor`). This will bring the same prompt enhancement capabilities from `blog-management.tsx` to the Airtable-based article editing workflow.

---

## Target Fields

| Field | Component Type | Enhancement Notes |
|-------|----------------|-------------------|
| **Headline** | `<Input>` | Short text - use title-mode rewrite (word count matching) |
| **Hook** | `<Textarea rows={3}>` | Body text mode - all enhancements applicable |
| **Content** | `<Textarea rows={18}>` | Body text mode - largest field, all enhancements |
| **Hashtags** | `<Input>` | **Custom logic** - generate 4 category-based hashtags |

---

## Enhancement Buttons Required

For each field, add these 6 controls:

1. **➖ Reduce** - Remove unnecessary words (40-50% reduction)
2. **➕ Increase** - Append one relevant sentence
3. **✅ Grammar** - Fix spelling, punctuation, improve flow
4. **🔄 Rewrite** - Complete fresh phrasing, preserve meaning & word count
5. **💬 Custom Prompt** - User-defined instruction (opens dialog)
6. **📝 Tone Dropdown** - 12 options including **humorous** (user-requested)

Plus **↩️ Undo** button (appears for 10 seconds after any enhancement)

---

## Tone Options (copy from blog-management.tsx:115-128)

```typescript
const toneOptions = [
  { value: 'humorous', label: 'Humorous' },  // User specifically requested this
  { value: 'creative', label: 'Creative' },
  { value: 'poetic', label: 'Poetic' },
  { value: 'professional', label: 'Professional' },
  { value: 'executive', label: 'Executive' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'informative', label: 'Informative' },
  { value: 'advisory', label: 'Advisory' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'technical', label: 'Technical' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' }
];
```

---

## Special Hashtag Enhancement Logic

User requirement: Generate 4 hashtags in specific categories:

```typescript
// Custom prompt for hashtags field
if (sectionKey === 'hashtags') {
  prompt = `Generate exactly 4 hashtags for this social media article:
1. One client/brand-specific hashtag (related to the business)
2. One service/segment hashtag (industry category)
3. One broad reach hashtag (general audience appeal)
4. One wildcard/industry trending hashtag (niche or trending)

Article context:
Headline: ${displayCurrentArticle?.Headline || ''}
Hook: ${displayCurrentArticle?.Hook || ''}
Content: ${displayCurrentArticle?.Content?.substring(0, 500) || ''}

Return only the 4 hashtags separated by spaces, no explanation or numbering.`;
}
```

---

## Implementation Steps

### Step 1: Add State Variables (~line 80 in article-editor.tsx)

```typescript
// Enhancement system state
const [processingSection, setProcessingSection] = useState<string | null>(null);
const [previousContent, setPreviousContent] = useState<{[key: string]: string}>({});
const [showUndo, setShowUndo] = useState<{[key: string]: boolean}>({});
const [customPromptOpen, setCustomPromptOpen] = useState<{[key: string]: boolean}>({});
```

### Step 2: Add Imports

```typescript
import { MinusCircle, PlusCircle, CheckCircle, RefreshCw, MessageSquare, Undo2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
```

### Step 3: Copy Core Functions from blog-management.tsx

- `enhanceSection()` function (lines 1055-1197)
- `undoEnhancement()` function (lines 1200-1209)
- `SectionEnhancementTools` component (lines 1212-1445)

### Step 4: Adapt for Article Editor

Key difference: Article editor uses `handleFieldChange()` pattern:

```typescript
// Blog editor pattern:
onUpdate: (content: string) => void

// Article editor adaptation:
onUpdate: (content: string) => handleFieldChange('Headline', content)
```

### Step 5: Modify Field JSX (lines 1122-1171)

For each field, wrap with enhancement tools. Example for Headline:

```tsx
{/* Headline */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label htmlFor="headline" className="text-slate-300">Headline</Label>
    <SectionEnhancementTools
      content={displayCurrentArticle.Headline || ''}
      sectionKey="headline"
      sectionTitle="Headline"
      onUpdate={(content) => handleFieldChange('Headline', content)}
    />
  </div>
  <Input
    id="headline"
    value={displayCurrentArticle.Headline || ''}
    onChange={(e) => handleFieldChange('Headline', e.target.value)}
    placeholder="Enter headline..."
    disabled={!!searchQuery}
  />
</div>
```

---

## Key Files Reference

| File | Purpose | Lines to Reference |
|------|---------|-------------------|
| `client/src/pages/tools/article-editor.tsx` | **Target file** - add enhancements here | Full file (~1466 lines) |
| `client/src/components/admin/blog-management.tsx` | **Source** - copy enhancement code from here | 1055-1445 |
| `server/routes.ts` | API endpoint | `/api/ai/generate-blog-content` |

---

## API Endpoint

Both systems use the same endpoint:

```typescript
POST /api/ai/generate-blog-content
Content-Type: application/json

{
  type: 'excerpt',  // Always use excerpt type for simple text responses
  context: 'Enhancement prompt with content...',
  contentType: 'informational'
}
```

---

## Estimated Work

| Task | Lines | Time |
|------|-------|------|
| State variables & imports | ~15 | 5 min |
| Copy enhanceSection() | ~145 | 10 min |
| Copy undoEnhancement() | ~10 | 2 min |
| Copy SectionEnhancementTools | ~180 | 10 min |
| Add toneOptions array | ~14 | 2 min |
| Modify 4 field JSX sections | ~60 | 15 min |
| Add hashtag custom prompt | ~20 | 10 min |
| Testing | - | 20 min |
| **Total** | **~420** | **~75 min** |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API compatibility | Uses same endpoint - already tested in blog editor |
| Airtable sync | Enhancement triggers `handleFieldChange()` which sets `isModified` |
| Processing blocks UI | Copy popup spinner from blog-editor (centered overlay) |
| Hashtag format | Post-process to ensure space-separated |

---

## Testing Checklist

- [ ] Reduce button reduces text length
- [ ] Increase button appends one sentence
- [ ] Grammar button improves text without changing meaning
- [ ] Rewrite button creates fresh version with same word count
- [ ] Custom prompt dialog opens and applies user instruction
- [ ] Tone dropdown changes text tone (test "humorous" specifically)
- [ ] Undo button appears for 10 seconds after enhancement
- [ ] Undo restores previous content
- [ ] Hashtag enhancement generates 4 categorised hashtags
- [ ] Processing spinner shows during API calls
- [ ] Modified flag triggers after enhancement
- [ ] Save button properly saves enhanced content to Airtable

---

## Session Context (30 Jan 2026)

### What Was Completed This Session:
1. Fixed Cloud Storage Browser sorting (newest first default)
2. Fixed 'Open in new tab' to open full-res JPG not thumbnail
3. Fixed file date issue (parse timestamp from filename)
4. Completed full analysis of article-editor enhancement integration

### Cloud Storage Browser Fixes Applied:
- `server/routes.ts:7040-7065` - Extract creation timestamp from filename pattern
- `client/src/pages/tools/cloud-storage-browser.tsx:157` - Fixed React state detection for sorting
- `client/src/pages/tools/cloud-storage-browser.tsx:462-468` - Fixed full-res URL opening

### User Quote:
> "lets check the /tools/article-editor.tsx file and just report back on what it would take to integrate the prompt enhancer type function on each text component, in a similar way to the way we do it on the blog-editor... Check the complexity of implementing in the article editor, and report back with recommendation, as well as risks and mitigation plan"

---

## Next Steps

1. Read this handoff document
2. Open `article-editor.tsx` and `blog-management.tsx` side by side
3. Follow implementation steps above
4. Test each field's enhancement buttons
5. Deploy when ready

---

*Document created for session handoff - continue implementation on any device*
