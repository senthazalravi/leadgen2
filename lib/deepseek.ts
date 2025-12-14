const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-b07618e5177e4d1bb3db717b5b412500'
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function callDeepSeek(messages: Message[], temperature = 0.7): Promise<string> {
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data: DeepSeekResponse = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('DeepSeek API error:', error)
    throw error
  }
}

// Our services that we offer
export const OUTRINSIC_SERVICES = {
  socialMedia: {
    name: 'Social Media Management',
    description: 'Complete social media presence management including content creation, scheduling, engagement, and analytics',
    keywords: ['social', 'instagram', 'linkedin', 'twitter', 'facebook', 'marketing', 'brand', 'content'],
  },
  leadGeneration: {
    name: 'Lead Generation',
    description: 'AI-powered lead generation, prospecting, and qualification services',
    keywords: ['sales', 'leads', 'b2b', 'outreach', 'prospecting', 'growth', 'customers'],
  },
  contentManagement: {
    name: 'Content Generation & Management',
    description: 'Blog posts, articles, newsletters, and content strategy with AI assistance',
    keywords: ['content', 'blog', 'writing', 'articles', 'newsletter', 'seo', 'copywriting'],
  },
  customerSupport: {
    name: 'Customer Support & Ticket Management',
    description: '24/7 customer support, ticket resolution, and help desk management',
    keywords: ['support', 'customer', 'tickets', 'helpdesk', 'service', 'complaints', 'queries'],
  },
  paymentVerification: {
    name: 'Payment Verification & Refunds',
    description: 'Payment processing verification, refund management, and fraud prevention',
    keywords: ['payment', 'refund', 'billing', 'invoice', 'verification', 'finance'],
  },
  communityManagement: {
    name: 'Community & Forum Management',
    description: 'Forum moderation, community building, and user engagement',
    keywords: ['community', 'forum', 'users', 'engagement', 'moderation', 'members'],
  },
  dataEntry: {
    name: 'Data Entry & Processing',
    description: 'Accurate data entry, processing, and database management',
    keywords: ['data', 'entry', 'processing', 'database', 'records', 'administrative'],
  },
  virtualAssistant: {
    name: 'Virtual Assistant Services',
    description: 'Email management, scheduling, research, and administrative support',
    keywords: ['assistant', 'admin', 'scheduling', 'email', 'research', 'administrative'],
  },
}

// Analyze company and suggest relevant services
export async function analyzeCompanyAndSuggestServices(
  companyName: string,
  companyDescription: string,
  industry?: string,
  website?: string
): Promise<{
  summary: string
  painPoints: string[]
  suggestedServices: string[]
  proposalPoints: string[]
  outreachAngle: string
}> {
  const servicesInfo = Object.entries(OUTRINSIC_SERVICES)
    .map(([key, service]) => `- ${service.name}: ${service.description}`)
    .join('\n')

  const prompt = `Analyze this Scandinavian company and suggest how Outrinsic can help them:

Company: ${companyName}
Industry: ${industry || 'Unknown'}
Website: ${website || 'Not provided'}
Description: ${companyDescription || 'No description available'}

Outrinsic offers these services with resources in India and Indonesia at competitive rates:
${servicesInfo}

Provide a JSON response with:
1. "summary": Brief 2-3 sentence summary of what the company does
2. "painPoints": Array of 3-4 likely pain points or challenges they face
3. "suggestedServices": Array of top 3 most relevant services from our list
4. "proposalPoints": Array of 3-4 specific value propositions for this company
5. "outreachAngle": Best angle to approach this company (1-2 sentences)

Focus on:
- Their likely operational challenges as a growing Scandinavian startup
- How offshore resources can help them scale cost-effectively
- Specific ways our services can add value

Return ONLY valid JSON, no markdown.`

  const response = await callDeepSeek([
    {
      role: 'system',
      content: 'You are a business analyst specializing in B2B sales for service companies. Analyze companies and suggest relevant services. Always respond with valid JSON only.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], 0.5)

  try {
    // Clean the response
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanedResponse)
  } catch {
    return {
      summary: response,
      painPoints: ['Scaling operations cost-effectively', 'Managing customer support', 'Content creation at scale'],
      suggestedServices: ['Customer Support & Ticket Management', 'Social Media Management', 'Content Generation & Management'],
      proposalPoints: ['Reduce operational costs by 60-70%', 'Scale support team without hiring overhead', 'Focus on core business while we handle operations'],
      outreachAngle: 'Help them scale their operations efficiently with dedicated offshore resources.',
    }
  }
}

// Generate personalized email for a lead
export async function generatePersonalizedEmail(
  companyName: string,
  contactName: string,
  companyInfo: string,
  suggestedServices: string[],
  proposalPoints: string[]
): Promise<{
  subject: string
  body: string
}> {
  const prompt = `Generate a personalized cold outreach email for:

Company: ${companyName}
Contact: ${contactName || 'there'}
Company Info: ${companyInfo}
Suggested Services: ${suggestedServices.join(', ')}
Value Propositions: ${proposalPoints.join('; ')}

About Outrinsic:
- We provide AI MVP development and operational services
- We have skilled resources in India and Indonesia
- We offer 60-70% cost savings compared to local hiring
- Services include: customer support, social media, content, lead generation, payment verification, community management

Guidelines:
- Keep it short (under 150 words)
- Be conversational and authentic, not salesy
- Reference something specific about their company
- Clear CTA to schedule a call
- Professional but friendly tone

Return JSON with "subject" and "body" (HTML formatted). Return ONLY valid JSON.`

  const response = await callDeepSeek([
    {
      role: 'system',
      content: 'You are an expert cold email copywriter. Write personalized, high-converting outreach emails. Always respond with valid JSON only.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], 0.7)

  try {
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanedResponse)
  } catch {
    return {
      subject: `Partnership opportunity for ${companyName}`,
      body: `<p>Hi ${contactName || 'there'},</p>
<p>I came across ${companyName} and was impressed by what you're building.</p>
<p>At Outrinsic, we help Scandinavian startups scale their operations cost-effectively with our talented teams in India and Indonesia.</p>
<p>We specialize in: ${suggestedServices.slice(0, 2).join(' and ')}.</p>
<p>Would you be open to a quick 15-minute call to explore if we could help ${companyName}?</p>
<p>Best regards,<br/>Outrinsic Team</p>`,
    }
  }
}

// Analyze lead and provide sales insights
export async function analyzeLead(
  firstName: string,
  lastName: string,
  companyName: string,
  jobTitle: string,
  email: string,
  notes: string,
  companyInfo: string
): Promise<{
  summary: string
  recommendedApproach: string
  talkingPoints: string[]
  objectionHandling: string[]
  nextSteps: string[]
}> {
  const prompt = `Analyze this lead and provide sales insights:

Contact: ${firstName} ${lastName}
Title: ${jobTitle || 'Unknown'}
Company: ${companyName || 'Unknown'}
Email: ${email || 'Not provided'}
Notes: ${notes || 'None'}
Company Info: ${companyInfo || 'No additional info'}

Outrinsic offers operational services (customer support, social media, content, lead gen) with resources in India & Indonesia at 60-70% cost savings.

Provide JSON with:
1. "summary": 2-3 sentence lead profile
2. "recommendedApproach": Best way to approach this person
3. "talkingPoints": Array of 3-4 specific talking points
4. "objectionHandling": Array of 2-3 likely objections and responses
5. "nextSteps": Array of recommended next actions

Return ONLY valid JSON.`

  const response = await callDeepSeek([
    {
      role: 'system',
      content: 'You are a sales coach and lead analyst. Provide actionable insights for B2B sales. Always respond with valid JSON only.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], 0.6)

  try {
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanedResponse)
  } catch {
    return {
      summary: `${firstName} ${lastName} at ${companyName} - potential prospect for our services.`,
      recommendedApproach: 'Reach out with a personalized message highlighting cost savings and scalability.',
      talkingPoints: [
        'Cost savings of 60-70% compared to local hiring',
        'Skilled, dedicated team members',
        'Quick ramp-up time (1-2 weeks)',
      ],
      objectionHandling: [
        'Quality concerns: Our teams are trained and monitored for quality',
        'Communication: We work in overlapping hours and use async tools',
      ],
      nextSteps: [
        'Send personalized outreach email',
        'Connect on LinkedIn',
        'Schedule discovery call',
      ],
    }
  }
}

// Scrape and summarize company from URL
export async function summarizeCompanyFromContent(
  companyName: string,
  websiteContent: string
): Promise<{
  description: string
  industry: string
  services: string[]
  targetMarket: string
  companySize: string
  relevantServices: string[]
}> {
  const prompt = `Analyze this company website content and extract information:

Company: ${companyName}
Website Content:
${websiteContent.slice(0, 4000)}

Extract and return JSON with:
1. "description": What the company does (2-3 sentences)
2. "industry": Primary industry/sector
3. "services": Array of their products/services
4. "targetMarket": Who they serve
5. "companySize": Estimated size (startup, small, medium, large)
6. "relevantServices": Which of our services would help them (from: Social Media Management, Lead Generation, Content Generation, Customer Support, Payment Verification, Community Management, Data Entry, Virtual Assistant)

Return ONLY valid JSON.`

  const response = await callDeepSeek([
    {
      role: 'system',
      content: 'You are a business analyst. Extract structured information from company websites. Always respond with valid JSON only.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], 0.3)

  try {
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanedResponse)
  } catch {
    return {
      description: 'Unable to analyze company at this time.',
      industry: 'Unknown',
      services: [],
      targetMarket: 'Unknown',
      companySize: 'Unknown',
      relevantServices: ['Customer Support & Ticket Management', 'Social Media Management'],
    }
  }
}

