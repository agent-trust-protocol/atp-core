import { NextRequest, NextResponse } from 'next/server';

interface EnterpriseContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  jobTitle: string;
  companySize: string;
  industry: string;
  useCase: string;
  agentCount?: string;
  timeline?: string;
  message?: string;
  consent: boolean;
}

// Lead scoring based on company size, industry, and timeline
function calculateLeadScore(data: EnterpriseContactForm): number {
  let score = 0;
  
  // Company size scoring
  switch (data.companySize) {
    case '1000+': score += 40; break;
    case '201-1000': score += 35; break;
    case '51-200': score += 25; break;
    case '11-50': score += 15; break;
    case '1-10': score += 5; break;
  }
  
  // Industry scoring (high-value industries)
  switch (data.industry) {
    case 'financial-services': score += 30; break;
    case 'healthcare': score += 25; break;
    case 'government': score += 25; break;
    case 'technology': score += 20; break;
    case 'manufacturing': score += 15; break;
    default: score += 10; break;
  }
  
  // Timeline urgency scoring
  switch (data.timeline) {
    case 'immediate': score += 25; break;
    case '3-months': score += 20; break;
    case '6-months': score += 15; break;
    case '12-months': score += 10; break;
    case 'evaluating': score += 5; break;
  }
  
  // Use case complexity scoring
  switch (data.useCase) {
    case 'quantum-safe-migration': score += 15; break;
    case 'custom-integration': score += 15; break;
    case 'compliance-automation': score += 12; break;
    case 'multi-party-collaboration': score += 10; break;
    case 'ai-agent-security': score += 8; break;
    case 'evaluation': score += 5; break;
  }
  
  return Math.min(score, 100); // Cap at 100
}

function getLeadPriority(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const contactData: EnterpriseContactForm = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,
      company: formData.get('company') as string,
      jobTitle: formData.get('jobTitle') as string,
      companySize: formData.get('companySize') as string,
      industry: formData.get('industry') as string,
      useCase: formData.get('useCase') as string,
      agentCount: formData.get('agentCount') as string || undefined,
      timeline: formData.get('timeline') as string || undefined,
      message: formData.get('message') as string || undefined,
      consent: formData.get('consent') === 'on'
    };
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'company', 'jobTitle', 'companySize', 'industry', 'useCase'];
    for (const field of requiredFields) {
      if (!contactData[field as keyof EnterpriseContactForm]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    if (!contactData.consent) {
      return NextResponse.json(
        { error: 'Consent is required to proceed' },
        { status: 400 }
      );
    }
    
    // Calculate lead score and priority
    const leadScore = calculateLeadScore(contactData);
    const priority = getLeadPriority(leadScore);
    
    // Create enriched lead data
    const leadData = {
      ...contactData,
      leadScore,
      priority,
      submittedAt: new Date().toISOString(),
      source: 'enterprise-contact-form',
      followUpRequired: priority === 'High' ? 'immediate' : priority === 'Medium' ? '24h' : '72h'
    };
    
    // TODO: In production, integrate with CRM (Salesforce, HubSpot, etc.)
    // await saveToCRM(leadData);
    
    // TODO: Send internal notification for high-priority leads
    if (priority === 'High') {
      // await sendSlackNotification(leadData);
      // await sendEmailToSalesTeam(leadData);
    }
    
    // TODO: Send automated email response to prospect
    // await sendAutoResponse(contactData);
    
    // Log the lead for now (in production, this would go to a proper database)
    console.log('New Enterprise Lead:', {
      contact: `${contactData.firstName} ${contactData.lastName}`,
      company: contactData.company,
      email: contactData.email,
      priority,
      leadScore,
      timestamp: new Date().toISOString()
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Thank you for your interest! Our enterprise team will contact you within 24 hours.',
      leadId: `ENT-${Date.now()}`, // Temporary ID generation
      priority,
      expectedContactTime: priority === 'High' ? '4 hours' : priority === 'Medium' ? '24 hours' : '72 hours'
    });
    
  } catch (error) {
    console.error('Enterprise contact form error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred processing your request. Please try again or contact us directly.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    status: 'healthy',
    service: 'enterprise-contact-api',
    timestamp: new Date().toISOString()
  });
}