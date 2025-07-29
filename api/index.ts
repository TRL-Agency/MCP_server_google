import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Google Services MCP Server</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f9f9f9; }
            .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
            .method { color: #007bff; font-weight: bold; }
            .status { background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 20px 0; }
            h1 { color: #333; }
            h2 { color: #555; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Google Services MCP Server</h1>
            <div class="status">
                ✅ Server is running successfully!
            </div>
            
            <p>Model Context Protocol server for Google Drive, Sheets, Slides, Docs, and Forms APIs.</p>
            
            <h2>API Endpoints</h2>
            <div class="endpoint">
                <span class="method">GET</span> <code>/</code> - This info page
            </div>
            <div class="endpoint">
                <span class="method">GET</span> <code>/api/health</code> - Health check
            </div>
            <div class="endpoint">
                <span class="method">POST</span> <code>/api/mcp</code> - MCP protocol endpoint
            </div>
            
            <h2>Available Tools (20)</h2>
            <h3>🗂️ Google Drive (4 tools)</h3>
            <ul>
                <li><strong>drive_create_folder</strong> - Create folders</li>
                <li><strong>drive_list_files</strong> - List and search files</li>
                <li><strong>drive_move_file</strong> - Move files between folders</li>
                <li><strong>drive_delete_file</strong> - Delete files</li>
            </ul>
            
            <h3>📊 Google Sheets (4 tools)</h3>
            <ul>
                <li><strong>sheets_create</strong> - Create new spreadsheets</li>
                <li><strong>sheets_read</strong> - Read data from specific ranges</li>
                <li><strong>sheets_write</strong> - Write data to cells</li>
                <li><strong>sheets_append</strong> - Append data to sheets</li>
            </ul>
            
            <h3>📽️ Google Slides (4 tools)</h3>
            <ul>
                <li><strong>slides_create</strong> - Create presentations</li>
                <li><strong>slides_add_slide</strong> - Add new slides</li>
                <li><strong>slides_add_text</strong> - Add text boxes to slides</li>
                <li><strong>slides_add_image</strong> - Add images to slides</li>
            </ul>
            
            <h3>📝 Google Docs (4 tools)</h3>
            <ul>
                <li><strong>docs_create</strong> - Create new documents</li>
                <li><strong>docs_read</strong> - Read document content</li>
                <li><strong>docs_write</strong> - Insert text into documents</li>
                <li><strong>docs_replace_text</strong> - Find and replace text</li>
            </ul>
            
            <h3>📋 Google Forms (4 tools)</h3>
            <ul>
                <li><strong>forms_create</strong> - Create new forms</li>
                <li><strong>forms_add_question</strong> - Add questions to forms</li>
                <li><strong>forms_get_responses</strong> - Get form responses</li>
                <li><strong>forms_get_form</strong> - Get form structure</li>
            </ul>
            
            <h2>Usage</h2>
            <div class="endpoint">
                <strong>With AgenticFlow:</strong><br>
                Use <code>${req.headers.host}/api/mcp</code> as your MCP server URL.
            </div>
            <div class="endpoint">
                <strong>With Claude Desktop:</strong><br>
                Configure the API endpoint in your MCP settings.
            </div>
            
            <h2>Perfect for Education!</h2>
            <p>This MCP server is designed to automate curriculum creation by integrating with all major Google Workspace tools. Create presentations, manage spreadsheets, organize documents, and collect feedback through forms - all through AI automation.</p>
            
            <p><small>🎓 Created by TRL Agency for educational automation</small></p>
        </div>
    </body>
    </html>
  `);
}