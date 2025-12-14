import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action, leadIds, status } = await request.json()

    if (action === 'delete') {
      await prisma.lead.deleteMany({
        where: { id: { in: leadIds } },
      })
      return NextResponse.json({ message: `Deleted ${leadIds.length} leads` })
    }

    if (action === 'status' && status) {
      await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data: { status },
      })
      return NextResponse.json({ message: `Updated ${leadIds.length} leads` })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 })
  }
}

