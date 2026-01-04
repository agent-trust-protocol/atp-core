#!/usr/bin/env node

/**
 * Session Sync MCP Server
 * 
 * Cross-agent session synchronization for Cursor and Claude Code.
 * Enables seamless context sharing between AI coding assistants.
 * 
 * Features:
 * - Persistent session storage (SQLite)
 * - Message history sync
 * - Context/state sharing
 * - Decision tracking
 * - Full-text search
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import { SessionStorage, Session, Message, Context, Decision } from './storage.js';

// Initialize storage
const storage = new SessionStorage();

// Agent identification from environment
const AGENT_NAME = process.env.SESSION_SYNC_AGENT || 'unknown';
const PROJECT_PATH = process.env.SESSION_SYNC_PROJECT || process.cwd();
const PROJECT_NAME = process.env.SESSION_SYNC_PROJECT_NAME || PROJECT_PATH.split('/').pop() || 'unnamed';

// Create MCP server
const server = new Server(
  {
    name: 'session-sync-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Define all tools
const tools: Tool[] = [
  {
    name: 'sync_session',
    description: 'Save current session context for cross-agent synchronization. Call this before ending a session to preserve context for the other agent.',
    inputSchema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Brief summary of current session state and what was accomplished',
        },
        currentTask: {
          type: 'string',
          description: 'Current task or objective being worked on',
        },
        recentChanges: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of recent changes or decisions made',
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Suggested next steps for continuation',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorizing this session (e.g., "bugfix", "feature", "refactor")',
        },
      },
      required: ['summary'],
    },
  },
  {
    name: 'resume_session',
    description: 'Resume a previous session and get the context from the other agent. Call this at the start of a new session to catch up.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Specific session ID to resume (optional, defaults to most recent for this project)',
        },
      },
    },
  },
  {
    name: 'list_sessions',
    description: 'List all available sessions for this project or across all projects.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Filter by project path (defaults to current project)',
        },
        agent: {
          type: 'string',
          description: 'Filter by agent (cursor, claude-code, etc.)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of sessions to return',
        },
      },
    },
  },
  {
    name: 'save_context',
    description: 'Save a specific piece of context (key-value) for the current session.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Context key (e.g., "current_branch", "db_schema", "api_endpoint")',
        },
        value: {
          type: 'string',
          description: 'Context value',
        },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'get_context',
    description: 'Retrieve context from the current session.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Specific key to retrieve (optional, returns all if not specified)',
        },
        sessionId: {
          type: 'string',
          description: 'Session ID (optional, defaults to current/most recent)',
        },
      },
    },
  },
  {
    name: 'add_message',
    description: 'Add a message to the session history. Use for important communications that should be preserved.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['user', 'assistant', 'system'],
          description: 'Message role',
        },
        content: {
          type: 'string',
          description: 'Message content',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (optional)',
        },
      },
      required: ['role', 'content'],
    },
  },
  {
    name: 'get_messages',
    description: 'Retrieve message history from a session.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session ID (optional, defaults to current)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of messages to return',
        },
      },
    },
  },
  {
    name: 'record_decision',
    description: 'Record an architectural or implementation decision for future reference.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'What was decided',
        },
        rationale: {
          type: 'string',
          description: 'Why this decision was made',
        },
      },
      required: ['description', 'rationale'],
    },
  },
  {
    name: 'get_decisions',
    description: 'Get all decisions recorded in a session.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session ID (optional)',
        },
        status: {
          type: 'string',
          enum: ['active', 'superseded', 'reverted'],
          description: 'Filter by status',
        },
      },
    },
  },
  {
    name: 'search',
    description: 'Search across all sessions for specific content.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        sessionId: {
          type: 'string',
          description: 'Limit search to specific session (optional)',
        },
      },
      required: ['query'],
    },
  },
];

// Current session management
let currentSessionId: string | null = null;

function getOrCreateSession(): Session {
  // Try to get existing session for this project
  let session = storage.getSessionByProject(PROJECT_PATH);
  
  if (!session) {
    // Create new session
    session = storage.createSession({
      id: randomUUID(),
      projectPath: PROJECT_PATH,
      projectName: PROJECT_NAME,
      lastAgent: AGENT_NAME,
    });
    console.error(`[session-sync] Created new session: ${session.id}`);
  } else {
    // Update last agent
    storage.updateSession(session.id, { lastAgent: AGENT_NAME });
    console.error(`[session-sync] Resumed session: ${session.id}`);
  }
  
  currentSessionId = session.id;
  return session;
}

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'sync_session': {
        const session = getOrCreateSession();
        const { summary, currentTask, recentChanges, nextSteps, tags } = args as any;
        
        // Update session summary
        storage.updateSession(session.id, {
          summary,
          tags: tags?.join(','),
          lastAgent: AGENT_NAME,
        });

        // Save context
        if (currentTask) {
          storage.setContext({
            sessionId: session.id,
            key: 'current_task',
            value: currentTask,
            agent: AGENT_NAME,
          });
        }
        
        if (recentChanges?.length) {
          storage.setContext({
            sessionId: session.id,
            key: 'recent_changes',
            value: JSON.stringify(recentChanges),
            agent: AGENT_NAME,
          });
        }
        
        if (nextSteps?.length) {
          storage.setContext({
            sessionId: session.id,
            key: 'next_steps',
            value: JSON.stringify(nextSteps),
            agent: AGENT_NAME,
          });
        }

        // Add sync message
        storage.addMessage({
          sessionId: session.id,
          agent: AGENT_NAME,
          role: 'system',
          content: `Session synced by ${AGENT_NAME}: ${summary}`,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              sessionId: session.id,
              message: `Session synced successfully. Context saved for cross-agent use.`,
              syncedAt: new Date().toISOString(),
              agent: AGENT_NAME,
            }, null, 2),
          }],
        };
      }

      case 'resume_session': {
        const { sessionId } = args as any;
        let session: Session | null;
        
        if (sessionId) {
          session = storage.getSession(sessionId);
        } else {
          session = storage.getSessionByProject(PROJECT_PATH);
        }
        
        if (!session) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: 'No previous session found. Starting fresh.',
              }, null, 2),
            }],
          };
        }

        currentSessionId = session.id;
        
        // Get all context
        const context = storage.getContext(session.id);
        const decisions = storage.getDecisions(session.id, 'active');
        const messages = storage.getMessages(session.id, { limit: 10 });

        // Build context summary
        const contextMap: Record<string, string> = {};
        for (const ctx of context) {
          contextMap[ctx.key] = ctx.value;
        }

        // Update session with new agent
        storage.updateSession(session.id, { lastAgent: AGENT_NAME });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              session: {
                id: session.id,
                projectName: session.projectName,
                lastAgent: session.lastAgent,
                updatedAt: session.updatedAt,
                summary: session.summary,
                tags: session.tags?.split(','),
              },
              context: contextMap,
              recentDecisions: decisions.slice(0, 5).map(d => ({
                description: d.description,
                rationale: d.rationale,
                agent: d.agent,
              })),
              recentMessages: messages.slice(0, 5).map(m => ({
                role: m.role,
                content: m.content.substring(0, 200) + (m.content.length > 200 ? '...' : ''),
                agent: m.agent,
              })),
              message: `Session resumed from ${session.lastAgent}. Review the context above.`,
            }, null, 2),
          }],
        };
      }

      case 'list_sessions': {
        const { projectPath, agent, limit } = args as any;
        const sessions = storage.listSessions({
          projectPath: projectPath || PROJECT_PATH,
          agent,
          limit: limit || 10,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              sessions: sessions.map(s => ({
                id: s.id,
                projectName: s.projectName,
                lastAgent: s.lastAgent,
                updatedAt: s.updatedAt,
                summary: s.summary?.substring(0, 100),
                tags: s.tags?.split(','),
              })),
              total: sessions.length,
            }, null, 2),
          }],
        };
      }

      case 'save_context': {
        const session = getOrCreateSession();
        const { key, value } = args as any;
        
        storage.setContext({
          sessionId: session.id,
          key,
          value,
          agent: AGENT_NAME,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Context saved: ${key}`,
              sessionId: session.id,
            }, null, 2),
          }],
        };
      }

      case 'get_context': {
        const { key, sessionId } = args as any;
        const session = sessionId ? storage.getSession(sessionId) : getOrCreateSession();
        
        if (!session) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ success: false, message: 'Session not found' }, null, 2),
            }],
          };
        }

        const context = storage.getContext(session.id, key);
        
        if (key) {
          const value = context[0]?.value;
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                key,
                value: value || null,
                agent: context[0]?.agent,
                timestamp: context[0]?.timestamp,
              }, null, 2),
            }],
          };
        }

        const contextMap: Record<string, any> = {};
        for (const ctx of context) {
          contextMap[ctx.key] = {
            value: ctx.value,
            agent: ctx.agent,
            timestamp: ctx.timestamp,
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ context: contextMap }, null, 2),
          }],
        };
      }

      case 'add_message': {
        const session = getOrCreateSession();
        const { role, content, metadata } = args as any;
        
        const message = storage.addMessage({
          sessionId: session.id,
          agent: AGENT_NAME,
          role,
          content,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              messageId: message.id,
              sessionId: session.id,
            }, null, 2),
          }],
        };
      }

      case 'get_messages': {
        const { sessionId, limit } = args as any;
        const session = sessionId ? storage.getSession(sessionId) : getOrCreateSession();
        
        if (!session) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ success: false, message: 'Session not found' }, null, 2),
            }],
          };
        }

        const messages = storage.getMessages(session.id, { limit: limit || 20 });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              sessionId: session.id,
              messages: messages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                agent: m.agent,
                timestamp: m.timestamp,
              })),
            }, null, 2),
          }],
        };
      }

      case 'record_decision': {
        const session = getOrCreateSession();
        const { description, rationale } = args as any;
        
        const decision = storage.addDecision({
          sessionId: session.id,
          description,
          rationale,
          agent: AGENT_NAME,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              decisionId: decision.id,
              sessionId: session.id,
              message: 'Decision recorded for cross-agent reference.',
            }, null, 2),
          }],
        };
      }

      case 'get_decisions': {
        const { sessionId, status } = args as any;
        const session = sessionId ? storage.getSession(sessionId) : getOrCreateSession();
        
        if (!session) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ success: false, message: 'Session not found' }, null, 2),
            }],
          };
        }

        const decisions = storage.getDecisions(session.id, status);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              sessionId: session.id,
              decisions: decisions.map(d => ({
                id: d.id,
                description: d.description,
                rationale: d.rationale,
                agent: d.agent,
                status: d.status,
                timestamp: d.timestamp,
              })),
            }, null, 2),
          }],
        };
      }

      case 'search': {
        const { query, sessionId } = args as any;
        const results = storage.search(query, sessionId);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              query,
              results: {
                messages: results.messages.slice(0, 10).map(m => ({
                  content: m.content.substring(0, 200),
                  agent: m.agent,
                  sessionId: m.sessionId,
                })),
                context: results.context.slice(0, 10).map(c => ({
                  key: c.key,
                  value: c.value.substring(0, 200),
                  agent: c.agent,
                })),
                decisions: results.decisions.slice(0, 5).map(d => ({
                  description: d.description,
                  rationale: d.rationale.substring(0, 200),
                  agent: d.agent,
                })),
              },
              totalFound: results.messages.length + results.context.length + results.decisions.length,
            }, null, 2),
          }],
        };
      }

      default:
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: `Unknown tool: ${name}` }, null, 2),
          }],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[session-sync] Error in ${name}:`, error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: errorMessage }, null, 2),
      }],
      isError: true,
    };
  }
});

// Handle resource listing
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const sessions = storage.listSessions({ limit: 10 });
  return {
    resources: sessions.map(s => ({
      uri: `session://${s.id}`,
      name: `Session: ${s.projectName}`,
      description: s.summary || `Last updated by ${s.lastAgent}`,
      mimeType: 'application/json',
    })),
  };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const sessionId = uri.replace('session://', '');
  const session = storage.getSession(sessionId);
  
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const context = storage.getContext(session.id);
  const decisions = storage.getDecisions(session.id, 'active');
  const messages = storage.getMessages(session.id, { limit: 20 });

  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({
        session,
        context,
        decisions,
        recentMessages: messages,
      }, null, 2),
    }],
  };
});

// Start server
async function main() {
  console.error('[session-sync] Starting Session Sync MCP Server...');
  console.error(`[session-sync] Agent: ${AGENT_NAME}`);
  console.error(`[session-sync] Project: ${PROJECT_PATH}`);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('[session-sync] Server connected and ready');
}

main().catch((error) => {
  console.error('[session-sync] Fatal error:', error);
  process.exit(1);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.error('[session-sync] Shutting down...');
  storage.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[session-sync] Shutting down...');
  storage.close();
  process.exit(0);
});


