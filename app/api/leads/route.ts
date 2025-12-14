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
    const status = searchParams.get('status')
    const skip = parseInt(searchParams.get('skip') || '0')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (status) {
      where.status = status
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        company: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Transform tags
    const transformedLeads = leads.map((lead) => ({
      ...lead,
      tags: lead.tags.map((lt) => lt.tag),
    }))

    return NextResponse.json(transformedLeads)
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { tagIds, ...leadData } = data

    const lead = await prisma.lead.create({
      data: {
        ...leadData,
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId: number) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: {
        company: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...lead,
      tags: lead.tags.map((lt) => lt.tag),
    })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

