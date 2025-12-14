import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendEmail, renderTemplate } from '@/lib/resend'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { leadIds, templateId, subject, body } = await request.json()

    if (!leadIds?.length) {
      return NextResponse.json({ error: 'No leads selected' }, { status: 400 })
    }

    // Get template if specified
    let emailSubject = subject
    let emailBody = body

    if (templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
      })
      if (template) {
        emailSubject = template.subject
        emailBody = template.body
      }
    }

    if (!emailSubject || !emailBody) {
      return NextResponse.json({ error: 'Subject and body required' }, { status: 400 })
    }

    // Get leads
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
    })

    let sent = 0
    let failed = 0

    for (const lead of leads) {
      if (!lead.email) continue

      // Render template with lead data
      const renderedSubject = renderTemplate(emailSubject, {
        first_name: lead.firstName || '',
        last_name: lead.lastName || '',
        full_name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
        email: lead.email || '',
        company: lead.companyName || '',
        job_title: lead.jobTitle || '',
      })

      const renderedBody = renderTemplate(emailBody, {
        first_name: lead.firstName || '',
        last_name: lead.lastName || '',
        full_name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
        email: lead.email || '',
        company: lead.companyName || '',
        job_title: lead.jobTitle || '',
      })

      // Create log entry
      const log = await prisma.emailLog.create({
        data: {
          leadId: lead.id,
          toEmail: lead.email,
          subject: renderedSubject,
          body: renderedBody,
          templateId,
          status: 'pending',
        },
      })

      // Send email
      const result = await sendEmail({
        to: lead.email,
        subject: renderedSubject,
        html: renderedBody,
      })

      if (result.success) {
        await prisma.emailLog.update({
          where: { id: log.id },
          data: { status: 'sent', sentAt: new Date() },
        })
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            emailSentCount: { increment: 1 },
            lastContacted: new Date(),
          },
        })
        sent++
      } else {
        await prisma.emailLog.update({
          where: { id: log.id },
          data: { status: 'failed', errorMessage: result.error },
        })
        failed++
      }
    }

    return NextResponse.json({
      message: `Sent ${sent} emails, ${failed} failed`,
      sent,
      failed,
    })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}

