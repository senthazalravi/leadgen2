import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        lead: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })
    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

