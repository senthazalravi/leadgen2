import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(tags)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, color } = await request.json()
    
    const existing = await prisma.tag.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: { name, color: color || '#6366f1' },
    })
    return NextResponse.json(tag)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}

