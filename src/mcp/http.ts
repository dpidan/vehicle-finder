import { callMcpTool, mcpTools } from './tools.js';

interface JsonRpcRequest {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
}

export async function handleMcpHttpRequest(db: D1Database, body: unknown): Promise<Response> {
  if (!isRecord(body) || body.jsonrpc !== '2.0' || typeof body.method !== 'string' || !body.method.trim()) {
    return jsonRpcError(null, -32600, 'Invalid Request');
  }

  const id = body.id ?? null;

  if (body.method === 'tools/list') {
    return jsonRpcResult(id, { tools: mcpTools });
  }

  if (body.method !== 'tools/call') {
    return jsonRpcError(id, -32601, 'Method not found');
  }

  const params = body.params;

  if (!isRecord(params) || typeof params.name !== 'string' || (params.arguments !== undefined && !isRecord(params.arguments))) {
    return jsonRpcError(id, -32602, 'Invalid params');
  }

  const result = await callMcpTool(db, params.name, params.arguments ?? {});

  if (!result.ok) {
    return jsonRpcError(id, -32602, 'Tool error', { toolError: result.error });
  }

  return jsonRpcResult(id, {
    content: [{ type: 'text', text: JSON.stringify(result.data) }],
    structuredContent: result.data
  });
}

export async function parseMcpJsonRequest(request: Request): Promise<unknown | 'invalid-json'> {
  const text = await request.text();

  if (!text.trim()) {
    return 'invalid-json';
  }

  try {
    return JSON.parse(text) as JsonRpcRequest;
  } catch {
    return 'invalid-json';
  }
}

function jsonRpcResult(id: unknown, result: unknown): Response {
  return Response.json({ jsonrpc: '2.0', id, result });
}

function jsonRpcError(id: unknown, code: number, message: string, data?: unknown): Response {
  return Response.json({ jsonrpc: '2.0', id, error: { code, message, ...(data === undefined ? {} : { data }) } });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
