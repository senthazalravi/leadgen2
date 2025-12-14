import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import * as cheerio from 'cheerio'

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

    // Start scraping in background
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

async function scrapeInBackground(jobId: number, url: string, jobType: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    
    const html = await response.text()
    const $ = cheerio.load(html)

    let companiesFound = 0
    let emailsFound = 0

    if (jobType === 'thehub') {
      // Find company links
      const companyLinks: { name: string; url: string }[] = []
      
      $('a[href*="/companies/"], a[href*="/startups/"]').each((_, el) => {
        const href = $(el).attr('href')
        const name = $(el).text().trim()
        if (href && name && name.length > 2) {
          const fullUrl = href.startsWith('http') ? href : `https://thehub.se${href}`
          companyLinks.push({ name, url: fullUrl })
        }
      })

      // Remove duplicates
      const uniqueCompanies = Array.from(
        new Map(companyLinks.map((c) => [c.url, c])).values()
      ).slice(0, 30)

      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: { totalItems: uniqueCompanies.length },
      })

      for (const company of uniqueCompanies) {
        try {
          // Determine country
          let country = 'Sweden'
          if (url.includes('/norway') || company.url.includes('/norway')) country = 'Norway'
          if (url.includes('/denmark') || company.url.includes('/denmark')) country = 'Denmark'
          if (url.includes('/finland') || company.url.includes('/finland')) country = 'Finland'

          // Create company
          const existingCompany = await prisma.company.findFirst({
            where: { name: company.name },
          })

          if (!existingCompany) {
            const newCompany = await prisma.company.create({
              data: {
                name: company.name,
                sourceUrl: company.url,
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
                notes: `Scraped from ${company.url}`,
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
      const text = $('body').text()
      
      // Find emails
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g
      const emails = [...new Set(text.match(emailRegex) || [])]
      emailsFound = emails.length

      // Get title as company name
      const title = $('title').text().trim() || new URL(url).hostname

      // Find phone numbers
      const phoneRegex = /[\+]?[(]?[0-9]{1,3}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}/g
      const phones = text.match(phoneRegex) || []

      // Find LinkedIn
      const linkedinLink = $('a[href*="linkedin.com"]').attr('href')

      // Create company
      const company = await prisma.company.create({
        data: {
          name: title.slice(0, 255),
          website: url,
          sourceUrl: url,
          email: emails[0] || null,
          phone: phones[0] || null,
          linkedinUrl: linkedinLink || null,
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

