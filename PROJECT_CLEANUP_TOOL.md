# Project Cleanup Tool Documentation

## Overview

The Project Cleanup Tool is an intelligent file management utility designed for photographers and digital artists to clean up RAW file workflows. It analyzes relationships between RAW files (CR2, NEF, ARW, etc.) and their exported counterparts (JPG, PSD) to help users safely delete unnecessary files while preserving important work.

## Core Features

### 🔍 **Intelligent RAW Analysis**
- Detects orphaned RAW files with no corresponding exports
- Identifies RAW files with Adobe Camera Raw AI enhancements (.ACR sidecars)
- Finds RAW files with Lightroom/Camera Raw settings (.XMP sidecars) 
- Matches RAW files to their exported JPG/PSD counterparts using flexible filename matching

### 📁 **Smart File Categorization**
- **AI Enhanced RAW**: Files with .ACR sidecars (Adobe Camera Raw AI features)
- **Lightroom Edited RAW**: Files with .XMP sidecars (Lightroom/Camera Raw settings)
- **RAW with Exports**: RAW files that have matching JPG/PSD exports
- **JPG/PSD Exports**: Export files that match RAW files (preserved by default)
- **Orphaned JPGs**: JPG files with no corresponding RAW file
- **System Junk**: .DS_Store, Thumbs.db, desktop.ini files

### 🎯 **Two-Level Selection Interface**

#### **Quick Selection (Purple Section)**
- **Summary Categories**: "With associated JPG" vs "Without associated JPG" for each RAW category
- **Folder Breakdown**: Individual folder selections when files span multiple directories
- **Indeterminate Checkboxes**: Visual minus sign shows partial selection states
- **Real-time Size Calculations**: Shows selected/total file sizes for informed decisions

#### **Detailed View (Dark Section)**
- **Individual File Control**: Check/uncheck specific files
- **File Metadata**: Shows file sizes, paths, and relationship information
- **Match Strength Indicators**: Highlights weak matches (files in different folders)
- **Preview Integration**: View supported image files before deletion

### 🛡️ **Safety Features**
- **Conservative Defaults**: Only orphaned RAW files selected by default
- **Relationship Preservation**: Exported JPG/PSD files unchecked by default
- **Weak Match Warnings**: Visual indicators for uncertain file relationships
- **Confirmation Dialogs**: Multi-step confirmation before permanent deletion
- **File Path Display**: Full paths shown for verification

## Technical Architecture

### **File System Access API Integration**
```typescript
interface FileSystemDirectoryHandle {
  name: string;
  kind: 'directory';
  values(): AsyncIterableIterator<FileSystemHandle>;
  // Modern browser API for secure file access
}
```

### **Smart Filename Matching**
```typescript
// Flexible matching algorithm handles:
// - Camera file naming (IMG_1234.CR2 → IMG_1234.JPG)
// - Sequential exports (_1, _2, _3 suffixes)
// - Cross-folder relationships
// - Case insensitive matching
const isFlexibleMatch = (rawName: string, exportName: string): boolean => {
  // Implementation handles common photographer workflows
}
```

### **Category System**
```typescript
interface CleanupCategory {
  id: string;
  title: string;
  description: string;
  icon: ReactElement;
  color: string;
  items: (JunkFile | OrphanedRAW | MatchedExport)[];
  subCategories?: SubCategory[];
  expanded: boolean;
}
```

### **Subcategory Organization**
- **Summary categories first**: Overall JPG association status
- **Folder categories after**: Per-folder breakdowns for multi-directory projects
- **Sorted display**: Ensures consistent, logical presentation

## User Interface Components

### **IndeterminateCheckbox Component**
```typescript
// Custom checkbox with three states:
// ☐ Unchecked (no items selected)
// ☑ Checked (all items selected)  
// ⊟ Indeterminate (some items selected)
const IndeterminateCheckbox = React.forwardRef<HTMLButtonElement, Props>
```

### **Progressive Enhancement UX**
1. **Scan Directory**: Analyze file relationships
2. **Review Categories**: Understand what will be deleted
3. **Refine Selection**: Use quick selection or detailed view
4. **Confirm Deletion**: Multi-step safety confirmation
5. **Execute**: Permanent file deletion with progress tracking

## Supported File Types

### **RAW Formats**
- **Canon**: .CR2, .CR3
- **Nikon**: .NEF, .NRW  
- **Sony**: .ARW, .SRF, .SR2
- **Adobe**: .DNG
- **Fuji**: .RAF
- **Olympus**: .ORF
- **Panasonic**: .RW2
- **Pentax**: .PEF
- **Samsung**: .SRW
- **Sigma**: .X3F

### **Sidecar Files**
- **.XMP**: Lightroom/Camera Raw settings
- **.ACR**: Adobe Camera Raw AI enhancements

### **Export Files**
- **.JPG/.JPEG**: Standard photo exports
- **.PSD**: Photoshop files
- **.TIFF**: High-quality exports
- **.PNG**: Web/graphic exports

### **System Junk**
- **.DS_Store**: macOS folder metadata
- **Thumbs.db**: Windows thumbnail cache
- **desktop.ini**: Windows folder settings

## Browser Compatibility

**Requires File System Access API support:**
- ✅ Chrome 86+
- ✅ Edge 86+  
- ✅ Opera 72+
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

**Graceful Fallback**: Shows browser compatibility warning with upgrade suggestions.

## Safety Considerations

### **Data Protection**
- **No Auto-Deletion**: Requires explicit user confirmation
- **Relationship Validation**: Verifies file relationships before suggesting deletion
- **Conservative Defaults**: Errs on the side of preservation
- **Progress Tracking**: Shows real-time deletion progress with error handling

### **User Education**
- **Clear Descriptions**: Each category explains what files are included
- **Visual Indicators**: Icons and colors indicate file types and safety levels
- **Size Information**: Shows storage impact of selections
- **Path Display**: Full file paths for user verification

## Performance Optimizations

### **Efficient File Scanning**
- **Parallel Processing**: Concurrent directory traversal
- **Smart Filtering**: Only processes relevant file types
- **Memory Management**: Processes large directories without memory issues
- **Progress Feedback**: Real-time scanning progress updates

### **UI Responsiveness**
- **Debounced Updates**: Prevents excessive re-renders during selections
- **Virtual Scrolling**: Handles thousands of files smoothly
- **Optimistic Updates**: Immediate UI feedback before backend processing
- **Background Processing**: Non-blocking file operations

## Use Cases

### **Photography Workflow Cleanup**
1. **Post-Shoot Organization**: Remove RAW files after JPG export
2. **Archive Preparation**: Clean up before long-term storage
3. **Disk Space Recovery**: Identify largest files for deletion
4. **Project Finalization**: Remove working files, keep deliverables

### **Client Project Management**
1. **Delivery Preparation**: Remove RAW files before client handoff
2. **Storage Optimization**: Keep only necessary files for ongoing projects
3. **Backup Strategy**: Identify which files need backup vs deletion
4. **Quality Control**: Verify all important shots have been exported

## Technical Implementation Notes

### **File Relationship Algorithm**
The tool uses sophisticated pattern matching to identify relationships between files:

```typescript
// Example relationships detected:
IMG_1234.CR2 ←→ IMG_1234.JPG        // Direct match
IMG_1234.CR2 ←→ IMG_1234_edited.JPG // Edit suffix
IMG_1234.CR2 ←→ IMG_1234_1.JPG      // Version number
IMG_1234.CR2 ←→ IMG_1234.PSD        // Different format
```

### **Memory Efficiency**
- Streams large directory structures
- Processes files in batches
- Releases memory for deleted files
- Uses efficient data structures for O(1) lookups

### **Error Handling**
- Graceful handling of permission errors
- Recovery from partial failures
- User-friendly error messages
- Rollback capabilities for interrupted operations

## Future Enhancements

### **Planned Features**
- [ ] **Undo Functionality**: Restore accidentally deleted files
- [ ] **Backup Integration**: Automatically backup before deletion
- [ ] **Custom Rules**: User-defined file relationship patterns
- [ ] **Batch Processing**: Process multiple directories simultaneously
- [ ] **Cloud Integration**: Support for cloud storage services

### **Performance Improvements**
- [ ] **Web Workers**: Background processing for large directories
- [ ] **Incremental Scanning**: Remember previous scan results
- [ ] **Smart Caching**: Cache file metadata between sessions
- [ ] **Progressive Loading**: Load large directories in chunks

---

*Last Updated: December 2025*
*Version: 1.0*
*Browser Support: Chrome/Edge/Opera 86+*