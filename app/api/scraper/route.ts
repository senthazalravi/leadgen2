import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { url, jobType, maxPages } = await request.json()

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
    scrapeInBackground(job.id, url, jobType || 'general', maxPages || 10)

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

// Extract company name from URL slug
function extractCompanyNameFromUrl(url: string): string {
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
  city: string | null
  country: string | null
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
      return { name: extractCompanyNameFromUrl(url), description: null, email: null, phone: null, website: null, industry: null, employeeCount: null, linkedinUrl: null, city: null, country: null }
    }
    
    const html = await response.text()
    const text = extractText(html)
    
    // Extract company name from h1 or title
    let name = extractCompanyNameFromUrl(url)
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    if (h1Match) {
      name = h1Match[1].trim()
    }
    
    // Try to get name from JSON-LD
    const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1])
        if (jsonLd.name) name = jsonLd.name
      } catch {}
    }
    
    // Extract description from meta or og:description
    let description = null
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    if (ogDesc) {
      description = ogDesc[1]
    } else if (metaDesc) {
      description = metaDesc[1]
    }
    
    // Extract emails
    const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/g
    const emailMatches = text.match(emailRegex) || []
    const validEmails = emailMatches.filter(e => 
      !e.includes('example.') && 
      !e.includes('@sentry') &&
      !e.includes('webpack') &&
      !e.includes('wixpress') &&
      !e.includes('@thehub')
    )
    const email = validEmails[0] || null
    
    // Extract phone
    const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{0,4}/g
    const phones = text.match(phoneRegex) || []
    const validPhones = phones.filter(p => p.replace(/\D/g, '').length >= 8 && p.replace(/\D/g, '').length <= 15)
    const phone = validPhones[0] || null
    
    // Extract website - look for explicit website links
    let website = null
    const websitePatterns = [
      /href=["'](https?:\/\/(?!thehub|linkedin|twitter|facebook|instagram|youtube)[^"'\s]+)["'][^>]*>\s*(?:Website|Visit|Homepage|Site)/gi,
      /<a[^>]+href=["'](https?:\/\/(?!thehub|linkedin|twitter|facebook|instagram|youtube)[^"'\s]+)["'][^>]*class=["'][^"']*website[^"']*["']/gi,
    ]
    for (const pattern of websitePatterns) {
      const match = pattern.exec(html)
      if (match) {
        website = match[1]
        break
      }
    }
    
    // Extract LinkedIn
    const linkedinMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[^"'\s]+)["']/i)
    const linkedinUrl = linkedinMatch ? linkedinMatch[1] : null
    
    // Try to extract industry/tags
    let industry = null
    const tagMatch = html.match(/(?:industry|sector|category|tags?)[:\s]*["']?([A-Za-z\s&,]+)["']?/i)
    if (tagMatch) {
      industry = tagMatch[1].trim().slice(0, 100)
    }
    
    // Try to extract employee count
    let employeeCount = null
    const empMatch = text.match(/(\d+(?:\s*-\s*\d+)?)\s*(?:employees|team members|people|staff)/i)
    if (empMatch) {
      employeeCount = empMatch[1].replace(/\s/g, '')
    }
    
    // Try to extract location
    let city = null
    let country = null
    const locationMatch = html.match(/(?:location|based in|headquarters)[:\s]*["']?([A-Za-z\s]+),?\s*([A-Za-z\s]+)?["']?/i)
    if (locationMatch) {
      city = locationMatch[1]?.trim() || null
      country = locationMatch[2]?.trim() || null
    }
    
    return { name, description, email, phone, website, industry, employeeCount, linkedinUrl, city, country }
  } catch (error) {
    console.error('Failed to fetch company details:', error)
    return { name: extractCompanyNameFromUrl(url), description: null, email: null, phone: null, website: null, industry: null, employeeCount: null, linkedinUrl: null, city: null, country: null }
  }
}

// Extract startup URLs from TheHub.io page
function extractTheHubStartups(html: string): string[] {
  const urls: string[] = []
  
  // Pattern for startup links on thehub.io
  // They typically look like /startups/company-name
  const patterns = [
    /href=["'](\/startups\/[a-z0-9-]+)["']/gi,
    /href=["'](https?:\/\/thehub\.io\/startups\/[a-z0-9-]+)["']/gi,
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : `https://thehub.io${match[1]}`
      if (!urls.includes(url)) {
        urls.push(url)
      }
    }
  }
  
  return urls
}

async function scrapeInBackground(jobId: number, url: string, jobType: string, maxPages: number) {
  try {
    console.log(`Starting scrape job ${jobId} for ${url} (type: ${jobType}, maxPages: ${maxPages})`)
    
    let companiesFound = 0
    let emailsFound = 0
    let leadsCreated = 0
    let totalProcessed = 0

    if (jobType === 'thehub') {
      // TheHub.io scraping with pagination
      const baseUrl = url.split('?')[0]
      const allStartupUrls: string[] = []
      
      // Scrape multiple pages
      for (let page = 1; page <= maxPages; page++) {
        try {
          const pageUrl = page === 1 ? baseUrl : `${baseUrl}?page=${page}`
          console.log(`Fetching page ${page}: ${pageUrl}`)
          
          const response = await fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
          })
          
          if (!response.ok) {
            console.log(`Page ${page} returned ${response.status}, stopping pagination`)
            break
          }
          
          const html = await response.text()
          const pageUrls = extractTheHubStartups(html)
          
          if (pageUrls.length === 0) {
            console.log(`No more startups found on page ${page}, stopping`)
            break
          }
          
          allStartupUrls.push(...pageUrls)
          console.log(`Page ${page}: Found ${pageUrls.length} startups (total: ${allStartupUrls.length})`)
          
          // Update job with progress
          await prisma.scrapingJob.update({
            where: { id: jobId },
            data: { 
              totalItems: allStartupUrls.length,
              resultSummary: JSON.stringify({ 
                status: `Scanning page ${page}...`, 
                urlsFound: allStartupUrls.length 
              })
            },
          })
          
          // Small delay between page fetches
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (e) {
          console.error(`Error fetching page ${page}:`, e)
          break
        }
      }
      
      // Remove duplicates
      const uniqueUrls = Array.from(new Set(allStartupUrls))
      console.log(`Total unique startup URLs: ${uniqueUrls.length}`)
      
      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: { 
          totalItems: uniqueUrls.length,
          resultSummary: JSON.stringify({ 
            status: 'Processing startups...', 
            totalFound: uniqueUrls.length 
          })
        },
      })

      // Process each startup
      for (const startupUrl of uniqueUrls) {
        try {
          totalProcessed++
          
          // Check if company already exists
          const companySlug = startupUrl.split('/').pop() || ''
          const existingCompany = await prisma.company.findFirst({
            where: { 
              OR: [
                { sourceUrl: startupUrl },
                { name: { contains: companySlug.replace(/-/g, ' '), mode: 'insensitive' } }
              ]
            },
          })

          if (!existingCompany) {
            // Fetch company details
            const details = await fetchCompanyDetails(startupUrl)
            
            const newCompany = await prisma.company.create({
              data: {
                name: details.name,
                description: details.description,
                email: details.email,
                phone: details.phone,
                website: details.website,
                industry: details.industry,
                employeeCount: details.employeeCount,
                linkedinUrl: details.linkedinUrl,
                city: details.city,
                country: details.country || 'Scandinavia',
                sourceUrl: startupUrl,
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
                source: 'thehub.io',
                notes: details.description?.slice(0, 500) || `Scraped from ${startupUrl}`,
              },
            })
            
            leadsCreated++
            
            if (details.email) emailsFound++
          }

          // Update progress every 5 items
          if (totalProcessed % 5 === 0) {
            await prisma.scrapingJob.update({
              where: { id: jobId },
              data: { 
                itemsScraped: companiesFound,
                resultSummary: JSON.stringify({
                  status: `Processing ${totalProcessed}/${uniqueUrls.length}...`,
                  companiesFound,
                  leadsCreated,
                  emailsFound,
                })
              },
            })
          }
          
          // Small delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (e) {
          console.error('Error processing startup:', e)
        }
      }
    } else {
      // General website scraping
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const html = await response.text()
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
          totalProcessed,
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
