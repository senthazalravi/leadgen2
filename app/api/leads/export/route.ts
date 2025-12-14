import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { leadIds, status } = await request.json()

    const where: any = {}
    if (leadIds?.length) {
      where.id = { in: leadIds }
    }
    if (status) {
      where.status = status
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Convert to spreadsheet format
    const data = leads.map((lead) => ({
      ID: lead.id,
      'First Name': lead.firstName || '',
      'Last Name': lead.lastName || '',
      Email: lead.email || '',
      Phone: lead.phone || '',
      'Job Title': lead.jobTitle || '',
      Company: lead.companyName || '',
      Status: lead.status,
      Score: lead.score,
      Priority: lead.priority,
      LinkedIn: lead.linkedinUrl || '',
      WhatsApp: lead.whatsapp || '',
      Source: lead.source || '',
      Notes: lead.notes || '',
      Tags: lead.tags.map((lt) => lt.tag.name).join(', '),
      'Created At': lead.createdAt.toISOString(),
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="leads_export_${Date.now()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

