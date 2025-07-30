import { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError 
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/forms',
];

class GoogleServicesMCPServer {
  private oauth2Client!: OAuth2Client;
  private drive: any;
  private sheets: any;
  private slides: any;
  private docs: any;
  private forms: any;

  constructor() {
    this.setupAuth();
  }

  private setupAuth() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials from environment
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

  async handleRequest(body: any) {
    const { method, params } = body;

    switch (method) {
      case 'initialize':
        return this.initialize(params);
      
      case 'tools/list':
        return this.listTools();
      
      case 'tools/call':
        return this.callTool(params);
      
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown method: ${method}`);
    }
  }

  private async initialize(params: any) {
    return {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: "Google Services MCP Server",
        version: "0.1.0"
      }
    };
  }

  private async listTools() {
    return {
      tools: [
        // Google Drive Tools
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
        {
          name: 'drive_list_files',
          description: 'List files in Google Drive',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query (optional)' },
              maxResults: { type: 'number', description: 'Max results (default: 10)' },
              folderId: { type: 'string', description: 'Folder ID to search in (optional)' },
            },
          },
        },
        {
          name: 'drive_move_file',
          description: 'Move a file to a different folder',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: { type: 'string', description: 'File ID to move' },
              newParentId: { type: 'string', description: 'New parent folder ID' },
            },
            required: ['fileId', 'newParentId'],
          },
        },
        {
          name: 'drive_delete_file',
          description: 'Delete a file from Google Drive',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: { type: 'string', description: 'File ID to delete' },
            },
            required: ['fileId'],
          },
        },

        // Google Sheets Tools
        {
          name: 'sheets_create',
          description: 'Create a new Google Sheets spreadsheet',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Spreadsheet title' },
              sheetNames: { type: 'array', items: { type: 'string' }, description: 'Sheet names (optional)' },
            },
            required: ['title'],
          },
        },
        {
          name: 'sheets_read',
          description: 'Read data from a Google Sheets spreadsheet',
          inputSchema: {
            type: 'object',
            properties: {
              spreadsheetId: { type: 'string', description: 'Spreadsheet ID' },
              range: { type: 'string', description: 'Range to read (e.g., "Sheet1!A1:C10")' },
            },
            required: ['spreadsheetId', 'range'],
          },
        },
        {
          name: 'sheets_write',
          description: 'Write data to a Google Sheets spreadsheet',
          inputSchema: {
            type: 'object',
            properties: {
              spreadsheetId: { type: 'string', description: 'Spreadsheet ID' },
              range: { type: 'string', description: 'Range to write (e.g., "Sheet1!A1")' },
              values: { type: 'array', description: 'Array of arrays containing the data' },
              valueInputOption: { type: 'string', enum: ['RAW', 'USER_ENTERED'], description: 'How values should be interpreted' },
            },
            required: ['spreadsheetId', 'range', 'values'],
          },
        },
        {
          name: 'sheets_append',
          description: 'Append data to a Google Sheets spreadsheet',
          inputSchema: {
            type: 'object',
            properties: {
              spreadsheetId: { type: 'string', description: 'Spreadsheet ID' },
              range: { type: 'string', description: 'Range to append to (e.g., "Sheet1!A1")' },
              values: { type: 'array', description: 'Array of arrays containing the data' },
              valueInputOption: { type: 'string', enum: ['RAW', 'USER_ENTERED'], description: 'How values should be interpreted' },
            },
            required: ['spreadsheetId', 'range', 'values'],
          },
        },

        // Google Slides Tools
        {
          name: 'slides_create',
          description: 'Create a new Google Slides presentation',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Presentation title' },
            },
            required: ['title'],
          },
        },
        {
          name: 'slides_add_slide',
          description: 'Add a new slide to a presentation',
          inputSchema: {
            type: 'object',
            properties: {
              presentationId: { type: 'string', description: 'Presentation ID' },
              layoutId: { type: 'string', description: 'Layout ID (optional)' },
            },
            required: ['presentationId'],
          },
        },
        {
          name: 'slides_add_text',
          description: 'Add text to a slide',
          inputSchema: {
            type: 'object',
            properties: {
              presentationId: { type: 'string', description: 'Presentation ID' },
              slideId: { type: 'string', description: 'Slide ID' },
              text: { type: 'string', description: 'Text to add' },
              x: { type: 'number', description: 'X position (optional)' },
              y: { type: 'number', description: 'Y position (optional)' },
              width: { type: 'number', description: 'Width (optional)' },
              height: { type: 'number', description: 'Height (optional)' },
            },
            required: ['presentationId', 'slideId', 'text'],
          },
        },
        {
          name: 'slides_add_image',
          description: 'Add an image to a slide',
          inputSchema: {
            type: 'object',
            properties: {
              presentationId: { type: 'string', description: 'Presentation ID' },
              slideId: { type: 'string', description: 'Slide ID' },
              imageUrl: { type: 'string', description: 'Image URL' },
              x: { type: 'number', description: 'X position (optional)' },
              y: { type: 'number', description: 'Y position (optional)' },
              width: { type: 'number', description: 'Width (optional)' },
              height: { type: 'number', description: 'Height (optional)' },
            },
            required: ['presentationId', 'slideId', 'imageUrl'],
          },
        },

        // Google Docs Tools
        {
          name: 'docs_create',
          description: 'Create a new Google Docs document',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Document title' },
            },
            required: ['title'],
          },
        },
        {
          name: 'docs_read',
          description: 'Read content from a Google Docs document',
          inputSchema: {
            type: 'object',
            properties: {
              documentId: { type: 'string', description: 'Document ID' },
            },
            required: ['documentId'],
          },
        },
        {
          name: 'docs_write',
          description: 'Write text to a Google Docs document',
          inputSchema: {
            type: 'object',
            properties: {
              documentId: { type: 'string', description: 'Document ID' },
              text: { type: 'string', description: 'Text to insert' },
              index: { type: 'number', description: 'Index to insert at (default: end)' },
            },
            required: ['documentId', 'text'],
          },
        },
        {
          name: 'docs_replace_text',
          description: 'Replace text in a Google Docs document',
          inputSchema: {
            type: 'object',
            properties: {
              documentId: { type: 'string', description: 'Document ID' },
              searchText: { type: 'string', description: 'Text to search for' },
              replaceText: { type: 'string', description: 'Text to replace with' },
            },
            required: ['documentId', 'searchText', 'replaceText'],
          },
        },

        // Google Forms Tools
        {
          name: 'forms_create',
          description: 'Create a new Google Form',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Form title' },
              description: { type: 'string', description: 'Form description (optional)' },
            },
            required: ['title'],
          },
        },
        {
          name: 'forms_add_question',
          description: 'Add a question to a Google Form',
          inputSchema: {
            type: 'object',
            properties: {
              formId: { type: 'string', description: 'Form ID' },
              questionType: { 
                type: 'string', 
                enum: ['MULTIPLE_CHOICE', 'TEXT', 'PARAGRAPH_TEXT', 'MULTIPLE_CHOICE_GRID', 'CHECKBOX', 'LINEAR_SCALE', 'DATE', 'TIME'],
                description: 'Type of question' 
              },
              title: { type: 'string', description: 'Question title' },
              options: { type: 'array', items: { type: 'string' }, description: 'Options for multiple choice questions' },
              required: { type: 'boolean', description: 'Whether the question is required' },
            },
            required: ['formId', 'questionType', 'title'],
          },
        },
        {
          name: 'forms_get_responses',
          description: 'Get responses from a Google Form',
          inputSchema: {
            type: 'object',
            properties: {
              formId: { type: 'string', description: 'Form ID' },
            },
            required: ['formId'],
          },
        },
        {
          name: 'forms_get_form',
          description: 'Get form details and structure',
          inputSchema: {
            type: 'object',
            properties: {
              formId: { type: 'string', description: 'Form ID' },
            },
            required: ['formId'],
          },
        },
      ],
    };
  }

  private async callTool(params: any) {
    const { name, arguments: args } = params;

    try {
      switch (name) {
        case 'drive_create_folder':
          return await this.createFolder(args);
        case 'drive_list_files':
          return await this.listFiles(args);
        case 'drive_move_file':
          return await this.moveFile(args);
        case 'drive_delete_file':
          return await this.deleteFile(args);
        case 'sheets_create':
          return await this.createSpreadsheet(args);
        case 'sheets_read':
          return await this.readSheet(args);
        case 'sheets_write':
          return await this.writeSheet(args);
        case 'sheets_append':
          return await this.appendSheet(args);
        case 'slides_create':
          return await this.createPresentation(args);
        case 'slides_add_slide':
          return await this.addSlide(args);
        case 'slides_add_text':
          return await this.addTextToSlide(args);
        case 'slides_add_image':
          return await this.addImageToSlide(args);
        case 'docs_create':
          return await this.createDocument(args);
        case 'docs_read':
          return await this.readDocument(args);
        case 'docs_write':
          return await this.writeDocument(args);
        case 'docs_replace_text':
          return await this.replaceTextInDocument(args);
        case 'forms_create':
          return await this.createForm(args);
        case 'forms_add_question':
          return await this.addQuestionToForm(args);
        case 'forms_get_responses':
          return await this.getFormResponses(args);
        case 'forms_get_form':
          return await this.getForm(args);
        
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Error executing ${name}: ${error.message}`);
    }
  }

  // All the Google API methods will go here - I'll include just a few for brevity
  private async createFolder(args: any) {
    const fileMetadata = {
      name: args.name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: args.parentId ? [args.parentId] : undefined,
    };

    const response = await this.drive.files.create({
      resource: fileMetadata,
      fields: 'id, name, webViewLink',
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          id: response.data.id,
          name: response.data.name,
          webViewLink: response.data.webViewLink,
        }, null, 2),
      }],
    };
  }

  private async listFiles(args: any) {
    const query = args.folderId 
      ? `'${args.folderId}' in parents` 
      : args.query || '';

    const response = await this.drive.files.list({
      q: query,
      pageSize: args.maxResults || 10,
      fields: 'files(id, name, mimeType, webViewLink, createdTime, modifiedTime)',
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data.files, null, 2),
      }],
    };
  }

  // Add placeholder methods for now - these would contain the full implementations
  private async moveFile(args: any) { throw new Error('Method not yet implemented'); }
  private async deleteFile(args: any) { throw new Error('Method not yet implemented'); }
  private async createSpreadsheet(args: any) { throw new Error('Method not yet implemented'); }
  private async readSheet(args: any) { throw new Error('Method not yet implemented'); }
  private async writeSheet(args: any) { throw new Error('Method not yet implemented'); }
  private async appendSheet(args: any) { throw new Error('Method not yet implemented'); }
  private async createPresentation(args: any) { throw new Error('Method not yet implemented'); }
  private async addSlide(args: any) { throw new Error('Method not yet implemented'); }
  private async addTextToSlide(args: any) { throw new Error('Method not yet implemented'); }
  private async addImageToSlide(args: any) { throw new Error('Method not yet implemented'); }
  private async createDocument(args: any) { throw new Error('Method not yet implemented'); }
  private async readDocument(args: any) { throw new Error('Method not yet implemented'); }
  private async writeDocument(args: any) { throw new Error('Method not yet implemented'); }
  private async replaceTextInDocument(args: any) { throw new Error('Method not yet implemented'); }
  private async createForm(args: any) { throw new Error('Method not yet implemented'); }
  private async addQuestionToForm(args: any) { throw new Error('Method not yet implemented'); }
  private async getFormResponses(args: any) { throw new Error('Method not yet implemented'); }
  private async getForm(args: any) { throw new Error('Method not yet implemented'); }
}

let mcpServer: GoogleServicesMCPServer | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check endpoint
  if (req.url === '/api/health' || req.url?.includes('health')) {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Google Services MCP Server'
    });
    return;
  }

  // MCP endpoint
  if (req.method === 'POST') {
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

  // Default info response
  res.status(200).json({
    name: 'Google Services MCP Server',
    version: '0.1.0',
    endpoints: {
      health: '/api/health',
      mcp: '/api/mcp (POST)'
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