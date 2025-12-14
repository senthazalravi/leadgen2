import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { callDeepSeek } from '@/lib/deepseek'

// Extract text from HTML
function extractText(html: string): string {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

// Search the web for company information
async function searchCompanyInfo(companyName: string, website?: string | null): Promise<{
  ceo: string | null
  founders: string[]
  contacts: { name: string; title: string; email?: string; linkedin?: string }[]
  emails: string[]
  phones: string[]
  linkedinUrl: string | null
  twitterUrl: string | null
  description: string | null
  industry: string | null
  employeeCount: string | null
  fundingInfo: string | null
  headquarters: string | null
}> {
  const result = {
    ceo: null as string | null,
    founders: [] as string[],
    contacts: [] as { name: string; title: string; email?: string; linkedin?: string }[],
    emails: [] as string[],
    phones: [] as string[],
    linkedinUrl: null as string | null,
    twitterUrl: null as string | null,
    description: null as string | null,
    industry: null as string | null,
    employeeCount: null as string | null,
    fundingInfo: null as string | null,
    headquarters: null as string | null,
  }

  const urlsToSearch: string[] = []

  // If we have a website, search it
  if (website) {
    urlsToSearch.push(website)
    // Try common pages
    const baseUrl = website.replace(/\/$/, '')
    urlsToSearch.push(`${baseUrl}/about`)
    urlsToSearch.push(`${baseUrl}/about-us`)
    urlsToSearch.push(`${baseUrl}/team`)
    urlsToSearch.push(`${baseUrl}/contact`)
  }

  // Search TheHub.io for the company
  const searchName = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  urlsToSearch.push(`https://thehub.io/startups/${searchName}`)

  // Collect all text from pages
  let allText = ''
  let allHtml = ''

  for (const url of urlsToSearch) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(5000),
      })
      
      if (response.ok) {
        const html = await response.text()
        allHtml += html + '\n'
        allText += extractText(html) + '\n'
      }
    } catch (e) {
      // Continue with other URLs
    }
  }

  // Extract emails
  const emailRegex = /[\w.-]+@[\w.-]+\.[a-z]{2,}/gi
  const emailMatches = allText.match(emailRegex) || []
  result.emails = Array.from(new Set(
    emailMatches.filter(e => 
      !e.includes('example.') && 
      !e.includes('@sentry') &&
      !e.includes('webpack') &&
      !e.includes('@wix') &&
      e.length < 100
    )
  )).slice(0, 10)

  // Extract phones
  const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{0,4}/g
  const phoneMatches = allText.match(phoneRegex) || []
  result.phones = Array.from(new Set(
    phoneMatches.filter(p => p.replace(/\D/g, '').length >= 8 && p.replace(/\D/g, '').length <= 15)
  )).slice(0, 5)

  // Extract LinkedIn company page
  const linkedinMatch = allHtml.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[^"'\s]+)["']/i)
  if (linkedinMatch) {
    result.linkedinUrl = linkedinMatch[1]
  }

  // Extract Twitter
  const twitterMatch = allHtml.match(/href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'\s]+)["']/i)
  if (twitterMatch) {
    result.twitterUrl = twitterMatch[1]
  }

  // Extract CEO/Founder patterns
  const ceoPatterns = [
    /(?:CEO|Chief Executive Officer)[:\s]*([A-Z][a-z]+ [A-Z][a-z]+)/gi,
    /([A-Z][a-z]+ [A-Z][a-z]+)[,\s]+(?:CEO|Chief Executive Officer)/gi,
  ]
  for (const pattern of ceoPatterns) {
    const match = pattern.exec(allText)
    if (match) {
      result.ceo = match[1].trim()
      break
    }
  }

  // Extract founders
  const founderPatterns = [
    /(?:Founder|Co-founder|Co-Founder)[:\s]*([A-Z][a-z]+ [A-Z][a-z]+)/gi,
    /([A-Z][a-z]+ [A-Z][a-z]+)[,\s]+(?:Founder|Co-founder)/gi,
  ]
  for (const pattern of founderPatterns) {
    let match
    while ((match = pattern.exec(allText)) !== null) {
      const name = match[1].trim()
      if (!result.founders.includes(name)) {
        result.founders.push(name)
      }
    }
  }

  // Extract description from meta tags
  const descMatch = allHtml.match(/<meta[^>]+(?:name=["']description["']|property=["']og:description["'])[^>]+content=["']([^"']+)["']/i)
  if (descMatch) {
    result.description = descMatch[1]
  }

  // Extract employee count
  const empMatch = allText.match(/(\d+(?:\s*-\s*\d+)?)\s*(?:employees|team members|people)/i)
  if (empMatch) {
    result.employeeCount = empMatch[1].replace(/\s/g, '')
  }

  // Extract funding info
  const fundingMatch = allText.match(/(?:raised|funding|series [a-c]|seed)[:\s]*\$?(\d+(?:\.\d+)?)\s*(?:million|m|k)?/i)
  if (fundingMatch) {
    result.fundingInfo = fundingMatch[0]
  }

  return result
}

// Use AI to analyze and extract structured information
async function analyzeWithAI(
  companyName: string,
  webData: string,
  existingInfo: { email?: string; phone?: string; notes?: string }
): Promise<{
  ceo: string | null
  ceoEmail: string | null
  ceoLinkedin: string | null
  contacts: { name: string; title: string; email?: string }[]
  companyInsights: string
  recommendedApproach: string
  talkingPoints: string[]
}> {
  const prompt = `Analyze this company information and extract key contacts:

Company: ${companyName}
Existing Email: ${existingInfo.email || 'None'}
Existing Phone: ${existingInfo.phone || 'None'}
Notes: ${existingInfo.notes || 'None'}

Web Research Data:
${webData.slice(0, 4000)}

Extract and return JSON with:
1. "ceo": CEO/Founder name if found
2. "ceoEmail": CEO email if found (or likely pattern like firstname@company.com)
3. "ceoLinkedin": CEO LinkedIn URL if found
4. "contacts": Array of {name, title, email} for key decision makers
5. "companyInsights": Brief company summary (2-3 sentences)
6. "recommendedApproach": How to approach this company for B2B services
7. "talkingPoints": Array of 3-5 talking points for outreach

Return ONLY valid JSON.`

  try {
    const response = await callDeepSeek([
      { role: 'system', content: 'You are a B2B sales research assistant. Extract contact information and provide sales insights. Always return valid JSON.' },
      { role: 'user', content: prompt },
    ], 0.3)

    const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanedResponse)
  } catch (e) {
    return {
      ceo: null,
      ceoEmail: null,
      ceoLinkedin: null,
      contacts: [],
      companyInsights: 'Unable to analyze company information.',
      recommendedApproach: 'Standard B2B outreach recommended.',
      talkingPoints: ['Introduce Outrinsic services', 'Highlight cost savings', 'Offer free consultation'],
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Step 1: Search the web for company information
    const webData = await searchCompanyInfo(
      lead.companyName || lead.company?.name || '',
      lead.company?.website || lead.company?.sourceUrl
    )

    // Step 2: Use AI to analyze and structure the information
    const webDataText = `
CEO: ${webData.ceo || 'Not found'}
Founders: ${webData.founders.join(', ') || 'Not found'}
Emails found: ${webData.emails.join(', ') || 'None'}
Phones found: ${webData.phones.join(', ') || 'None'}
LinkedIn: ${webData.linkedinUrl || 'Not found'}
Twitter: ${webData.twitterUrl || 'Not found'}
Description: ${webData.description || 'Not found'}
Employees: ${webData.employeeCount || 'Unknown'}
Funding: ${webData.fundingInfo || 'Unknown'}
`

    const aiAnalysis = await analyzeWithAI(
      lead.companyName || lead.company?.name || 'Unknown',
      webDataText,
      { email: lead.email ?? undefined, phone: lead.phone ?? undefined, notes: lead.notes ?? undefined }
    )

    // Step 3: Update the lead with enriched data
    const updateData: any = {
      aiSummary: aiAnalysis.companyInsights,
      aiRecommendedApproach: JSON.stringify({
        approach: aiAnalysis.recommendedApproach,
        talkingPoints: aiAnalysis.talkingPoints,
        ceo: aiAnalysis.ceo || webData.ceo,
        ceoEmail: aiAnalysis.ceoEmail,
        ceoLinkedin: aiAnalysis.ceoLinkedin,
        contacts: aiAnalysis.contacts,
      }),
    }

    // Update email if we found one and lead doesn't have one
    if (!lead.email && (webData.emails[0] || aiAnalysis.ceoEmail)) {
      updateData.email = aiAnalysis.ceoEmail || webData.emails[0]
    }

    // Update phone if we found one and lead doesn't have one
    if (!lead.phone && webData.phones[0]) {
      updateData.phone = webData.phones[0]
    }

    // Update LinkedIn if found
    if (webData.linkedinUrl && !lead.linkedinUrl) {
      updateData.linkedinUrl = webData.linkedinUrl
    }

    await prisma.lead.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    // Also update company if we found new info
    if (lead.company) {
      const companyUpdate: any = {}
      if (!lead.company.email && webData.emails[0]) {
        companyUpdate.email = webData.emails[0]
      }
      if (!lead.company.phone && webData.phones[0]) {
        companyUpdate.phone = webData.phones[0]
      }
      if (!lead.company.linkedinUrl && webData.linkedinUrl) {
        companyUpdate.linkedinUrl = webData.linkedinUrl
      }
      if (!lead.company.twitterUrl && webData.twitterUrl) {
        companyUpdate.twitterUrl = webData.twitterUrl
      }
      if (!lead.company.description && webData.description) {
        companyUpdate.description = webData.description
      }
      if (!lead.company.employeeCount && webData.employeeCount) {
        companyUpdate.employeeCount = webData.employeeCount
      }

      if (Object.keys(companyUpdate).length > 0) {
        await prisma.company.update({
          where: { id: lead.company.id },
          data: companyUpdate,
        })
      }
    }

    return NextResponse.json({
      success: true,
      enrichedData: {
        ceo: aiAnalysis.ceo || webData.ceo,
        ceoEmail: aiAnalysis.ceoEmail,
        ceoLinkedin: aiAnalysis.ceoLinkedin,
        contacts: aiAnalysis.contacts,
        emails: webData.emails,
        phones: webData.phones,
        linkedinUrl: webData.linkedinUrl,
        twitterUrl: webData.twitterUrl,
        employeeCount: webData.employeeCount,
        fundingInfo: webData.fundingInfo,
      },
      aiSummary: aiAnalysis.companyInsights,
      recommendedApproach: aiAnalysis.recommendedApproach,
      talkingPoints: aiAnalysis.talkingPoints,
    })
  } catch (error: any) {
    console.error('AI enrichment error:', error)
    return NextResponse.json({ error: error.message || 'AI enrichment failed' }, { status: 500 })
  }
}
