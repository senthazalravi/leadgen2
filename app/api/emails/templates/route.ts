import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(templates)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const template = await prisma.emailTemplate.create({ data })
    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

