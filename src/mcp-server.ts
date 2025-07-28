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

export class GoogleServicesMCPServer {
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
      process.env.GOOGLE_REDIRECT_URI || 'https://your-vercel-app.vercel.app/callback'
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
      case 'tools/list':
        return this.listTools();
      
      case 'tools/call':
        return this.callTool(params);
      
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown method: ${method}`);
    }
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

  // Google Drive Methods
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

  private async moveFile(args: any) {
    // Get current parents
    const file = await this.drive.files.get({
      fileId: args.fileId,
      fields: 'parents',
    });

    const previousParents = file.data.parents.join(',');

    const response = await this.drive.files.update({
      fileId: args.fileId,
      addParents: args.newParentId,
      removeParents: previousParents,
      fields: 'id, parents',
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          fileId: response.data.id,
          newParents: response.data.parents,
        }, null, 2),
      }],
    };
  }

  private async deleteFile(args: any) {
    await this.drive.files.delete({
      fileId: args.fileId,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `File ${args.fileId} deleted successfully`,
        }, null, 2),
      }],
    };
  }

  // Google Sheets Methods
  private async createSpreadsheet(args: any) {
    const resource = {
      properties: {
        title: args.title,
      },
      sheets: args.sheetNames ? args.sheetNames.map((name: string) => ({
        properties: { title: name }
      })) : undefined,
    };

    const response = await this.sheets.spreadsheets.create({
      resource,
      fields: 'spreadsheetId, spreadsheetUrl, properties',
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          spreadsheetId: response.data.spreadsheetId,
          spreadsheetUrl: response.data.spreadsheetUrl,
          title: response.data.properties.title,
        }, null, 2),
      }],
    };
  }

  private async readSheet(args: any) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          range: response.data.range,
          values: response.data.values || [],
        }, null, 2),
      }],
    };
  }

  private async writeSheet(args: any) {
    const response = await this.sheets.spreadsheets.values.update({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
      valueInputOption: args.valueInputOption || 'USER_ENTERED',
      resource: {
        values: args.values,
      },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          updatedCells: response.data.updatedCells,
          updatedColumns: response.data.updatedColumns,
          updatedRows: response.data.updatedRows,
        }, null, 2),
      }],
    };
  }

  private async appendSheet(args: any) {
    const response = await this.sheets.spreadsheets.values.append({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
      valueInputOption: args.valueInputOption || 'USER_ENTERED',
      resource: {
        values: args.values,
      },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          updatedCells: response.data.updates.updatedCells,
          updatedColumns: response.data.updates.updatedColumns,
          updatedRows: response.data.updates.updatedRows,
        }, null, 2),
      }],
    };
  }

  // Google Slides Methods
  private async createPresentation(args: any) {
    const response = await this.slides.presentations.create({
      resource: {
        title: args.title,
      },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          presentationId: response.data.presentationId,
          title: response.data.title,
          slides: response.data.slides?.map((slide: any) => ({
            slideId: slide.objectId,
            layoutId: slide.slideProperties?.layoutObjectId,
          })),
        }, null, 2),
      }],
    };
  }

  private async addSlide(args: any) {
    const requests = [{
      createSlide: {
        objectId: `slide_${Date.now()}`,
        slideLayoutReference: args.layoutId ? {
          layoutId: args.layoutId,
        } : undefined,
      },
    }];

    const response = await this.slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      resource: { requests },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          slideId: response.data.replies[0].createSlide.objectId,
        }, null, 2),
      }],
    };
  }

  private async addTextToSlide(args: any) {
    const textBoxId = `textbox_${Date.now()}`;
    
    const requests = [
      {
        createShape: {
          objectId: textBoxId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: args.slideId,
            size: {
              width: { magnitude: args.width || 300, unit: 'PT' },
              height: { magnitude: args.height || 50, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: args.x || 50,
              translateY: args.y || 50,
              unit: 'PT',
            },
          },
        },
      },
      {
        insertText: {
          objectId: textBoxId,
          text: args.text,
        },
      },
    ];

    const response = await this.slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      resource: { requests },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          textBoxId,
          success: true,
        }, null, 2),
      }],
    };
  }

  private async addImageToSlide(args: any) {
    const imageId = `image_${Date.now()}`;
    
    const requests = [{
      createImage: {
        objectId: imageId,
        url: args.imageUrl,
        elementProperties: {
          pageObjectId: args.slideId,
          size: {
            width: { magnitude: args.width || 200, unit: 'PT' },
            height: { magnitude: args.height || 200, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: args.x || 100,
            translateY: args.y || 100,
            unit: 'PT',
          },
        },
      },
    }];

    const response = await this.slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      resource: { requests },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          imageId,
          success: true,
        }, null, 2),
      }],
    };
  }

  // Google Docs Methods
  private async createDocument(args: any) {
    const response = await this.docs.documents.create({
      resource: {
        title: args.title,
      },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          documentId: response.data.documentId,
          title: response.data.title,
          revisionId: response.data.revisionId,
        }, null, 2),
      }],
    };
  }

  private async readDocument(args: any) {
    const response = await this.docs.documents.get({
      documentId: args.documentId,
    });

    // Extract text content from the document
    let textContent = '';
    if (response.data.body && response.data.body.content) {
      for (const element of response.data.body.content) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements || []) {
            if (textElement.textRun && textElement.textRun.content) {
              textContent += textElement.textRun.content;
            }
          }
        }
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          documentId: response.data.documentId,
          title: response.data.title,
          textContent,
          revisionId: response.data.revisionId,
        }, null, 2),
      }],
    };
  }

  private async writeDocument(args: any) {
    const requests = [{
      insertText: {
        location: {
          index: args.index || 1,
        },
        text: args.text,
      },
    }];

    const response = await this.docs.documents.batchUpdate({
      documentId: args.documentId,
      resource: { requests },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          revisionId: response.data.documentId,
        }, null, 2),
      }],
    };
  }

  private async replaceTextInDocument(args: any) {
    const requests = [{
      replaceAllText: {
        containsText: {
          text: args.searchText,
          matchCase: false,
        },
        replaceText: args.replaceText,
      },
    }];

    const response = await this.docs.documents.batchUpdate({
      documentId: args.documentId,
      resource: { requests },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          replacements: response.data.replies[0]?.replaceAllText?.occurrencesChanged || 0,
        }, null, 2),
      }],
    };
  }

  // Google Forms Methods
  private async createForm(args: any) {
    const response = await this.forms.forms.create({
      resource: {
        info: {
          title: args.title,
          description: args.description,
        },
      },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          formId: response.data.formId,
          title: response.data.info?.title,
          responderUri: response.data.responderUri,
        }, null, 2),
      }],
    };
  }

  private async addQuestionToForm(args: any) {
    const questionItem: any = {
      title: args.title,
      questionItem: {
        question: {
          required: args.required || false,
        },
      },
    };

    // Set question type and options
    switch (args.questionType) {
      case 'MULTIPLE_CHOICE':
        questionItem.questionItem.question.choiceQuestion = {
          type: 'RADIO',
          options: args.options?.map((option: string) => ({ value: option })) || [],
        };
        break;
      case 'CHECKBOX':
        questionItem.questionItem.question.choiceQuestion = {
          type: 'CHECKBOX',
          options: args.options?.map((option: string) => ({ value: option })) || [],
        };
        break;
      case 'TEXT':
        questionItem.questionItem.question.textQuestion = {};
        break;
      case 'PARAGRAPH_TEXT':
        questionItem.questionItem.question.textQuestion = {
          paragraph: true,
        };
        break;
      case 'LINEAR_SCALE':
        questionItem.questionItem.question.scaleQuestion = {
          low: 1,
          high: 5,
        };
        break;
      case 'DATE':
        questionItem.questionItem.question.dateQuestion = {};
        break;
      case 'TIME':
        questionItem.questionItem.question.timeQuestion = {};
        break;
    }

    const response = await this.forms.forms.batchUpdate({
      formId: args.formId,
      resource: {
        requests: [{
          createItem: {
            item: questionItem,
            location: { index: 0 },
          },
        }],
      },
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          itemId: response.data.replies[0]?.createItem?.itemId,
        }, null, 2),
      }],
    };
  }

  private async getFormResponses(args: any) {
    const response = await this.forms.forms.responses.list({
      formId: args.formId,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          responses: response.data.responses || [],
          totalResponses: response.data.responses?.length || 0,
        }, null, 2),
      }],
    };
  }

  private async getForm(args: any) {
    const response = await this.forms.forms.get({
      formId: args.formId,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          formId: response.data.formId,
          info: response.data.info,
          items: response.data.items?.map((item: any) => ({
            itemId: item.itemId,
            title: item.title,
            questionType: Object.keys(item.questionItem?.question || {})[0],
          })) || [],
          responderUri: response.data.responderUri,
        }, null, 2),
      }],
    };
  }
}