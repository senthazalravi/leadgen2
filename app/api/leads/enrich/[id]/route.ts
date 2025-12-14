import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import OpenAI from 'openai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 400 })
  }

  try {
    const { id } = await params
    const lead = await prisma.lead.findUnique({
      where: { id: parseInt(id) },
      include: { company: true },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const openai = new OpenAI({ apiKey })

    const context = `
      Name: ${lead.firstName || ''} ${lead.lastName || ''}
      Company: ${lead.companyName || ''}
      Job Title: ${lead.jobTitle || ''}
      Email: ${lead.email || ''}
      Source: ${lead.source || ''}
      Notes: ${lead.notes || ''}
      Company Description: ${lead.company?.description || ''}
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a sales expert. Analyze this lead and provide:
1. A brief summary of the lead (2-3 sentences)
2. Recommended approach for outreach (3-4 bullet points)

Format your response as JSON with keys: summary, recommendedApproach`,
        },
        {
          role: 'user',
          content: context,
        },
      ],
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content || ''
    
    let summary = ''
    let recommendedApproach = ''

    try {
      const data = JSON.parse(content)
      summary = data.summary || ''
      recommendedApproach = typeof data.recommendedApproach === 'string' 
        ? data.recommendedApproach 
        : JSON.stringify(data.recommendedApproach)
    } catch {
      summary = content
    }

    await prisma.lead.update({
      where: { id: parseInt(id) },
      data: {
        aiSummary: summary,
        aiRecommendedApproach: recommendedApproach,
      },
    })

    return NextResponse.json({
      success: true,
      aiSummary: summary,
      aiRecommendedApproach: recommendedApproach,
    })
  } catch (error: any) {
    console.error('AI enrichment error:', error)
    return NextResponse.json({ error: 'AI enrichment failed' }, { status: 500 })
  }
}

