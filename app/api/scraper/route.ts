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

// Simple HTML text extraction
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

// Extract title from HTML
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : ''
}

// Extract all hrefs matching pattern
function extractHrefs(html: string, pattern: RegExp): string[] {
  const hrefs: string[] = []
  // Match href attributes in anchor tags
  const hrefRegex = /href=["']([^"']+)["']/gi
  let match
  while ((match = hrefRegex.exec(html)) !== null) {
    if (pattern.test(match[1])) {
      hrefs.push(match[1])
    }
  }
  return hrefs
}

// Extract company name from URL slug
function extractCompanyNameFromUrl(url: string): string {
  // Get the last path segment and convert to title case
  const parts = url.replace(/\/$/, '').split('/')
  const slug = parts[parts.length - 1]
  return slug
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Fetch and extract company details from a company page
async function fetchCompanyDetails(url: string): Promise<{
  name: string
  description: string | null
  email: string | null
  phone: string | null
  website: string | null
  industry: string | null
  employeeCount: string | null
  linkedinUrl: string | null
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })
    
    if (!response.ok) {
      return { name: extractCompanyNameFromUrl(url), description: null, email: null, phone: null, website: null, industry: null, employeeCount: null, linkedinUrl: null }
    }
    
    const html = await response.text()
    const text = extractText(html)
    
    // Extract company name from h1 or title
    let name = extractCompanyNameFromUrl(url)
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    if (h1Match) {
      name = h1Match[1].trim()
    }
    
    // Extract description from meta or first paragraph
    let description = null
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    if (metaDesc) {
      description = metaDesc[1]
    } else {
      const pMatch = html.match(/<p[^>]*>([^<]{50,500})<\/p>/i)
      if (pMatch) {
        description = pMatch[1].trim()
      }
    }
    
    // Extract emails
    const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/g
    const emailMatches = text.match(emailRegex) || []
    const validEmails = emailMatches.filter(e => 
      !e.includes('example.') && 
      !e.includes('@sentry') &&
      !e.includes('webpack')
    )
    const email = validEmails[0] || null
    
    // Extract phone
    const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{0,4}/g
    const phones = text.match(phoneRegex) || []
    const validPhones = phones.filter(p => p.replace(/\D/g, '').length >= 8)
    const phone = validPhones[0] || null
    
    // Extract website
    let website = null
    const websiteMatch = html.match(/href=["'](https?:\/\/(?!thehub|linkedin|twitter|facebook|instagram)[^"']+)["'][^>]*>(?:[^<]*(?:website|visit|homepage)[^<]*)/i)
    if (websiteMatch) {
      website = websiteMatch[1]
    }
    
    // Extract LinkedIn
    const linkedinMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[^"']+)["']/i)
    const linkedinUrl = linkedinMatch ? linkedinMatch[1] : null
    
    // Try to extract industry
    let industry = null
    const industryMatch = html.match(/(?:industry|sector|category)[:\s]*([A-Za-z\s&]+)/i)
    if (industryMatch) {
      industry = industryMatch[1].trim().slice(0, 100)
    }
    
    // Try to extract employee count
    let employeeCount = null
    const empMatch = text.match(/(\d+(?:-\d+)?)\s*(?:employees|team members|people)/i)
    if (empMatch) {
      employeeCount = empMatch[1]
    }
    
    return { name, description, email, phone, website, industry, employeeCount, linkedinUrl }
  } catch (error) {
    console.error('Failed to fetch company details:', error)
    return { name: extractCompanyNameFromUrl(url), description: null, email: null, phone: null, website: null, industry: null, employeeCount: null, linkedinUrl: null }
  }
}

async function scrapeInBackground(jobId: number, url: string, jobType: string) {
  try {
    console.log(`Starting scrape job ${jobId} for ${url} (type: ${jobType})`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    console.log(`Fetched ${html.length} bytes from ${url}`)

    let companiesFound = 0
    let emailsFound = 0
    let leadsCreated = 0

    if (jobType === 'thehub') {
      // TheHub.se specific patterns
      // Look for links to company pages
      const companyPatterns = [
        /\/companies\/[^\/]+\/[^"'\s]+/gi,  // /companies/country/company-name
        /\/startups\/[^"'\s]+/gi,           // /startups/company-name
        /\/company\/[^"'\s]+/gi,            // /company/company-name
      ]
      
      const allCompanyUrls: string[] = []
      
      for (const pattern of companyPatterns) {
        const matches = html.match(pattern) || []
        allCompanyUrls.push(...matches)
      }
      
      // Also try href extraction
      const hrefUrls = extractHrefs(html, /\/(companies|startups|company)\//i)
      allCompanyUrls.push(...hrefUrls)
      
      // Remove duplicates and clean URLs
      const uniqueUrls = Array.from(new Set(
        allCompanyUrls
          .map(u => u.replace(/["'<>]/g, '').split('?')[0].split('#')[0])
          .filter(u => u.length > 10 && !u.includes('javascript:'))
      ))
      
      console.log(`Found ${uniqueUrls.length} unique company URLs`)
      
      // Determine country from main URL
      let defaultCountry = 'Sweden'
      if (url.includes('/norway')) defaultCountry = 'Norway'
      else if (url.includes('/denmark')) defaultCountry = 'Denmark'
      else if (url.includes('/finland')) defaultCountry = 'Finland'

      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: { totalItems: Math.min(uniqueUrls.length, 50) },
      })

      // Process up to 50 companies
      for (const companyPath of uniqueUrls.slice(0, 50)) {
        try {
          const fullUrl = companyPath.startsWith('http') 
            ? companyPath 
            : `https://thehub.se${companyPath}`

          // Determine country from URL
          let country = defaultCountry
          if (companyPath.includes('/norway')) country = 'Norway'
          else if (companyPath.includes('/denmark')) country = 'Denmark'
          else if (companyPath.includes('/finland')) country = 'Finland'
          else if (companyPath.includes('/sweden')) country = 'Sweden'

          // Extract company name from URL
          const companyName = extractCompanyNameFromUrl(companyPath)
          
          if (!companyName || companyName.length < 2) continue

          // Check if company exists
          const existingCompany = await prisma.company.findFirst({
            where: { 
              OR: [
                { name: companyName },
                { sourceUrl: fullUrl }
              ]
            },
          })

          if (!existingCompany) {
            // Fetch additional details from company page
            const details = await fetchCompanyDetails(fullUrl)
            
            const newCompany = await prisma.company.create({
              data: {
                name: details.name || companyName,
                description: details.description,
                email: details.email,
                phone: details.phone,
                website: details.website,
                industry: details.industry,
                employeeCount: details.employeeCount,
                linkedinUrl: details.linkedinUrl,
                sourceUrl: fullUrl,
                country,
                scrapedAt: new Date(),
              },
            })

            companiesFound++

            // Create a lead for the company
            await prisma.lead.create({
              data: {
                companyId: newCompany.id,
                companyName: newCompany.name,
                email: details.email,
                phone: details.phone,
                source: 'thehub.se',
                notes: `Scraped from ${fullUrl}\n${details.description || ''}`.slice(0, 1000),
              },
            })
            
            leadsCreated++
            
            if (details.email) emailsFound++
          }

          await prisma.scrapingJob.update({
            where: { id: jobId },
            data: { itemsScraped: companiesFound },
          })
          
          // Small delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (e) {
          console.error('Error processing company:', e)
        }
      }
    } else {
      // General scraping - extract emails and company info from the page
      const text = extractText(html)
      
      // Find emails
      const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/g
      const emailMatches = text.match(emailRegex) || []
      const validEmails = Array.from(new Set(
        emailMatches.filter(e => 
          !e.includes('example.') && 
          !e.includes('@sentry') &&
          !e.includes('webpack') &&
          e.length < 100
        )
      ))
      emailsFound = validEmails.length

      // Get title as company name
      const title = extractTitle(html) || new URL(url).hostname

      // Find phone numbers
      const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{0,4}/g
      const phones = text.match(phoneRegex) || []
      const validPhones = phones.filter(p => p.replace(/\D/g, '').length >= 8)

      // Find LinkedIn
      const linkedinMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[^"']+)["']/i)

      // Find Twitter
      const twitterMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"']+)["']/i)

      // Create company
      const company = await prisma.company.create({
        data: {
          name: title.slice(0, 255),
          website: url,
          sourceUrl: url,
          email: validEmails[0] || null,
          phone: validPhones[0] || null,
          linkedinUrl: linkedinMatch ? linkedinMatch[1] : null,
          twitterUrl: twitterMatch ? twitterMatch[1] : null,
          description: text.slice(0, 2000),
          scrapedAt: new Date(),
        },
      })

      companiesFound = 1

      // Create leads for each email
      for (const email of validEmails.slice(0, 10)) {
        await prisma.lead.create({
          data: {
            companyId: company.id,
            companyName: company.name,
            email,
            source: 'web_scrape',
            notes: `Scraped from ${url}`,
          },
        })
        leadsCreated++
      }
    }

    console.log(`Scrape complete: ${companiesFound} companies, ${leadsCreated} leads, ${emailsFound} emails`)

    // Complete the job
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        itemsScraped: companiesFound,
        resultSummary: JSON.stringify({
          companiesFound,
          leadsCreated,
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
        errorMessage: error.message || 'Unknown error',
      },
    })
  }
}
