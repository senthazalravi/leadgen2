import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const country = searchParams.get('country')
    const hasJobs = searchParams.get('hasJobs')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (country) {
      where.country = { contains: country, mode: 'insensitive' }
    }
    
    if (hasJobs !== null && hasJobs !== '') {
      where.hasJobOpenings = hasJobs === 'true'
    }

    const companies = await prisma.company.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(companies)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const company = await prisma.company.create({ data })
    return NextResponse.json(company)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}

