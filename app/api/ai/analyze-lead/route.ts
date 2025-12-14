import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { analyzeLead } from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { leadId } = await request.json()

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { company: true },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get company analysis if available
    let companyInfo = ''
    if (lead.company) {
      companyInfo = lead.company.description || ''
      if (lead.company.rawData) {
        try {
          const rawData = JSON.parse(lead.company.rawData)
          if (rawData.aiAnalysis) {
            companyInfo += '\n' + JSON.stringify(rawData.aiAnalysis)
          }
        } catch {}
      }
    }

    // Analyze the lead
    const analysis = await analyzeLead(
      lead.firstName || '',
      lead.lastName || '',
      lead.companyName || '',
      lead.jobTitle || '',
      lead.email || '',
      lead.notes || '',
      companyInfo
    )

    // Update lead with AI analysis
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        aiSummary: analysis.summary,
        aiRecommendedApproach: JSON.stringify({
          approach: analysis.recommendedApproach,
          talkingPoints: analysis.talkingPoints,
          objectionHandling: analysis.objectionHandling,
          nextSteps: analysis.nextSteps,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    console.error('Lead analysis error:', error)
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 })
  }
}

