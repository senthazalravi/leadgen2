import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  attachments?: Array<{
    filename: string
    content: Buffer
  }>
}

export async function sendEmail({ to, subject, html, from, attachments }: SendEmailParams) {
  try {
    const result = await resend.emails.send({
      from: from || process.env.FROM_EMAIL || 'Outrinsic <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      attachments,
    })
    
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Resend error:', error)
    return { success: false, error: error.message }
  }
}

// Render email template with variables
export function renderTemplate(template: string, data: Record<string, string>) {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
  }
  return result
}

