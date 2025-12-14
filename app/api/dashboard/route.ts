import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [
      totalLeads,
      hotLeads,
      inProgress,
      qualified,
      disqualified,
      futureLeads,
      newLeads,
      totalCompanies,
      companiesWithJobs,
      emailsSentTotal,
      recentLeads,
      leadsBySource,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'HOT' } }),
      prisma.lead.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.lead.count({ where: { status: 'QUALIFIED' } }),
      prisma.lead.count({ where: { status: 'DISQUALIFIED' } }),
      prisma.lead.count({ where: { status: 'FUTURE' } }),
      prisma.lead.count({ where: { status: 'NEW' } }),
      prisma.company.count(),
      prisma.company.count({ where: { hasJobOpenings: true } }),
      prisma.emailLog.count({ where: { status: 'sent' } }),
      prisma.lead.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      }),
      prisma.lead.groupBy({
        by: ['source'],
        _count: { source: true },
      }),
    ])

    // Today's emails
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const emailsSentToday = await prisma.emailLog.count({
      where: {
        status: 'sent',
        sentAt: { gte: today },
      },
    })

    return NextResponse.json({
      totalLeads,
      hotLeads,
      inProgress,
      qualified,
      disqualified,
      futureLeads,
      newLeads,
      totalCompanies,
      companiesWithJobs,
      emailsSentToday,
      emailsSentTotal,
      recentLeads: recentLeads.map((lead) => ({
        ...lead,
        tags: lead.tags.map((lt) => lt.tag),
      })),
      leadsBySource: leadsBySource.map((item) => ({
        source: item.source || 'Unknown',
        count: item._count.source,
      })),
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}

