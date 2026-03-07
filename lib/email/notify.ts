// Server-only — called from server actions only.
// Fire-and-forget: errors are caught and logged silently — they NEVER
// propagate back to the caller. Email failures must not break mutations.
import { clerkClient } from '@clerk/nextjs/server'
import resend from '@/lib/email'
import { prisma } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifyEvent = 'event_text' | 'photo' | 'video' | 'journal'

interface NotifyParams {
  /** Clerk userId of the person who performed the action. */
  actorId: string
  /** Clerk organizationId (= familyId). */
  familyId: string
  /** Calendar date string in 'YYYY-MM-DD' format. */
  date: string
  /** What was added/changed — determines email subject + body copy. */
  event: NotifyEvent
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function buildSubject(actorName: string, event: NotifyEvent, dateLabel: string): string {
  const labels: Record<NotifyEvent, string> = {
    event_text: 'added a note',
    photo:      'uploaded a photo',
    video:      'uploaded a video',
    journal:    'started a journal entry',
  }
  return `${actorName} ${labels[event]} — ${dateLabel}`
}

function buildDescription(actorName: string, event: NotifyEvent, dateLabel: string): string {
  switch (event) {
    case 'event_text': return `${actorName} added or updated the day note for ${dateLabel}.`
    case 'photo':      return `${actorName} uploaded a new photo for ${dateLabel}.`
    case 'video':      return `${actorName} uploaded a new video for ${dateLabel}.`
    case 'journal':    return `${actorName} started a new journal entry for ${dateLabel}.`
  }
}

function buildHtml(actorName: string, event: NotifyEvent, dateLabel: string, dayUrl: string): string {
  const description = buildDescription(actorName, event, dateLabel)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daybook Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="background-color:#1a1a1a;padding:24px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Daybook</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#111827;line-height:1.6;">
                ${description}
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                Open the app to see what was added.
              </p>
              <a href="${dayUrl}"
                 style="display:inline-block;background-color:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;">
                View ${dateLabel}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                You received this because you are a member of this family&rsquo;s Daybook.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Send email notifications to all family members EXCEPT the actor.
 *
 * Always fire-and-forget — call WITHOUT await:
 *   notifyFamilyMembers({ actorId, familyId, date, event })
 */
export function notifyFamilyMembers(params: NotifyParams): void {
  _sendNotifications(params).catch((err) => {
    console.error('[notify] Email notification failed silently:', err)
  })
}

async function _sendNotifications({ actorId, familyId, date, event }: NotifyParams): Promise<void> {
  const clerk = await clerkClient()
  const [membershipsRes, org] = await Promise.all([
    clerk.organizations.getOrganizationMembershipList({ organizationId: familyId, limit: 100 }),
    clerk.organizations.getOrganization({ organizationId: familyId }),
  ])

  // Resolve actor's display name from the membership list
  const actor = membershipsRes.data.find(m => m.publicUserData?.userId === actorId)
  const actorName =
    [actor?.publicUserData?.firstName, actor?.publicUserData?.lastName].filter(Boolean).join(' ') ||
    actor?.publicUserData?.identifier ||
    'A family member'

  // Build candidate list: non-actor members with valid userId + email
  const candidates = membershipsRes.data
    .filter(m => m.publicUserData?.userId !== actorId)
    .map(m => ({
      userId: m.publicUserData?.userId ?? '',
      email: m.publicUserData?.identifier ?? '',
    }))
    .filter(r => r.userId && r.email)

  if (candidates.length === 0) return

  // Only send to members who have opted in to email notifications
  const optedIn = await prisma.notificationPreference.findMany({
    where: {
      familyId,
      userId: { in: candidates.map(r => r.userId) },
      emailEnabled: true,
    },
    select: { userId: true },
  })
  const optedInIds = new Set(optedIn.map(p => p.userId))

  const recipients = candidates
    .filter(r => optedInIds.has(r.userId))
    .map(r => r.email)

  if (recipients.length === 0) return

  const [yyyy, mm, dd] = date.split('-')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const dayUrl = `${baseUrl}/calendar/${yyyy}-${mm}/${dd}`
  const dateLabel = formatDate(date)
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? ''
  const familyName = org.name

  await resend.emails.send({
    from: `${familyName} Daybook <${fromEmail}>`,
    to: fromEmail,      // sender receives as "to"; real recipients via bcc for privacy
    bcc: recipients,
    subject: buildSubject(actorName, event, dateLabel),
    html: buildHtml(actorName, event, dateLabel, dayUrl),
  })
}
