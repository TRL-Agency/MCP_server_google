// Standalone MCP server for non-Vercel environments
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Google API Setup
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/forms',
];

class GoogleServicesMCPServer {
  private server: Server;
  private oauth2Client!: OAuth2Client;
  private drive: any;
  private sheets: any;
  private slides: any;
  private docs: any;
  private forms: any;

  constructor() {
    this.server = new Server({
      name: 'google-services-mcp',
      version: '0.1.0',
    });

    this.setupAuth();
    this.setupHandlers();
  }

  private setupAuth() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/callback'
    );

    // Set credentials if available
    if (process.env.GOOGLE_ACCESS_TOKEN) {
      this.oauth2Client.setCredentials({
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
    }

    // Initialize Google APIs
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
    this.slides = google.slides({ version: 'v1', auth: this.oauth2Client });
    this.docs = google.docs({ version: 'v1', auth: this.oauth2Client });
    this.forms = google.forms({ version: 'v1', auth: this.oauth2Client });
  }

  private setupHandlers() {
    // Basic tool list - for full implementation copy from google_mcp_server.ts
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'drive_create_folder',
          description: 'Create a new folder in Google Drive',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Folder name' },
              parentId: { type: 'string', description: 'Parent folder ID (optional)' },
            },
            required: ['name'],
          },
        },
        // ... include all other tools here for full implementation
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;
      // For now, return placeholder - implement all methods for full version
      throw new McpError(ErrorCode.MethodNotFound, `Tool not implemented in standalone version: ${name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Google Services MCP server running on stdio');
  }
}

const server = new GoogleServicesMCPServer();
server.run().catch(console.error);