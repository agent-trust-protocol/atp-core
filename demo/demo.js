// 🛡️ Agent Trust Protocol™ - Interactive Demo JavaScript
// Simulates ATP functionality for demonstration purposes

class ATPDemo {
    constructor() {
        this.agents = new Map();
        this.signatures = new Map();
        this.metrics = {
            activeConnections: 42,
            signaturesGenerated: 1247,
            avgResponseTime: 23,
            uptime: 99.9
        };
        this.isConnected = true;
        
        // Initialize demo
        this.initializeDemo();
    }

    initializeDemo() {
        console.log('🛡️ ATP Demo Environment Initialized');
        this.updateMetricsDisplay();
        
        // Simulate real-time updates
        setInterval(() => {
            this.simulateRealTimeUpdates();
        }, 5000);
    }

    // Quantum-Safe Signature Generation
    async generateSignature() {
        const messageElement = document.getElementById('message');
        const resultElement = document.getElementById('signature-result');
        const message = messageElement.value.trim();

        if (!message) {
            this.showError(resultElement, 'Please enter a message to sign');
            return;
        }

        // Show loading state
        resultElement.innerHTML = '<div class="loading"></div> Generating quantum-safe signature...';
        resultElement.className = 'result-box';

        try {
            // Simulate signature generation delay
            await this.delay(1500);

            // Generate mock hybrid signature
            const signature = this.generateMockSignature(message);
            
            const result = {
                message: message,
                timestamp: new Date().toISOString(),
                signature: {
                    ed25519: signature.ed25519,
                    dilithium: signature.dilithium,
                    combined: signature.combined
                },
                verification: {
                    quantum_safe: true,
                    algorithm: 'Ed25519 + Dilithium',
                    security_level: 'Post-Quantum'
                }
            };

            this.showSuccess(resultElement, JSON.stringify(result, null, 2));
            
            // Update metrics
            this.metrics.signaturesGenerated++;
            this.updateMetricsDisplay();

        } catch (error) {
            this.showError(resultElement, `Signature generation failed: ${error.message}`);
        }
    }

    generateMockSignature(message) {
        // Generate realistic-looking mock signatures
        const ed25519 = this.generateRandomHex(64);
        const dilithium = this.generateRandomHex(128);
        const combined = btoa(ed25519 + dilithium).substring(0, 88);

        return { ed25519, dilithium, combined };
    }

    // Agent Registration and Trust Level
    async registerAgent() {
        const nameElement = document.getElementById('agent-name');
        const typeElement = document.getElementById('agent-type');
        const statusElement = document.getElementById('trust-status');
        const metricsElement = document.getElementById('trust-metrics');

        const agentName = nameElement.value.trim();
        const agentType = typeElement.value;

        if (!agentName) {
            this.showError(statusElement, 'Please enter an agent name');
            return;
        }

        // Show loading state
        statusElement.innerHTML = '<div class="loading"></div> Registering agent and evaluating trust level...';
        statusElement.className = 'result-box';

        try {
            await this.delay(2000);

            // Generate agent ID and trust evaluation
            const agentId = `atp-${Date.now()}`;
            const trustEvaluation = this.evaluateTrustLevel(agentType);

            const agent = {
                id: agentId,
                name: agentName,
                type: agentType,
                registered: new Date().toISOString(),
                trustLevel: trustEvaluation.level,
                trustScore: trustEvaluation.score,
                verificationStatus: trustEvaluation.verification
            };

            this.agents.set(agentId, agent);

            const result = {
                agent_id: agentId,
                name: agentName,
                trust_level: trustEvaluation.level,
                trust_score: trustEvaluation.score,
                verification_status: trustEvaluation.verification,
                capabilities: trustEvaluation.capabilities,
                registered_at: agent.registered
            };

            this.showSuccess(statusElement, JSON.stringify(result, null, 2));
            
            // Update trust metrics display
            document.getElementById('trust-score').textContent = trustEvaluation.score;
            document.getElementById('verification-level').textContent = trustEvaluation.verification;
            metricsElement.style.display = 'grid';

            // Update connection metrics
            this.metrics.activeConnections++;
            this.updateMetricsDisplay();

        } catch (error) {
            this.showError(statusElement, `Agent registration failed: ${error.message}`);
        }
    }

    evaluateTrustLevel(agentType) {
        const evaluations = {
            basic: {
                level: 'basic',
                score: Math.floor(Math.random() * 30) + 20, // 20-50
                verification: 'Unverified',
                capabilities: ['basic_tools', 'read_access']
            },
            verified: {
                level: 'verified',
                score: Math.floor(Math.random() * 30) + 60, // 60-90
                verification: 'Verified',
                capabilities: ['advanced_tools', 'write_access', 'api_access']
            },
            enterprise: {
                level: 'enterprise',
                score: Math.floor(Math.random() * 10) + 90, // 90-100
                verification: 'Enterprise',
                capabilities: ['all_tools', 'admin_access', 'custom_integrations']
            }
        };

        return evaluations[agentType] || evaluations.basic;
    }

    // Real-time Metrics
    async refreshMetrics() {
        const button = event.target;
        const originalText = button.innerHTML;
        
        button.innerHTML = '<div class="loading"></div> Refreshing...';
        button.disabled = true;

        try {
            await this.delay(1000);
            
            // Simulate metric updates
            this.metrics.activeConnections += Math.floor(Math.random() * 10) - 5;
            this.metrics.signaturesGenerated += Math.floor(Math.random() * 50);
            this.metrics.avgResponseTime = Math.floor(Math.random() * 20) + 15;
            this.metrics.uptime = Math.max(99.0, this.metrics.uptime + (Math.random() * 0.1) - 0.05);

            this.updateMetricsDisplay();

        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    updateMetricsDisplay() {
        document.getElementById('active-connections').textContent = this.metrics.activeConnections;
        document.getElementById('signatures-generated').textContent = this.metrics.signaturesGenerated.toLocaleString();
        document.getElementById('avg-response-time').textContent = `${this.metrics.avgResponseTime}ms`;
        document.getElementById('uptime').textContent = `${this.metrics.uptime.toFixed(1)}%`;
    }

    simulateRealTimeUpdates() {
        // Simulate gradual metric changes
        this.metrics.activeConnections += Math.floor(Math.random() * 6) - 3;
        this.metrics.signaturesGenerated += Math.floor(Math.random() * 10);
        this.metrics.avgResponseTime += Math.floor(Math.random() * 6) - 3;
        
        // Keep metrics in reasonable ranges
        this.metrics.activeConnections = Math.max(10, Math.min(100, this.metrics.activeConnections));
        this.metrics.avgResponseTime = Math.max(10, Math.min(100, this.metrics.avgResponseTime));
        
        this.updateMetricsDisplay();
    }

    // API Testing
    async testAPI() {
        const endpointElement = document.getElementById('api-endpoint');
        const payloadElement = document.getElementById('api-payload');
        const responseElement = document.getElementById('api-response');

        const endpoint = endpointElement.value;
        const payload = payloadElement.value.trim();

        responseElement.innerHTML = '<div class="loading"></div> Calling API endpoint...';
        responseElement.className = 'result-box';

        try {
            await this.delay(800);

            const response = this.simulateAPICall(endpoint, payload);
            this.showSuccess(responseElement, JSON.stringify(response, null, 2));

        } catch (error) {
            this.showError(responseElement, `API call failed: ${error.message}`);
        }
    }

    simulateAPICall(endpoint, payload) {
        const responses = {
            '/health': {
                status: 'healthy',
                service: 'ATP Quantum-Safe MCP Server',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                connections: this.metrics.activeConnections,
                quantumSafe: true,
                uptime: `${this.metrics.uptime}%`
            },
            '/api/agents': {
                agents: Array.from(this.agents.values()).slice(0, 5),
                total: this.agents.size,
                active: Math.floor(this.agents.size * 0.8),
                timestamp: new Date().toISOString()
            },
            '/api/trust/evaluate': {
                agent_id: 'demo-agent-123',
                trust_level: 'verified',
                trust_score: 85,
                evaluation_factors: {
                    behavioral_score: 88,
                    verification_status: 'verified',
                    usage_history: 'consistent',
                    security_incidents: 0
                },
                timestamp: new Date().toISOString()
            },
            '/api/signatures/verify': {
                signature_valid: true,
                quantum_safe: true,
                algorithms: ['Ed25519', 'Dilithium'],
                verification_time: `${Math.floor(Math.random() * 10) + 5}ms`,
                timestamp: new Date().toISOString()
            }
        };

        return responses[endpoint] || { error: 'Endpoint not found', status: 404 };
    }

    // Compliance Report Generation
    async generateComplianceReport() {
        const button = event.target;
        const originalText = button.innerHTML;
        
        button.innerHTML = '<div class="loading"></div> Generating...';
        button.disabled = true;

        try {
            await this.delay(2000);
            
            const report = {
                report_type: 'Compliance Summary',
                generated_at: new Date().toISOString(),
                frameworks: {
                    'SOC 2 Type II': {
                        status: 'Compliant',
                        last_audit: '2025-06-15',
                        next_review: '2026-06-15',
                        controls_tested: 64,
                        controls_passed: 64
                    },
                    'ISO 27001': {
                        status: 'Certified',
                        certification_date: '2025-05-20',
                        expiry_date: '2028-05-20',
                        controls_implemented: 114,
                        compliance_score: 98.5
                    },
                    'NIST CSF': {
                        status: 'Implemented',
                        maturity_level: 'Optimized',
                        functions_covered: 5,
                        categories_implemented: 23
                    }
                },
                security_metrics: {
                    quantum_safe_coverage: '100%',
                    encryption_strength: 'Post-Quantum',
                    incident_response_time: '<4 hours',
                    vulnerability_remediation: '<24 hours'
                }
            };

            // Create a temporary download link
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `atp-compliance-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('Compliance report downloaded successfully!');

        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    // Performance Benchmarking
    async runBenchmark() {
        const iterationsElement = document.getElementById('benchmark-iterations');
        const resultsElement = document.getElementById('benchmark-results');
        const metricsElement = document.getElementById('benchmark-metrics');

        const iterations = parseInt(iterationsElement.value);

        resultsElement.innerHTML = '<div class="loading"></div> Running performance benchmark...';
        resultsElement.className = 'result-box';

        try {
            const startTime = performance.now();
            
            // Simulate benchmark execution
            await this.delay(Math.min(iterations / 10, 5000)); // Scale delay with iterations
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const signaturesPerSecond = Math.floor((iterations / totalTime) * 1000);
            const avgSignatureTime = (totalTime / iterations).toFixed(2);

            const results = {
                benchmark_type: 'Quantum-Safe Signature Performance',
                iterations: iterations,
                total_time: `${totalTime.toFixed(2)}ms`,
                signatures_per_second: signaturesPerSecond,
                average_signature_time: `${avgSignatureTime}ms`,
                algorithm: 'Ed25519 + Dilithium',
                quantum_safe: true,
                timestamp: new Date().toISOString()
            };

            this.showSuccess(resultsElement, JSON.stringify(results, null, 2));
            
            // Update benchmark metrics display
            document.getElementById('signatures-per-second').textContent = signaturesPerSecond.toLocaleString();
            document.getElementById('avg-signature-time').textContent = `${avgSignatureTime}ms`;
            metricsElement.style.display = 'grid';

        } catch (error) {
            this.showError(resultsElement, `Benchmark failed: ${error.message}`);
        }
    }

    // Utility Functions
    generateRandomHex(length) {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showSuccess(element, content) {
        element.textContent = content;
        element.className = 'result-box success';
    }

    showError(element, content) {
        element.textContent = content;
        element.className = 'result-box error';
    }

    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
let atpDemo;

function generateSignature() {
    atpDemo.generateSignature();
}

function registerAgent() {
    atpDemo.registerAgent();
}

function refreshMetrics() {
    atpDemo.refreshMetrics();
}

function testAPI() {
    atpDemo.testAPI();
}

function generateComplianceReport() {
    atpDemo.generateComplianceReport();
}

function runBenchmark() {
    atpDemo.runBenchmark();
}

// Initialize demo when page loads
document.addEventListener('DOMContentLoaded', function() {
    atpDemo = new ATPDemo();
    console.log('🛡️ Agent Trust Protocol™ Demo Ready');
});