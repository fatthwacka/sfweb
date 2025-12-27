# File Renamer & Organizer Tools

Smart file management tools with local AI integration using Ollama.

## 🛠️ Project Structure

### Core Tools
- **`duplicate_finder.html`** - Find and remove duplicate files with AI-powered matching
- **`smart_organizer.html`** - Organize files into folders with intelligent suggestions

### AI Integration
- **Local Ollama Setup**: System-wide installation with `llama3.2:1b` model
- **API Endpoint**: `http://localhost:11434/v1/chat/completions`
- **Model Storage**: `~/.ollama/models/` (shared across tools)

## 🤖 AI-Enhanced Features

### Duplicate Finder
- **Basic Matching**: Identical filenames, exact name + different extension, fuzzy prefix matching
- **AI Matching**: Semantic analysis of filename patterns, content relationships
- **Smart Rules**: Special handling for ARW/XMP, PSD/JPG, MP3/WAV, MP4/MOV pairs

### Smart Organizer (Enhancement Needed)
- **Current**: Keyword-based folder matching with hardcoded rules
- **AI Enhancement Opportunity**: Dynamic folder name generation and content categorization

## 🔧 Setup Instructions

### Install Ollama
```bash
brew install ollama
brew services start ollama
ollama pull llama3.2:1b
```

### Test Setup
```bash
curl -X POST http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.2:1b", "messages": [{"role": "user", "content": "Hello"}], "max_tokens": 20}'
```

## 🎯 Usage Patterns

### Duplicate Finder
1. Open `duplicate_finder.html` in Chrome/Edge/Opera 86+
2. Select folder to scan
3. Enable "🤖 Use local AI for smarter matching" for semantic analysis
4. Review AI-detected matches (green badge: "🤖 AI DETECTED MATCH")
5. Use bulk controls to select recommended files for deletion

### Smart Organizer
1. Open `smart_organizer.html` in supported browser
2. Select source folder (files to organize)
3. Select target folder (existing organized structure)
4. Review file categorization suggestions
5. Bulk organize selected files

## 🚀 AI Enhancement Opportunities

### Immediate: Smart Organizer Folder Naming
**Problem**: When no existing folder matches file content, the system falls back to generic categorization
**Solution**: Use AI to generate meaningful folder names based on file content analysis

**Implementation**:
```javascript
async function suggestNewFolderName(keywords, filenames) {
    const prompt = `Based on these file characteristics, suggest a descriptive folder name:
Keywords: ${keywords.join(', ')}
Sample filenames: ${filenames.slice(0, 3).join(', ')}

Requirements:
- Short (1-2 words)
- Descriptive and specific
- Follows common folder naming conventions
- All caps preferred for consistency

Example responses: "VACATION PHOTOS", "WORK DOCUMENTS", "FAMILY VIDEOS"

Respond with only the folder name:`;
    
    // Call local Ollama API...
}
```

### Advanced: Content-Based Organization
- **Image Analysis**: Extract subjects, locations, events from image metadata/content
- **Document Classification**: Categorize by document type, purpose, project
- **Video Categorization**: Analyze duration, quality, content patterns

## 🧪 Testing Scenarios

### Duplicate Detection Test Cases
- **Sequential Photos**: `IMG_001.jpg`, `IMG_002.jpg` (should NOT match)
- **Version Files**: `document.pdf`, `document_v2.pdf` (should match)
- **Backup Patterns**: `file.txt`, `file_backup.txt` (should match)
- **Format Conversions**: `video.mov`, `video.mp4` (context dependent)

### Organization Test Cases
- **Project Files**: Mixed documents with project names
- **Photo Collections**: Event-based groupings
- **Work Documents**: By client, type, or date
- **Media Files**: By format, quality, or purpose

## 🔍 Performance Notes

### Model Selection
- **`llama3.2:1b`**: Fast, efficient for filename analysis (~1.3GB)
- **Alternative**: `qwen2.5:1.5b` for better accuracy if speed allows
- **Token Limits**: Keep prompts under 200 tokens for speed

### Browser Compatibility
- **Required**: Chrome 86+, Edge 86+, Opera 72+
- **Feature**: `window.showDirectoryPicker()` for folder access
- **Fallback**: None - displays compatibility error

## 🐛 Troubleshooting

### Ollama Issues
```bash
# Check service status
brew services list | grep ollama

# Restart if needed
brew services restart ollama

# Test API
curl http://localhost:11434/v1/models
```

### Browser Issues
- **CORS Errors**: Ollama runs on localhost, should work
- **File Access**: Requires user gesture (button click)
- **Large Files**: May timeout on Dropbox online-only files

## 🎨 UI Enhancement Ideas

### Duplicate Finder
- Add AI confidence scores to matches
- Show reasoning for AI decisions
- Batch AI analysis with progress bar

### Smart Organizer  
- Preview AI-suggested folder names before creation
- Show folder creation justification
- Smart batch operations with AI validation

## 📊 Success Metrics

### Accuracy
- **False Positives**: < 5% incorrect duplicate matches
- **Folder Suggestions**: > 80% user acceptance rate
- **Time Savings**: 50%+ reduction in manual organization

### Performance
- **AI Response Time**: < 2 seconds per file pair
- **Batch Processing**: Handle 1000+ files efficiently
- **Memory Usage**: Stay under 500MB browser limit