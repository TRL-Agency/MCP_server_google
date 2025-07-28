# Google Services MCP Server

A Model Context Protocol (MCP) server that provides integration with Google Drive, Sheets, Slides, Docs, and Forms APIs for use with AgenticFlow and Claude.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TRL-Agency/MCP_server_google)

## Features

### Google Services Integration (20 Tools)
- **Google Drive** (4 tools): Create folders, list files, move files, delete files
- **Google Sheets** (4 tools): Create spreadsheets, read/write data, append data
- **Google Slides** (4 tools): Create presentations, add slides/text/images
- **Google Docs** (4 tools): Create documents, read/write/replace text
- **Google Forms** (4 tools): Create forms, add questions, get responses

## Setup Instructions

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable these APIs:
   - Google Drive API
   - Google Sheets API  
   - Google Slides API
   - Google Docs API
   - Google Forms API
4. Create OAuth 2.0 credentials (Desktop Application)
5. Download the credentials JSON

### 2. Local Development
```bash
git clone https://github.com/TRL-Agency/MCP_server_google.git
cd MCP_server_google
npm install
cp .env.example .env
# Add your Google credentials to .env
npm run setup-auth  # Run OAuth flow
npm run dev
```

### 3. Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

Or connect via GitHub in Vercel dashboard.

### 4. Environment Variables in Vercel
Add these in Vercel dashboard:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ACCESS_TOKEN`  
- `GOOGLE_REFRESH_TOKEN`

## Usage

### With AgenticFlow
1. Add MCP server: `https://your-app.vercel.app/mcp`
2. All 20 Google tools will be available

### With Claude Desktop
Add to your MCP configuration:
```json
{
  "mcpServers": {
    "google-services": {
      "command": "curl",
      "args": [
        "-X", "POST", 
        "-H", "Content-Type: application/json",
        "https://your-app.vercel.app/mcp"
      ]
    }
  }
}
```

## API Endpoints

- `GET /` - Server info and available tools
- `POST /mcp` - MCP protocol endpoint
- `GET /health` - Health check

## Educational Use Case

Perfect for automating curriculum creation:
- Generate Google Slides presentations with AI
- Create Google Forms for assessments  
- Organize lesson plans in Google Drive folders
- Build data dashboards in Google Sheets
- Create collaborative documents for projects

## Available Tools

### Google Drive
- `drive_create_folder` - Create folders
- `drive_list_files` - List and search files
- `drive_move_file` - Move files between folders
- `drive_delete_file` - Delete files

### Google Sheets
- `sheets_create` - Create new spreadsheets
- `sheets_read` - Read data from specific ranges
- `sheets_write` - Write data to cells
- `sheets_append` - Append data to sheets

### Google Slides
- `slides_create` - Create presentations
- `slides_add_slide` - Add new slides
- `slides_add_text` - Add text boxes to slides
- `slides_add_image` - Add images to slides

### Google Docs
- `docs_create` - Create new documents
- `docs_read` - Read document content
- `docs_write` - Insert text into documents
- `docs_replace_text` - Find and replace text

### Google Forms
- `forms_create` - Create new forms
- `forms_add_question` - Add questions to forms
- `forms_get_responses` - Get form responses
- `forms_get_form` - Get form structure

## Development

### Project Structure
```
src/
├── index.ts           # Standalone MCP server
├── mcp-server.ts      # Core MCP server logic
├── vercel-adapter.ts  # Vercel serverless adapter
└── setup-auth.ts     # OAuth setup script
```

### Local Testing
```bash
# Build the project
npm run build

# Run OAuth setup (one time)
npm run setup-auth

# Start the server
npm start
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For support, open an issue or contact TRL Agency.