import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const job = await prisma.scrapingJob.findUnique({
      where: { id: parseInt(id) },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}

