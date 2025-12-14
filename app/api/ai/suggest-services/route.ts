import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { OUTRINSIC_SERVICES, callDeepSeek } from '@/lib/deepseek'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { companyName, description, industry } = await request.json()

    const servicesInfo = Object.entries(OUTRINSIC_SERVICES)
      .map(([key, service]) => `${key}: ${service.name} - ${service.description}`)
      .join('\n')

    const prompt = `Based on this company, rank our services by relevance:

Company: ${companyName}
Industry: ${industry || 'Unknown'}
Description: ${description}

Our services:
${servicesInfo}

Return a JSON array of objects with "service" (service key), "relevance" (1-10), and "reason" (why it's relevant).
Order by relevance descending. Return top 5 services.
Return ONLY valid JSON array.`

    const response = await callDeepSeek([
      { role: 'system', content: 'You are a B2B sales strategist. Analyze companies and match them with relevant services. Respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ], 0.4)

    let suggestions
    try {
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
      suggestions = JSON.parse(cleanedResponse)
    } catch {
      suggestions = [
        { service: 'customerSupport', relevance: 8, reason: 'Most startups need scalable support' },
        { service: 'socialMedia', relevance: 7, reason: 'Growing brand presence is crucial' },
        { service: 'contentManagement', relevance: 7, reason: 'Content helps with growth' },
      ]
    }

    // Enrich with full service details
    const enrichedSuggestions = suggestions.map((s: any) => ({
      ...s,
      serviceDetails: OUTRINSIC_SERVICES[s.service as keyof typeof OUTRINSIC_SERVICES] || null,
    }))

    return NextResponse.json({
      success: true,
      suggestions: enrichedSuggestions,
    })
  } catch (error: any) {
    console.error('Service suggestion error:', error)
    return NextResponse.json({ error: error.message || 'Suggestion failed' }, { status: 500 })
  }
}

