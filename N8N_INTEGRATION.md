# n8n Integration with Claude Code & Slyfox

**Complete documentation for n8n MCP server integration with workflow development capabilities.**

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Claude Code   │    │   n8n MCP    │    │  n8n Instance   │
│    (Local)      │◄──►│   Server     │◄──►│  (VPS:5678)     │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────┐                       ┌─────────────────┐
│ Slyfox Website  │                       │   32 Workflows  │
│ • Mini Apps     │◄─────Webhooks/API────►│ • Active: 4     │
│ • Real-time UI  │                       │ • Available: 28 │
└─────────────────┘                       └─────────────────┘
```

## 🔧 Configuration Details

### **n8n Instance**
- **Host**: http://168.231.86.89:5678
- **Location**: VPS root directory (same server as Slyfox)
- **API Version**: v1
- **Authentication**: JWT token-based API key

### **MCP Server Configuration**
Location: `/Users/daddapiggy/.claude/mcp_servers.json`

```json
{
  "n8n-workflow": {
    "command": "npx",
    "args": ["-y", "n8n-mcp"],
    "env": {
      "N8N_HOST": "http://168.231.86.89:5678",
      "N8N_API_KEY": "your_n8n_jwt_token_here"
    }
  }
}
```

## 🎯 Current Workflow Inventory

### **Active Workflows (4)**
| ID | Name | Purpose | Status |
|----|------|---------|--------|
| `8Y3nTmukhG1nQJdD` | Keep Supabase Alive | Database maintenance | ✅ Active |
| `aDuULlLJYKHw12o3` | META inbox (webhook) | Social media automation | ✅ Active |
| `aZ45BRkUzOn6js0h` | Rip page and make content (Gemini) | AI content generation | ✅ Active |
| `zM03BrB1zl2ynNi3` | DCS - post to Facebook | Social media posting | ✅ Active |

### **Key Available Workflows (28)**
| ID | Name | Purpose | Mini-App Potential |
|----|------|---------|-------------------|
| `VqlWfaH28rOy84x0` | Veo 3 Video Generator | AI video creation | 🎥 High |
| `4eAEEuHw7u2XJYDP` | Tavily and ElevenLabs | Research + voice AI | 🔊 High |
| `k6qtAyr3FOX8CIej` | Google Maps Scraper | Local business data | 🗺️ High |
| `TG9oJx66C2uF96CB` | Create articles not repetitive | AI article generation | 📝 High |
| `1BctSy0IvRiltnkK` | Whatsapp response | Messaging automation | 💬 Medium |
| `ZlmsEnvZjDzSyCX1` | META Auto Responder | Customer service | 🤖 Medium |
| `5ZZxNtNzg3Fxqxuf` | Rip page and make content | Web scraping + content | 🕷️ Medium |

## 🛠️ Development Capabilities

### **Workflow Creation**
- **From scratch**: Build complete workflows with visual node editor
- **Template system**: Copy and modify existing workflows
- **Node library**: Access to 543+ n8n nodes including:
  - **AI nodes**: OpenAI, Anthropic, Google AI, local LLMs
  - **Data nodes**: HTTP requests, databases, file operations
  - **Communication**: Email, SMS, WhatsApp, social media
  - **Logic nodes**: Conditional routing, data transformation
  - **Integration**: APIs, webhooks, scheduled triggers

### **Workflow Editing**
- **Visual editor**: Drag-and-drop node configuration
- **Parameter management**: Detailed node settings and connections
- **Data flow**: Configure input/output between nodes
- **Error handling**: Add retry logic and fallback mechanisms
- **Testing**: Execute workflows with sample data

### **Debugging & Monitoring**
- **Execution history**: View all workflow runs with timestamps
- **Error analysis**: Detailed logs for failed executions
- **Performance metrics**: Runtime, memory usage, success rates
- **Real-time monitoring**: Live execution status and progress

## 🎨 Slyfox Mini-Apps Integration Strategy

### **Frontend Implementation**
```typescript
// Mini-app card component
interface MiniApp {
  id: string;
  name: string;
  description: string;
  workflowId: string;
  icon: string;
  category: 'ai' | 'automation' | 'content' | 'research';
}

// Trigger workflow from Slyfox
const executeWorkflow = async (workflowId: string, parameters: any) => {
  const response = await fetch(`/api/n8n/execute/${workflowId}`, {
    method: 'POST',
    body: JSON.stringify(parameters)
  });
  return response.json();
};
```

### **Backend API Layer**
```typescript
// Express endpoint for workflow execution
app.post('/api/n8n/execute/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const parameters = req.body;
  
  // Trigger n8n workflow via API
  const result = await fetch(`http://168.231.86.89:5678/api/v1/workflows/${workflowId}/execute`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parameters)
  });
  
  res.json(await result.json());
});
```

### **Real-time Updates**
- **Webhook endpoints**: n8n workflows can post progress updates back to Slyfox
- **WebSocket integration**: Real-time status updates in the Slyfox UI
- **Progress indicators**: Visual feedback during workflow execution
- **Result handling**: Display generated content, files, or data

## 🎯 Proposed Mini-Apps

### **1. 🎥 AI Video Generator**
- **Workflow**: `VqlWfaH28rOy84x0` (Veo 3 Video Generator)
- **Input**: Topic, style, duration preferences
- **Process**: AI video generation with Veo 3 model
- **Output**: Generated video file with download link
- **Integration**: Embedded video player in Slyfox

### **2. 📝 Smart Article Writer**
- **Workflow**: `TG9oJx66C2uF96CB` (Create articles not repetitive)
- **Input**: Topic, target audience, word count, tone
- **Process**: AI research + content generation + SEO optimisation
- **Output**: Formatted article with metadata
- **Integration**: Direct publish to Slyfox blog system

### **3. 🗺️ Local Business Intelligence**
- **Workflow**: `k6qtAyr3FOX8CIej` (Google Maps Scraper)
- **Input**: Location, business type, radius
- **Process**: Scrape competitor data, analyse market
- **Output**: Business insights, competitor analysis
- **Integration**: Interactive dashboard with maps and charts

### **4. 🔊 Podcast Content Generator**
- **Workflow**: `4eAEEuHw7u2XJYDP` (Tavily and ElevenLabs)
- **Input**: Topic, voice style, script length
- **Process**: Research topic + generate script + create audio
- **Output**: Podcast episode with transcript
- **Integration**: Audio player with chapter markers

### **5. 💬 Client Communication Assistant**
- **Workflow**: `ZlmsEnvZjDzSyCX1` (META Auto Responder)
- **Input**: Client inquiry, context, desired tone
- **Process**: Analyse inquiry + generate professional response
- **Output**: Suggested responses with customisation options
- **Integration**: Direct send or copy-to-clipboard

## 🔄 Development Workflow

### **Creating New Workflows**
1. **Design in Claude Code**: Plan workflow logic and node requirements
2. **Build via MCP**: Create nodes and connections programmatically
3. **Test execution**: Run with sample data to verify functionality
4. **Deploy to production**: Activate workflow for live use
5. **Integrate with Slyfox**: Create mini-app interface and API endpoints

### **Modifying Existing Workflows**
1. **Analyse current structure**: Review nodes and data flow
2. **Identify improvements**: Optimise performance or add features
3. **Update configuration**: Modify node parameters and connections
4. **Test changes**: Verify modifications work correctly
5. **Deploy updates**: Activate enhanced workflow version

### **Debugging Process**
1. **Monitor execution**: Check workflow run logs and status
2. **Identify failures**: Locate failing nodes and error messages
3. **Fix issues**: Update node configuration or logic
4. **Validate fixes**: Test with various input scenarios
5. **Document solutions**: Update workflow documentation

## 🚀 Getting Started

### **Prerequisites**
- n8n MCP server configured in Claude Code
- n8n API key with workflow management permissions
- Slyfox development environment running

### **First Steps**
1. **Restart Claude Code** to load n8n MCP server
2. **Test connection**: `"Show me all my n8n workflows"`
3. **Explore workflow**: `"Show me the structure of my video generator workflow"`
4. **Create test workflow**: `"Build a simple email notification workflow for Slyfox"`
5. **Build first mini-app**: Choose one workflow to integrate into Slyfox

### **Development Commands**
```bash
# Claude Code commands (after MCP activation)
"List all my n8n workflows"
"Show me the details of workflow [ID]"
"Create a new workflow for [purpose]"
"Modify the [workflow name] to add [feature]"
"Test workflow [ID] with this data: {sample}"
"Debug the last execution of [workflow name]"
"Activate/deactivate workflow [ID]"
```

## 🔒 Security & Best Practices

### **API Security**
- **Token expiration**: API key expires 2025-01-31 (monitor and renew)
- **Network access**: n8n instance accessible only via VPS network
- **Authentication**: All API calls require valid JWT token
- **Rate limiting**: Monitor API usage to prevent abuse

### **Workflow Security**
- **Input validation**: Sanitise all user inputs before workflow execution
- **Error handling**: Implement proper error catching and user feedback
- **Resource limits**: Set timeouts and memory limits for long-running workflows
- **Data privacy**: Ensure sensitive data is handled securely in workflows

### **Development Guidelines**
- **Version control**: Document all workflow changes and versions
- **Testing**: Always test workflows in development before production deployment
- **Monitoring**: Set up alerts for workflow failures and performance issues
- **Backup**: Regular exports of critical workflows for disaster recovery

## 🎯 Future Enhancements

### **Planned Features**
- **Workflow versioning**: Track changes and enable rollbacks
- **Template library**: Reusable workflow components for common tasks
- **Analytics dashboard**: Monitor mini-app usage and workflow performance
- **User permissions**: Role-based access to different workflows and features
- **Automated deployment**: CI/CD pipeline for workflow updates

### **Integration Opportunities**
- **Slyfox blog system**: Auto-generate and publish blog posts
- **Client portal**: Automated client communication and project updates
- **Quote generation**: Dynamic pricing and proposal creation
- **Image processing**: Automated photo editing and optimisation workflows
- **Social media**: Scheduled posting and engagement automation

---

**Setup Date**: December 26, 2025  
**API Key Expiry**: January 31, 2025  
**Last Updated**: Initial configuration and documentation