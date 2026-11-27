import { NextResponse } from 'next/server.js';

/**
 * GET /api/v1/openapi.json
 * OpenAPI 3.1.0 Specification for J-Forge API Gateway
 */
export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'J-Forge: Python to Java Transpiler & API Gateway',
      version: '1.2.0',
      description:
        'Production GenAI REST API Gateway transpiling Python 3.11 scripts into strongly typed Java 17/21 LTS OOP code with asynchronous HMAC-SHA256 webhooks and compiler diagnostics. Course BTIN337 CIA-P (20 Marks).',
      contact: {
        name: 'Aryan Negi',
        email: 'AryanX.mac@gmail.com',
        url: 'https://github.com/negiaryan19/py2java-transpiler',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
      {
        url: 'https://py2java-transpiler.vercel.app',
        description: 'Vercel Serverless Production Deployment',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Access token configured in APP_API_KEY environment variable.',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Token',
          description: 'Authorization: Bearer <token>',
        },
      },
    },
    paths: {
      '/api/v1/convert': {
        post: {
          summary: 'Transpile Python code to Java OOP and dispatch webhook',
          security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['python_code'],
                  properties: {
                    python_code: { type: 'string', example: 'def add(a: int, b: int) -> int:\n    return a + b' },
                    java_version: { type: 'string', default: '17', example: '17' },
                    webhook_url: { type: 'string', format: 'uri', example: '/api/v1/webhook-demo' },
                    bypass_cache: { type: 'boolean', default: false, description: 'Bypass AST cache and force live transpilation' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Code successfully transpiled with AST caching and self-healing verification',
              headers: {
                'X-Cache': { schema: { type: 'string', example: 'HIT' } },
                'X-Self-Healing-Passes': { schema: { type: 'string', example: '0' } },
                'X-Self-Healing-Quality': { schema: { type: 'string', example: '100%' } },
              },
            },
            '400': { description: 'Malformed JSON or missing python_code' },
            '401': { description: 'Missing or invalid authentication credentials' },
            '413': { description: 'Source payload exceeds 25000 character limit' },
            '429': { description: 'Rate limit exceeded (60 req/min)' },
            '500': { description: 'Internal compilation or timeout exception' },
          },
        },
      },
      '/api/v1/explain': {
        post: {
          summary: 'Compiler Diagnostics & Big-O Complexity Analysis',
          security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['python_code'],
                  properties: {
                    python_code: { type: 'string' },
                    java_version: { type: 'string', default: '17' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Diagnostics successfully computed' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/api/v1/webhook-verify': {
        post: {
          summary: 'Cryptographic HMAC-SHA256 Signature Validator',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['payload', 'signature'],
                  properties: {
                    payload: { type: 'object' },
                    signature: { type: 'string' },
                    secret: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Verification result returned' },
          },
        },
      },
      '/api/v1/webhook-demo': {
        post: {
          summary: 'Mock Webhook Receiver Endpoint',
          description: 'Receives and acknowledges signed JSON webhook payloads for live evaluation and testing.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            '200': { description: 'Webhook event acknowledged with echoed payload and delivery metadata' },
            '400': { description: 'Malformed JSON webhook payload' },
          },
        },
      },
      '/api/v1/health': {
        get: {
          summary: 'Health Check & Security Probe',
          responses: {
            '200': { description: 'Service is healthy' },
          },
        },
      },
      '/api/v1/metrics': {
        get: {
          summary: 'Prometheus OpenMetrics Exposition Endpoint',
          description: 'Exports operational counters, latency histograms, and uptime gauges in Prometheus text exposition format.',
          responses: {
            '200': {
              description: 'OpenMetrics compatible telemetry payload',
              content: {
                'text/plain': {
                  schema: { type: 'string', example: '# HELP jforge_transpile_requests_total ...\n# TYPE ...' },
                },
              },
            },
          },
        },
      },
      '/api/v1/openapi.json': {
        get: {
          summary: 'OpenAPI 3.1.0 Specification Document',
          description: 'Returns the machine-readable OpenAPI 3.1.0 schema covering all J-Forge endpoints.',
          responses: {
            '200': { description: 'OpenAPI 3.1.0 JSON schema' },
          },
        },
      },
      '/api/v1/ast-diff': {
        post: {
          summary: 'Cross-Language AST Alignment & Syntax Mapping Inspector',
          description: 'Parses Python 3.11 and Java 17 ASTs using tree-sitter and returns aligned semantic nodes with type explanations.',
          security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['python_code', 'java_code'],
                  properties: {
                    python_code: { type: 'string' },
                    java_code: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'AST alignment pairs and normalized semantic nodes computed' },
            '400': { description: 'Missing required code inputs' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, { status: 200 });
}
