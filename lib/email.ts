import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "TP Tour <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tptour.ae";

function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function getClient(): Resend | null {
  if (!isEmailConfigured()) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function wrapper(bodyHtml: string, previewText: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TP Tour</title>
  </head>
  <body style="margin:0;padding:0;background:#F4F1E9;font-family:Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#F4F1E9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1E9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:4px;overflow:hidden;">
            <tr>
              <td style="background:#0A0E0D;padding:28px 32px;">
                <span style="font-family:Georgia,serif;font-size:20px;font-weight:bold;letter-spacing:2px;color:#F4F1E9;text-transform:uppercase;">
                  TP <span style="color:#C3A46D;">TOUR</span>
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;color:#111715;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#F4F1E9;color:#6b6b6b;font-size:12px;">
                TP Tour &middot; Golf. Network. Compete. &middot; Dubai, United Arab Emirates<br/>
                <a href="${SITE_URL}" style="color:#1F7A55;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#C3A46D;color:#0A0E0D;text-decoration:none;font-weight:bold;font-size:13px;letter-spacing:1px;text-transform:uppercase;border-radius:2px;">${label}</a>`;
}

async function send(to: string, subject: string, html: string): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) {
    console.log(`[email] Skipped (no RESEND_API_KEY configured) — would have sent "${subject}" to ${to}`);
    return {};
  }
  try {
    const { error } = await client.emails.send({ from: FROM, to, subject, html });
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to send email" };
  }
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">Welcome to TP Tour, ${firstName}.</h1>
     <p>Thanks for applying to join TP Tour — the UAE's golf society for professionals across Finance, Crypto, Digital Assets and FinTech.</p>
     <p>Your application is being reviewed. We'll email you as soon as you're approved and able to enter events.</p>
     ${button("Visit TP Tour", SITE_URL)}`,
    "Your TP Tour application has been received.",
  );
  return send(to, "Welcome to TP Tour", html);
}

export async function sendMembershipApprovedEmail(to: string, firstName: string) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">You're in, ${firstName}.</h1>
     <p>Your TP Tour membership has been approved. You can now enter events, view the Order of Merit and connect with other members.</p>
     ${button("View Tour Schedule", `${SITE_URL}/tour-schedule`)}`,
    "Your TP Tour membership has been approved.",
  );
  return send(to, "Your TP Tour membership has been approved", html);
}

export async function sendMembershipRejectedEmail(to: string, firstName: string, reason?: string | null) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">Application Update</h1>
     <p>Hi ${firstName}, thanks for your interest in TP Tour. Unfortunately we're not able to approve your membership application at this time.</p>
     ${reason ? `<p style="color:#6b6b6b;">${reason}</p>` : ""}`,
    "An update on your TP Tour application.",
  );
  return send(to, "Your TP Tour application", html);
}

export async function sendEventEntryConfirmedEmail(
  to: string,
  firstName: string,
  eventName: string,
  eventDateLabel: string,
  eventSlug: string,
) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">You're on the tee sheet.</h1>
     <p>Hi ${firstName}, your entry into <strong>${eventName}</strong> on ${eventDateLabel} is confirmed.</p>
     ${button("Event Details", `${SITE_URL}/events/${eventSlug}`)}`,
    `You're entered into ${eventName}.`,
  );
  return send(to, `Entry Confirmed — ${eventName}`, html);
}

export async function sendWaitingListConfirmedEmail(to: string, firstName: string, eventName: string, eventSlug: string) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">You're on the waiting list.</h1>
     <p>Hi ${firstName}, ${eventName} is currently full, so we've added you to the waiting list. We'll email you if a space opens up.</p>
     ${button("Event Details", `${SITE_URL}/events/${eventSlug}`)}`,
    `You're on the waiting list for ${eventName}.`,
  );
  return send(to, `Waiting List — ${eventName}`, html);
}

export async function sendWaitingListPromotedEmail(to: string, firstName: string, eventName: string, eventSlug: string) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">A space opened up.</h1>
     <p>Hi ${firstName}, good news — a space became available at <strong>${eventName}</strong> and you've been moved from the waiting list onto the tee sheet.</p>
     ${button("Event Details", `${SITE_URL}/events/${eventSlug}`)}`,
    `You're now entered into ${eventName}.`,
  );
  return send(to, `You're In — ${eventName}`, html);
}

export async function sendResultsPublishedEmail(to: string, firstName: string, eventName: string, eventSlug: string) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">Results are in.</h1>
     <p>Hi ${firstName}, results for <strong>${eventName}</strong> have been published and the Order of Merit has been updated.</p>
     ${button("View Results", `${SITE_URL}/results/${eventSlug}`)}`,
    `Results for ${eventName} are published.`,
  );
  return send(to, `Results Published — ${eventName}`, html);
}

export async function sendAnnouncementEmail(to: string, firstName: string, subject: string, messageHtml: string) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">${subject}</h1>
     <p>Hi ${firstName},</p>
     ${messageHtml}`,
    subject,
  );
  return send(to, subject, html);
}

export async function sendHandicapUpdatedEmail(to: string, firstName: string, newHandicap: number) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">Handicap Updated</h1>
     <p>Hi ${firstName}, your TP Tour handicap has been updated to <strong>${newHandicap}</strong>.</p>
     ${button("My Profile", `${SITE_URL}/my-tp-tour/profile`)}`,
    `Your handicap is now ${newHandicap}.`,
  );
  return send(to, "Your TP Tour handicap has been updated", html);
}
