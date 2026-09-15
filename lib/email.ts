import { Resend } from "resend";
import { formatHandicap, formatEventDateLong } from "@/lib/format";
import { buildIcsInvite, type IcsEvent } from "@/lib/ics";

const FROM = process.env.RESEND_FROM_EMAIL || "TP Tour <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tptourgolf.com";

function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function getClient(): Resend | null {
  if (!isEmailConfigured()) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function getOrganizer(): { name: string; email: string } {
  const match = FROM.match(/^(.*)<(.+)>$/);
  if (!match) return { name: "TP Tour", email: FROM };
  return { name: match[1].trim(), email: match[2].trim() };
}

interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

function icsAttachment(event: IcsEvent, attendeeName: string, attendeeEmail: string): EmailAttachment {
  const ics = buildIcsInvite(event, SITE_URL, getOrganizer(), { name: attendeeName, email: attendeeEmail });
  return {
    filename: "invite.ics",
    content: Buffer.from(ics, "utf-8").toString("base64"),
    contentType: "text/calendar; charset=utf-8; method=REQUEST",
  };
}

function wrapper(bodyHtml: string, previewText: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>TP Tour</title>
  </head>
  <body style="margin:0;padding:0;background:#0A0E0D;font-family:Georgia,'Times New Roman',serif;">
    <span style="display:none;font-size:1px;color:#0A0E0D;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0E0D;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;">
            <tr>
              <td style="padding:0 4px 24px;">
                <img src="${SITE_URL}/logo.png" alt="TP Tour" width="150" height="28" style="display:block;width:150px;height:28px;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="background:#111715;border-top:3px solid #C3A46D;border-radius:2px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:40px 36px;color:#F4F1E9;font-size:15px;line-height:1.65;font-family:Helvetica,Arial,sans-serif;">
                      ${bodyHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 8px 0;text-align:center;color:rgba(244,241,233,0.4);font-size:11px;letter-spacing:0.6px;line-height:1.8;font-family:Helvetica,Arial,sans-serif;">
                TP TOUR &middot; GOLF. NETWORK. COMPETE.<br/>
                Dubai, United Arab Emirates &middot;
                <a href="${SITE_URL}" style="color:#C3A46D;text-decoration:none;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
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
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:13px 28px;background:#C3A46D;color:#0A0E0D;text-decoration:none;font-weight:bold;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;font-family:Helvetica,Arial,sans-serif;">${label}</a>`;
}

async function send(to: string, subject: string, html: string, attachments?: EmailAttachment[]): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) {
    console.log(`[email] Skipped (no RESEND_API_KEY configured) — would have sent "${subject}" to ${to}`);
    return {};
  }
  try {
    const { error } = await client.emails.send({ from: FROM, to, subject, html, attachments });
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to send email" };
  }
}

export async function sendMemberInviteEmail(to: string) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">You&rsquo;re Invited to TP Tour</h1>
     <p>You&rsquo;ve been invited to join TP Tour — the UAE&rsquo;s golf society for professionals across Finance, Crypto, Digital Assets and FinTech. Click below to create your account.</p>
     ${button("Create Your Account", `${SITE_URL}/register`)}
     <p style="margin-top:28px;font-size:12px;color:rgba(244,241,233,0.4);">If you weren&rsquo;t expecting this, you can safely ignore this email.</p>`,
    "You've been invited to join TP Tour.",
  );
  return send(to, "You're Invited to TP Tour", html);
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">Welcome to TP Tour, ${firstName}.</h1>
     <p>You're in — TP Tour is the UAE's golf society for professionals across Finance, Crypto, Digital Assets and FinTech. You can enter events and connect with other members right away.</p>
     ${button("View Tour Schedule", `${SITE_URL}/tour-schedule`)}`,
    "You're in — welcome to TP Tour.",
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
     ${reason ? `<p style="color:rgba(244,241,233,0.6);">${reason}</p>` : ""}`,
    "An update on your TP Tour application.",
  );
  return send(to, "Your TP Tour application", html);
}

export async function sendEventEntryConfirmedEmail(to: string, firstName: string, attendeeName: string, event: IcsEvent) {
  const eventDateLabel = formatEventDateLong(event.event_date);
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">You're on the tee sheet.</h1>
     <p>Hi ${firstName}, your entry into <strong>${event.name}</strong> on ${eventDateLabel} is confirmed. We've attached a calendar invite below.</p>
     ${button("Event Details", `${SITE_URL}/events/${event.slug}`)}`,
    `You're entered into ${event.name}.`,
  );
  return send(to, `Entry Confirmed — ${event.name}`, html, [icsAttachment(event, attendeeName, to)]);
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

export async function sendWaitingListPromotedEmail(to: string, firstName: string, attendeeName: string, event: IcsEvent) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">A space opened up.</h1>
     <p>Hi ${firstName}, good news — a space became available at <strong>${event.name}</strong> and you've been moved from the waiting list onto the tee sheet. We've attached a calendar invite below.</p>
     ${button("Event Details", `${SITE_URL}/events/${event.slug}`)}`,
    `You're now entered into ${event.name}.`,
  );
  return send(to, `You're In — ${event.name}`, html, [icsAttachment(event, attendeeName, to)]);
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

export async function sendPasswordChangedEmail(to: string, firstName: string) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">Your password was changed</h1>
     <p>Hi ${firstName}, this confirms the password on your TP Tour account was just changed.</p>
     <p style="margin-top:28px;font-size:12px;color:rgba(244,241,233,0.4);">If you didn&rsquo;t make this change, contact us immediately and reset your password again.</p>`,
    "Your TP Tour password was changed.",
  );
  return send(to, "Your TP Tour password was changed", html);
}

export async function sendHandicapUpdatedEmail(to: string, firstName: string, newHandicap: number) {
  const html = wrapper(
    `<h1 style="font-size:22px;margin:0 0 16px;">Handicap Updated</h1>
     <p>Hi ${firstName}, your TP Tour handicap has been updated to <strong>${formatHandicap(newHandicap)}</strong>.</p>
     ${button("My Profile", `${SITE_URL}/my-tp-tour/profile`)}`,
    `Your handicap is now ${formatHandicap(newHandicap)}.`,
  );
  return send(to, "Your TP Tour handicap has been updated", html);
}
