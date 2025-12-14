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
    const lead = await prisma.lead.findUnique({
      where: { id: parseInt(id) },
      include: {
        company: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...lead,
      tags: lead.tags.map((lt) => lt.tag),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await request.json()
    const { tagIds, ...leadData } = data

    // Update lead
    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: leadData,
    })

    // Update tags if provided
    if (tagIds !== undefined) {
      await prisma.leadTag.deleteMany({
        where: { leadId: parseInt(id) },
      })

      if (tagIds.length > 0) {
        await prisma.leadTag.createMany({
          data: tagIds.map((tagId: number) => ({
            leadId: parseInt(id),
            tagId,
          })),
        })
      }
    }

    // Fetch updated lead with relations
    const updatedLead = await prisma.lead.findUnique({
      where: { id: parseInt(id) },
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
      ...updatedLead,
      tags: updatedLead?.tags.map((lt) => lt.tag) || [],
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.lead.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}

