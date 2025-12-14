import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

// Pre-built email templates for Outrinsic services
const DEFAULT_TEMPLATES = [
  {
    name: 'Customer Support Outreach',
    subject: 'Scale your support team with 70% cost savings - {{company}}',
    body: `<p>Hi {{first_name}},</p>

<p>I noticed {{company}} is growing fast - congratulations! 🎉</p>

<p>As you scale, customer support often becomes a bottleneck. We help Scandinavian startups like yours build dedicated support teams in India and Indonesia at <strong>60-70% lower costs</strong> than local hiring.</p>

<p>Our teams handle:</p>
<ul>
<li>24/7 ticket management & resolution</li>
<li>Live chat support</li>
<li>Email support & escalation</li>
<li>Refund & payment verification</li>
</ul>

<p>Would you be open to a quick 15-minute call to explore if this could work for {{company}}?</p>

<p>Best regards,<br/>
The Outrinsic Team</p>`,
    isDefault: true,
  },
  {
    name: 'Social Media Management',
    subject: 'Professional social media management for {{company}}',
    body: `<p>Hi {{first_name}},</p>

<p>I've been following {{company}}'s journey and love what you're building!</p>

<p>Managing social media while running a growing startup is challenging. Our dedicated social media teams can take this off your plate:</p>

<ul>
<li>Daily content creation & posting</li>
<li>Community engagement & responses</li>
<li>Analytics & monthly reporting</li>
<li>Influencer outreach coordination</li>
</ul>

<p>We work with startups across Sweden, Norway, Denmark, and Finland - delivering quality work at <strong>70% less than European agencies</strong>.</p>

<p>Would you like to see some examples of our work?</p>

<p>Cheers,<br/>
Outrinsic Team</p>`,
    isDefault: false,
  },
  {
    name: 'Content Generation Pitch',
    subject: 'AI-powered content at scale for {{company}}',
    body: `<p>Hi {{first_name}},</p>

<p>Content is king, but creating it consistently is tough when you're busy building {{company}}.</p>

<p>We combine <strong>AI with skilled writers</strong> to deliver:</p>
<ul>
<li>SEO-optimized blog posts (4-8 per month)</li>
<li>LinkedIn content & thought leadership</li>
<li>Newsletter creation</li>
<li>Product documentation</li>
</ul>

<p>Our hybrid approach means faster turnaround at a fraction of the cost.</p>

<p>Interested in seeing samples relevant to your industry?</p>

<p>Best,<br/>
Outrinsic Team</p>`,
    isDefault: false,
  },
  {
    name: 'Lead Generation Services',
    subject: 'Qualified leads for {{company}} - let us fill your pipeline',
    body: `<p>Hi {{first_name}},</p>

<p>Growing the sales pipeline while managing product and operations is the classic founder's dilemma.</p>

<p>At Outrinsic, we help B2B companies like {{company}} with:</p>
<ul>
<li>Prospect research & list building</li>
<li>Email outreach campaigns</li>
<li>LinkedIn prospecting</li>
<li>Lead qualification & CRM management</li>
</ul>

<p>Our team in Indonesia works in your timezone overlap and delivers <strong>50-100 qualified leads per month</strong>.</p>

<p>Would you like to discuss how we could help {{company}} grow?</p>

<p>Best regards,<br/>
Outrinsic Team</p>`,
    isDefault: false,
  },
  {
    name: 'Full Service Outsourcing',
    subject: 'Scale {{company}} with our offshore team',
    body: `<p>Hi {{first_name}},</p>

<p>Scaling a startup in Scandinavia comes with high operational costs. What if you could access talented, dedicated team members at 60-70% lower costs?</p>

<p>Outrinsic provides <strong>full-service operational support</strong> from India and Indonesia:</p>

<ul>
<li>🎧 Customer Support & Ticket Management</li>
<li>📱 Social Media & Community Management</li>
<li>✍️ Content Creation & Marketing</li>
<li>💰 Payment Verification & Refunds</li>
<li>📊 Data Entry & Admin Support</li>
</ul>

<p>We already work with startups from Sweden, Norway, Denmark, and Finland.</p>

<p>Could I share a case study relevant to {{company}}?</p>

<p>Cheers,<br/>
Outrinsic Team</p>`,
    isDefault: false,
  },
  {
    name: 'Payment & Refund Management',
    subject: 'Streamline payment operations for {{company}}',
    body: `<p>Hi {{first_name}},</p>

<p>Payment verification and refund processing often takes more time than it should - especially as you scale.</p>

<p>Our dedicated operations team can handle:</p>
<ul>
<li>Payment verification & fraud checks</li>
<li>Refund processing & documentation</li>
<li>Chargeback management</li>
<li>Invoice reconciliation</li>
</ul>

<p>This frees up your core team to focus on what matters - building {{company}}.</p>

<p>Worth a conversation?</p>

<p>Best,<br/>
Outrinsic Team</p>`,
    isDefault: false,
  },
  {
    name: 'Forum & Community Management',
    subject: 'Build a thriving community for {{company}}',
    body: `<p>Hi {{first_name}},</p>

<p>A strong community can be a major competitive advantage. But building and moderating one takes significant effort.</p>

<p>Our community management team offers:</p>
<ul>
<li>Forum moderation & engagement</li>
<li>User onboarding support</li>
<li>Content seeding & discussions</li>
<li>Community analytics & insights</li>
</ul>

<p>We've helped startups grow active communities from zero to thousands of engaged members.</p>

<p>Would you like to explore this for {{company}}?</p>

<p>Cheers,<br/>
Outrinsic Team</p>`,
    isDefault: false,
  },
  {
    name: 'Quick Introduction',
    subject: 'Quick question for {{first_name}} at {{company}}',
    body: `<p>Hi {{first_name}},</p>

<p>I'll keep this brief - I know you're busy building {{company}}.</p>

<p>We help Scandinavian startups reduce operational costs by 60-70% through skilled offshore teams in India and Indonesia.</p>

<p>Services include customer support, social media, content, and more.</p>

<p>Worth a 10-minute call to see if there's a fit?</p>

<p>Best,<br/>
Outrinsic Team</p>`,
    isDefault: false,
  },
]

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if templates already exist
    const existingCount = await prisma.emailTemplate.count()
    
    if (existingCount > 0) {
      return NextResponse.json({ 
        message: 'Templates already exist',
        count: existingCount 
      })
    }

    // Create default templates
    await prisma.emailTemplate.createMany({
      data: DEFAULT_TEMPLATES,
    })

    return NextResponse.json({ 
      success: true,
      message: `Created ${DEFAULT_TEMPLATES.length} email templates`,
      count: DEFAULT_TEMPLATES.length
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Return available services info
  return NextResponse.json({
    services: [
      {
        id: 'customerSupport',
        name: 'Customer Support & Ticket Management',
        description: '24/7 support, ticket resolution, live chat, email support',
        costSavings: '60-70%',
      },
      {
        id: 'socialMedia',
        name: 'Social Media Management',
        description: 'Content creation, posting, engagement, analytics',
        costSavings: '70%',
      },
      {
        id: 'content',
        name: 'Content Generation',
        description: 'Blog posts, newsletters, documentation, SEO content',
        costSavings: '65%',
      },
      {
        id: 'leadGen',
        name: 'Lead Generation',
        description: 'Prospect research, email outreach, LinkedIn, CRM management',
        costSavings: '70%',
      },
      {
        id: 'payment',
        name: 'Payment & Refund Management',
        description: 'Payment verification, refunds, chargebacks, invoicing',
        costSavings: '60%',
      },
      {
        id: 'community',
        name: 'Community & Forum Management',
        description: 'Forum moderation, user engagement, community growth',
        costSavings: '65%',
      },
    ],
    locations: ['India', 'Indonesia'],
    benefits: [
      '60-70% cost savings vs local hiring',
      'Skilled, trained team members',
      'Quick 1-2 week ramp-up',
      'Timezone overlap for Scandinavian markets',
      'Dedicated team members (not shared)',
    ],
  })
}

