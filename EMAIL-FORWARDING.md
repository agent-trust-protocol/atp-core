# Email Forwarding Configuration

## Overview
All ATP professional email addresses are configured to forward to a central inbox for streamlined management.

## Email Addresses & Forwarding

| Public Email Address | Purpose | Forwards To |
|---------------------|---------|-------------|
| **support@agenttrustprotocol.com** | Technical support & general help | llewis@agenttrustprotocol.com |
| **enterprise@agenttrustprotocol.com** | Enterprise sales & demos | llewis@agenttrustprotocol.com |
| **security@agenttrustprotocol.com** | Security vulnerabilities & issues | llewis@agenttrustprotocol.com |
| **sales@agenttrustprotocol.com** | Sales inquiries | llewis@agenttrustprotocol.com |
| **noreply@agenttrustprotocol.com** | Automated system emails | llewis@agenttrustprotocol.com |
| **dev@agenttrustprotocol.com** | Developer relations | *(Not forwarded - separate inbox)* |

## Domain Configuration

### Required DNS/Email Provider Setup
Configure email forwarding rules in your domain provider (e.g., Google Workspace, Microsoft 365, or domain registrar):

1. **Create aliases** for each professional email address
2. **Set forwarding rules** to route all emails to `llewis@agenttrustprotocol.com`
3. **Exception**: Keep `dev@agenttrustprotocol.com` as a separate inbox

### Response Configuration
When replying to emails:
- **From field**: Use the appropriate professional address (e.g., reply from support@ for support inquiries)
- **Reply-to**: Set to the same professional address
- This maintains professional appearance while centralizing management

## Benefits
- **Centralized Management**: All communications in one inbox
- **Professional Appearance**: Role-based email addresses for different purposes
- **Easy Delegation**: Can easily add team members to specific addresses later
- **Audit Trail**: All communications tracked in one place

## Implementation Status
✅ All email addresses in codebase configured correctly
✅ Public-facing emails show professional addresses
✅ Documentation updated with correct contact information

## Next Steps
1. Configure email forwarding in your domain provider
2. Set up email client with multiple "send from" addresses
3. Create email templates for common responses
4. Consider setting up auto-responders for initial acknowledgment