import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    status: 'ok',
    service: 'Google Services MCP Server',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    tools: 20,
    endpoints: {
      main: '/',
      health: '/api/health',
      mcp: '/api/mcp'
    }
  });
}