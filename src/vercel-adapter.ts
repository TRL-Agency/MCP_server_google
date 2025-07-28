import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleServicesMCPServer } from './mcp-server';

let mcpServer: GoogleServicesMCPServer | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for web access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    return;
  }

  // MCP endpoint
  if (req.url === '/mcp' && req.method === 'POST') {
    try {
      // Initialize MCP server if not already done
      if (!mcpServer) {
        mcpServer = new GoogleServicesMCPServer();
      }

      // Handle MCP request
      const result = await mcpServer.handleRequest(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('MCP Error:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    return;
  }

  // Default response with MCP server info
  res.status(200).json({
    name: 'Google Services MCP Server',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      mcp: '/mcp (POST)'
    },
    tools: [
      'drive_create_folder', 'drive_list_files', 'drive_move_file', 'drive_delete_file',
      'sheets_create', 'sheets_read', 'sheets_write', 'sheets_append',
      'slides_create', 'slides_add_slide', 'slides_add_text', 'slides_add_image',
      'docs_create', 'docs_read', 'docs_write', 'docs_replace_text',
      'forms_create', 'forms_add_question', 'forms_get_responses', 'forms_get_form'
    ]
  });
}