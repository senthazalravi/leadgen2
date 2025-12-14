import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { generatePersonalizedEmail, analyzeCompanyAndSuggestServices } from '@/lib/deepseek'

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

    // Get or generate company analysis
    let suggestedServices: string[] = []
    let proposalPoints: string[] = []
    let companyInfo = lead.company?.description || lead.notes || ''

    if (lead.company?.rawData) {
      try {
        const rawData = JSON.parse(lead.company.rawData)
        if (rawData.aiAnalysis) {
          suggestedServices = rawData.aiAnalysis.suggestedServices || []
          proposalPoints = rawData.aiAnalysis.proposalPoints || []
        }
      } catch {}
    }

    // If no analysis exists, generate one
    if (suggestedServices.length === 0) {
      const analysis = await analyzeCompanyAndSuggestServices(
        lead.companyName || 'Unknown Company',
        companyInfo,
        lead.company?.industry,
        lead.company?.website || undefined
      )
      suggestedServices = analysis.suggestedServices
      proposalPoints = analysis.proposalPoints
      companyInfo = analysis.summary
    }

    // Generate personalized email
    const email = await generatePersonalizedEmail(
      lead.companyName || 'your company',
      lead.firstName || '',
      companyInfo,
      suggestedServices,
      proposalPoints
    )

    return NextResponse.json({
      success: true,
      email,
    })
  } catch (error: any) {
    console.error('Email generation error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}

