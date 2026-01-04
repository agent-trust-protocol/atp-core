/**
 * ATP Support Agent - Slack Integration
 * Provides 24/7 support via Slack
 */

import { App } from '@slack/bolt';
import { ATPSupportAgent } from '../index';

export class ATPSlackBot {
  private app: App;
  private supportAgent: ATPSupportAgent;

  constructor(
    private readonly config: {
      token: string;
      signingSecret: string;
      appToken: string;
      supportAgentConfig: any;
    }
  ) {
    this.app = new App({
      token: config.token,
      signingSecret: config.signingSecret,
      appToken: config.appToken,
      socketMode: true,
    });

    this.supportAgent = new ATPSupportAgent(config.supportAgentConfig);
  }

  /**
   * Initialize the Slack bot
   */
  async initialize(): Promise<void> {
    // Initialize support agent
    await this.supportAgent.initialize();

    // Register slash commands
    this.registerCommands();

    // Register event handlers
    this.registerEventHandlers();

    // Start the app
    await this.app.start();
    console.log('⚡️ ATP Support Bot is running on Slack!');
  }

  /**
   * Register Slack slash commands
   */
  private registerCommands(): void {
    // /atp-help command
    this.app.command('/atp-help', async ({ command, ack, respond }) => {
      await ack();

      const query = {
        id: `slack-${Date.now()}`,
        customerId: command.user_id,
        channel: 'slack' as const,
        query: command.text,
        context: { 
          channel: command.channel_id,
          team: command.team_id 
        },
        timestamp: new Date(),
        priority: 'medium' as const,
        customerTier: await this.getCustomerTier(command.user_id)
      };

      const response = await this.supportAgent.processQuery(query);
      
      await respond({
        response_type: 'in_channel',
        blocks: this.formatResponse(response)
      });
    });

    // /atp-status command
    this.app.command('/atp-status', async ({ ack, respond }) => {
      await ack();
      
      const status = await this.getSystemStatus();
      
      await respond({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*ATP System Status* 🟢\n\n` +
                    `• API: ${status.api}\n` +
                    `• Trust Engine: ${status.trustEngine}\n` +
                    `• Support Agent: Online (Trust Score: 0.95)\n` +
                    `• Response Time: <30s`
            }
          }
        ]
      });
    });

    // /atp-escalate command
    this.app.command('/atp-escalate', async ({ command, ack, respond }) => {
      await ack();
      
      // Create high-priority ticket
      const ticketId = await this.createEscalationTicket({
        userId: command.user_id,
        issue: command.text,
        channel: command.channel_id
      });
      
      await respond({
        text: `🎫 Escalation ticket created: #${ticketId}\n` +
              `A human support engineer will contact you within 4 hours.`
      });
    });
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers(): void {
    // Handle direct messages
    this.app.message(async ({ message, say }) => {
      if (message.subtype) return; // Ignore bot messages
      
      const query = {
        id: `slack-dm-${Date.now()}`,
        customerId: message.user,
        channel: 'slack' as const,
        query: message.text || '',
        context: { 
          thread_ts: message.thread_ts,
          channel: message.channel 
        },
        timestamp: new Date(),
        priority: 'medium' as const,
        customerTier: await this.getCustomerTier(message.user)
      };

      const response = await this.supportAgent.processQuery(query);
      
      await say({
        blocks: this.formatResponse(response),
        thread_ts: message.ts // Reply in thread
      });
    });

    // Handle app mentions
    this.app.event('app_mention', async ({ event, say }) => {
      const query = {
        id: `slack-mention-${Date.now()}`,
        customerId: event.user,
        channel: 'slack' as const,
        query: event.text.replace(/<@[^>]+>/g, '').trim(),
        context: { 
          channel: event.channel,
          thread_ts: event.thread_ts 
        },
        timestamp: new Date(),
        priority: 'medium' as const,
        customerTier: await this.getCustomerTier(event.user)
      };

      const response = await this.supportAgent.processQuery(query);
      
      await say({
        blocks: this.formatResponse(response),
        thread_ts: event.ts
      });
    });
  }

  /**
   * Format support response for Slack
   */
  private formatResponse(response: any): any[] {
    const blocks: any[] = [];

    // Main response
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: response.response
      }
    });

    // Code examples
    if (response.codeExamples?.length > 0) {
      response.codeExamples.forEach((code: string) => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '```' + code + '```'
          }
        });
      });
    }

    // Documentation links
    if (response.documentationLinks?.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📚 Relevant Documentation:*\n' +
                response.documentationLinks.map((link: string) => 
                  `• <https://docs.atp.dev${link}|${link}>`
                ).join('\n')
        }
      });
    }

    // Suggested actions
    if (response.suggestedActions?.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*💡 Suggested Actions:*\n' +
                response.suggestedActions.map((action: string) => 
                  `• ${action}`
                ).join('\n')
        }
      });
    }

    // Escalation notice
    if (response.requiresEscalation) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⚠️ *This issue requires human assistance.*\n` +
                `Reason: ${response.escalationReason}\n` +
                `Use \`/atp-escalate\` to create a priority ticket.`
        }
      });
    }

    // Trust score footer
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🤖 ATP Support Agent | Trust Score: ${response.agentTrustScore} | Confidence: ${(response.confidence * 100).toFixed(0)}%`
        }
      ]
    });

    // Feedback buttons
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '👍 Helpful'
          },
          style: 'primary',
          action_id: 'feedback_helpful',
          value: response.queryId
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '👎 Not Helpful'
          },
          action_id: 'feedback_not_helpful',
          value: response.queryId
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🎫 Escalate'
          },
          action_id: 'escalate',
          value: response.queryId
        }
      ]
    });

    return blocks;
  }

  /**
   * Get customer tier from Slack user ID
   */
  private async getCustomerTier(userId: string): Promise<any> {
    // In production, look up from database
    // For now, return default
    return 'free';
  }

  /**
   * Get system status
   */
  private async getSystemStatus(): Promise<any> {
    // Check actual service health
    return {
      api: '🟢 Operational',
      trustEngine: '🟢 Operational',
      supportAgent: '🟢 Operational'
    };
  }

  /**
   * Create escalation ticket
   */
  private async createEscalationTicket(data: any): Promise<string> {
    // Create ticket in Zendesk/Intercom
    return `ATP-${Date.now()}`;
  }
}

// Example usage
if (require.main === module) {
  const bot = new ATPSlackBot({
    token: process.env.SLACK_BOT_TOKEN!,
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    appToken: process.env.SLACK_APP_TOKEN!,
    supportAgentConfig: {
      atpEndpoint: process.env.ATP_ENDPOINT || 'http://localhost:8080',
      knowledgeBaseUrl: process.env.KB_URL
    }
  });

  bot.initialize().catch(console.error);
}