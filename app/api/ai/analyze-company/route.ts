import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { analyzeCompanyAndSuggestServices } from '@/lib/deepseek'

// Simple HTML text extraction without cheerio
function extractText(html: string): string {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { companyId } = await request.json()

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Try to fetch website content if we have a URL
    let websiteContent = ''
    if (company.website || company.sourceUrl) {
      try {
        const url = company.website || company.sourceUrl!
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        })
        const html = await response.text()
        websiteContent = extractText(html).slice(0, 5000)
      } catch (e) {
        console.error('Failed to fetch website:', e)
      }
    }

    // Analyze the company
    const analysis = await analyzeCompanyAndSuggestServices(
      company.name,
      company.description || websiteContent,
      company.industry || undefined,
      company.website || company.sourceUrl || undefined
    )

    // Update company with AI analysis
    await prisma.company.update({
      where: { id: companyId },
      data: {
        rawData: JSON.stringify({
          aiAnalysis: analysis,
          analyzedAt: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 })
  }
}
