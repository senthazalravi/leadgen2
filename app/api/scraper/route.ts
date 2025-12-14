import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { url, jobType } = await request.json()

    // Create scraping job
    const job = await prisma.scrapingJob.create({
      data: {
        url,
        jobType: jobType || 'general',
        status: 'running',
        startedAt: new Date(),
      },
    })

    // Start scraping in background (non-blocking)
    scrapeInBackground(job.id, url, jobType || 'general')

    return NextResponse.json(job)
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json({ error: 'Failed to start scraping' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const jobs = await prisma.scrapingJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(jobs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

// Simple HTML text extraction without cheerio
function extractText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

// Extract title from HTML
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : ''
}

// Extract links matching pattern
function extractLinks(html: string, pattern: RegExp): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = []
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    if (pattern.test(match[1])) {
      links.push({ href: match[1], text: match[2].trim() })
    }
  }
  return links
}

async function scrapeInBackground(jobId: number, url: string, jobType: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    
    const html = await response.text()

    let companiesFound = 0
    let emailsFound = 0

    if (jobType === 'thehub') {
      // Find company links using regex
      const companyLinks = extractLinks(html, /\/companies\/|\/startups\//)

      // Remove duplicates by URL
      const uniqueCompanies = Array.from(
        new Map(companyLinks.map((c) => [c.href, c])).values()
      ).filter(c => c.text && c.text.length > 2).slice(0, 30)

      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: { totalItems: uniqueCompanies.length },
      })

      for (const company of uniqueCompanies) {
        try {
          const fullUrl = company.href.startsWith('http') 
            ? company.href 
            : `https://thehub.se${company.href}`

          // Determine country from URL
          let country = 'Sweden'
          if (url.includes('/norway') || company.href.includes('/norway')) country = 'Norway'
          if (url.includes('/denmark') || company.href.includes('/denmark')) country = 'Denmark'
          if (url.includes('/finland') || company.href.includes('/finland')) country = 'Finland'

          // Check if company exists
          const existingCompany = await prisma.company.findFirst({
            where: { name: company.text },
          })

          if (!existingCompany) {
            const newCompany = await prisma.company.create({
              data: {
                name: company.text,
                sourceUrl: fullUrl,
                country,
                scrapedAt: new Date(),
              },
            })

            // Create a lead for the company
            await prisma.lead.create({
              data: {
                companyId: newCompany.id,
                companyName: newCompany.name,
                source: 'thehub.se',
                notes: `Scraped from ${fullUrl}`,
              },
            })

            companiesFound++
          }

          await prisma.scrapingJob.update({
            where: { id: jobId },
            data: { itemsScraped: companiesFound },
          })
        } catch (e) {
          console.error('Error processing company:', e)
        }
      }
    } else {
      // General scraping - extract emails and company info
      const text = extractText(html)
      
      // Find emails using regex
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g
      const emailMatches = text.match(emailRegex) || []
      const emails = Array.from(new Set(emailMatches))
      emailsFound = emails.length

      // Get title as company name
      const title = extractTitle(html) || new URL(url).hostname

      // Find phone numbers
      const phoneRegex = /[\+]?[(]?[0-9]{1,3}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}/g
      const phones = text.match(phoneRegex) || []

      // Find LinkedIn link
      const linkedinMatch = html.match(/href=["']([^"']*linkedin\.com[^"']*)["']/i)

      // Create company
      const company = await prisma.company.create({
        data: {
          name: title.slice(0, 255),
          website: url,
          sourceUrl: url,
          email: emails[0] || null,
          phone: phones[0] || null,
          linkedinUrl: linkedinMatch ? linkedinMatch[1] : null,
          description: text.slice(0, 2000),
          scrapedAt: new Date(),
        },
      })

      companiesFound = 1

      // Create leads for each email
      for (const email of emails.slice(0, 10)) {
        await prisma.lead.create({
          data: {
            companyId: company.id,
            companyName: company.name,
            email,
            source: 'web_scrape',
            notes: `Scraped from ${url}`,
          },
        })
      }
    }

    // Complete the job
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        itemsScraped: companiesFound,
        resultSummary: JSON.stringify({
          companiesFound,
          emailsFound,
        }),
      },
    })
  } catch (error: any) {
    console.error('Scraping failed:', error)
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message,
      },
    })
  }
}
