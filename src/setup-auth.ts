import { OAuth2Client } from 'google-auth-library';
import { createServer } from 'http';
import { parse } from 'url';
import { writeFileSync, readFileSync } from 'fs';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/forms',
];

class GoogleAuthSetup {
  private oauth2Client: OAuth2Client;
  private port = 8080;

  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables');
      console.error('Please set up your .env file with your Google OAuth credentials');
      process.exit(1);
    }

    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `http://localhost:${this.port}/callback`
    );
  }

  async setup() {
    console.log('🚀 Starting Google OAuth setup...\n');

    // Check if we already have tokens
    if (process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN) {
      console.log('✅ Tokens already found in environment variables');
      console.log('Testing existing tokens...');
      
      this.oauth2Client.setCredentials({
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });

      try {
        // Test the tokens by making a simple API call
        const { google } = await import('googleapis');
        const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        await drive.files.list({ pageSize: 1 });
        console.log('✅ Existing tokens are valid and working!');
        return;
      } catch (error) {
        console.log('⚠️  Existing tokens are invalid, getting new ones...\n');
      }
    }

    await this.getNewTokens();
  }

  private async getNewTokens() {
    return new Promise<void>((resolve, reject) => {
      // Create temporary HTTP server to handle OAuth callback
      const server = createServer((req, res) => {
        const url = parse(req.url!, true);
        
        if (url.pathname === '/callback') {
          const code = url.query.code as string;
          
          if (code) {
            this.oauth2Client.getToken(code, (err, token) => {
              if (err) {
                console.error('❌ Error retrieving access token:', err);
                res.end('❌ Error retrieving access token. Check console for details.');
                reject(err);
                return;
              }

              if (token) {
                // Save tokens to .env file
                this.saveTokensToEnv(token.access_token!, token.refresh_token!);
                
                res.end(`
                  <!DOCTYPE html>
                  <html>
                    <head><title>Authentication Successful</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                      <h1 style="color: green;">✅ Authentication Successful!</h1>
                      <p>You can close this window and return to your terminal.</p>
                      <p>Your Google Services MCP Server is now ready to use.</p>
                    </body>
                  </html>
                `);
                
                console.log('\n✅ Authentication successful!');
                console.log('✅ Tokens saved to .env file');
                console.log('\nYou can now run: npm run build && npm start');
                
                server.close();
                resolve();
              }
            });
          } else {
            res.end('❌ No authorization code received');
            reject(new Error('No authorization code received'));
          }
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      });

      server.listen(this.port, () => {
        const authUrl = this.oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
          prompt: 'consent', // Force consent screen to get refresh token
        });

        console.log('🌐 Opening browser for Google OAuth...');
        console.log('If the browser doesn\'t open automatically, visit this URL:');
        console.log('\n' + authUrl + '\n');

        // Try to open browser automatically
        this.openBrowser(authUrl);
      });

      // Handle server errors
      server.on('error', (err) => {
        console.error('❌ Server error:', err);
        reject(err);
      });
    });
  }

  private saveTokensToEnv(accessToken: string, refreshToken: string) {
    try {
      // Read current .env file
      let envContent = '';
      try {
        envContent = readFileSync('.env', 'utf8');
      } catch (error) {
        // .env doesn't exist, create it
        console.log('📄 Creating new .env file...');
      }

      // Update or add tokens
      const lines = envContent.split('\n');
      const updatedLines: string[] = [];
      let foundAccessToken = false;
      let foundRefreshToken = false;

      for (const line of lines) {
        if (line.startsWith('GOOGLE_ACCESS_TOKEN=')) {
          updatedLines.push(`GOOGLE_ACCESS_TOKEN=${accessToken}`);
          foundAccessToken = true;
        } else if (line.startsWith('GOOGLE_REFRESH_TOKEN=')) {
          updatedLines.push(`GOOGLE_REFRESH_TOKEN=${refreshToken}`);
          foundRefreshToken = true;
        } else {
          updatedLines.push(line);
        }
      }

      // Add tokens if they weren't found
      if (!foundAccessToken) {
        updatedLines.push(`GOOGLE_ACCESS_TOKEN=${accessToken}`);
      }
      if (!foundRefreshToken) {
        updatedLines.push(`GOOGLE_REFRESH_TOKEN=${refreshToken}`);
      }

      // Write back to .env
      writeFileSync('.env', updatedLines.join('\n'));
      console.log('💾 Tokens saved to .env file');

    } catch (error) {
      console.error('❌ Error saving tokens to .env:', error);
      console.log('\n📋 Please manually add these to your .env file:');
      console.log(`GOOGLE_ACCESS_TOKEN=${accessToken}`);
      console.log(`GOOGLE_REFRESH_TOKEN=${refreshToken}`);
    }
  }

  private openBrowser(url: string) {
    const start = process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    
    const { exec } = require('child_process');
    exec(`${start} "${url}"`, (error: any) => {
      if (error) {
        console.log('Could not open browser automatically. Please visit the URL above manually.');
      }
    });
  }
}

// Load environment variables
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch (error) {
  console.log('Note: dotenv not installed, reading .env manually');
  // Simple .env parser
  try {
    const envFile = readFileSync('.env', 'utf8');
    for (const line of envFile.split('\n')) {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  } catch (error) {
    console.error('❌ Could not read .env file. Please create one based on .env.example');
    process.exit(1);
  }
}

// Run setup
const setup = new GoogleAuthSetup();
setup.setup().catch(console.error);