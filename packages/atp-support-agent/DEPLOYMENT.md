# ATP Support Agent Deployment Guide 🚀

## Quick Start (For Monday Launch)

### 1. Environment Setup
```bash
cd packages/atp-support-agent
npm install

# Create .env file
cat > .env << EOF
# ATP Configuration
ATP_ENDPOINT=http://localhost:8080
ATP_API_KEY=your-api-key

# Slack Configuration (Optional)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token

# Discord Configuration (Optional)
DISCORD_BOT_TOKEN=your-discord-token

# Zendesk Configuration (Optional)
ZENDESK_API_KEY=your-zendesk-key
ZENDESK_SUBDOMAIN=your-subdomain

# OpenAI Configuration (For enhanced responses)
OPENAI_API_KEY=your-openai-key
EOF
```

### 2. Quick Test
```bash
# Build the agent
npm run build

# Run locally
npm run dev
```

### 3. Deploy to Production
```bash
# Using PM2 for production
npm install -g pm2

# Start the support agent
pm2 start dist/index.js --name atp-support-agent

# Save PM2 configuration
pm2 save
pm2 startup
```

## Integration Channels

### Slack Setup (Recommended for Launch)
1. Go to https://api.slack.com/apps
2. Create new app "ATP Support Bot"
3. Add OAuth scopes:
   - `commands`
   - `chat:write`
   - `im:history`
   - `app_mentions:read`
4. Install to workspace
5. Copy tokens to .env file

### Web Portal Integration
```html
<!-- Add to your website -->
<script src="https://api.yourdomain.com/support/widget.js"></script>
<script>
  ATPSupport.init({
    apiKey: 'your-public-key',
    position: 'bottom-right',
    theme: 'dark'
  });
</script>
```

### API Endpoint
```bash
# Direct API access
curl -X POST https://api.yourdomain.com/support/query \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I integrate ATP with React?",
    "customerId": "customer-123",
    "tier": "enterprise"
  }'
```

## Monitoring & Analytics

### Health Check Endpoint
```bash
curl https://api.yourdomain.com/support/health
```

### Metrics Dashboard
Access at: https://monitor.yourdomain.com/support-agent

Key metrics:
- Response time (target: <30s)
- Resolution rate (target: 80% automated)
- Trust score (maintain >0.95)
- Customer satisfaction (target: 4.5+ stars)

## Knowledge Base Management

### Update Documentation
```bash
# Crawl latest docs
npm run update-knowledge-base

# Add custom Q&As
npm run add-qa -- --file custom-qa.json
```

### Common Issues Database
```json
{
  "issues": [
    {
      "pattern": "CORS error",
      "solution": "Add your domain to allowed origins in ATP settings",
      "code": "client.configure({ cors: { origin: 'https://yourdomain.com' } })"
    },
    {
      "pattern": "Trust score low",
      "solution": "Ensure agent has proper credentials and recent activity",
      "link": "/docs/trust-scoring"
    }
  ]
}
```

## Performance Optimization

### Caching Strategy
- Cache common queries for 1 hour
- Cache documentation for 24 hours
- Invalidate on documentation updates

### Scaling
```yaml
# kubernetes/support-agent.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: atp-support-agent
spec:
  replicas: 3  # Scale based on load
  template:
    spec:
      containers:
      - name: support-agent
        image: atp/support-agent:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## Testing Before Launch

### Test Scenarios
```bash
# Run automated tests
npm test

# Test common queries
npm run test:queries

# Load testing
npm run test:load -- --concurrent 100 --duration 60
```

### Verification Checklist
- [ ] Agent responds to documentation queries
- [ ] Code examples generate correctly
- [ ] Escalation flow works
- [ ] Slack bot responds (if configured)
- [ ] Trust scoring integrates properly
- [ ] Response time <30 seconds
- [ ] Handles high-priority enterprise queries

## Launch Day Preparation

### 1. Enable monitoring
```bash
pm2 monitor
```

### 2. Set up alerts
```bash
# Alert if response time >30s
# Alert if error rate >5%
# Alert if trust score <0.9
```

### 3. Prepare escalation team
- Assign 2 engineers for escalations
- Create #support-escalations Slack channel
- Document escalation procedures

### 4. Marketing message
"ATP Support: The world's first AI agent powered by its own trust protocol"

## Emergency Procedures

### If agent fails:
```bash
# Restart
pm2 restart atp-support-agent

# Check logs
pm2 logs atp-support-agent

# Fallback to manual support
# Redirect to: support@yourdomain.com
```

### If overwhelmed:
```bash
# Scale up
pm2 scale atp-support-agent 5

# Enable rate limiting
npm run enable-rate-limit -- --limit 100
```

## Success Metrics

Track these KPIs:
1. **Automation Rate**: Target 80%
2. **Response Time**: Target <30s
3. **CSAT Score**: Target 4.5+
4. **Cost per Ticket**: Target <$5
5. **Trust Score**: Maintain >0.95

## ROI Calculation

```
Traditional Support Cost: $200K/year (3 engineers)
ATP Support Agent Cost: $10K/year (infrastructure)
Savings: $190K/year

Additional Benefits:
- 24/7 availability
- Infinite scalability
- Consistent quality
- Marketing value
```

## Ready for Launch! 🚀

The ATP Support Agent demonstrates real-world ATP usage while providing enterprise-grade support. This is your competitive differentiator!