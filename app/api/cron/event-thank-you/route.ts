import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEventThankYouEmail } from "@/lib/email";

// Runs daily at 05:00 UTC (09:00 Dubai — UTC+4 year-round, no DST) via
// vercel.json. At that moment Dubai and UTC share the same calendar date,
// so "yesterday" in UTC is also "yesterday" in Dubai — no timezone math
// needed beyond that.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server is missing SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const { data: events, error: eventsError } = await admin
    .from("events")
    .select("id, slug, name, event_date")
    .eq("event_date", yesterdayStr)
    .is("attendee_thank_you_sent_at", null);

  if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 });
  if (!events || events.length === 0) return NextResponse.json({ processedEvents: 0, emailsSent: 0 });

  const { data: nextEventRows } = await admin.from("next_event").select("name, slug, event_date").limit(1);
  const nextEvent = nextEventRows?.[0] ?? null;

  let emailsSent = 0;

  for (const event of events) {
    const { data: entrants } = await admin
      .from("event_entries")
      .select("member_profiles(email, first_name)")
      .eq("event_id", event.id)
      .eq("status", "confirmed")
      .eq("is_guest", false);

    for (const entry of (entrants ?? []) as unknown as Array<{ member_profiles: { email: string; first_name: string } | null }>) {
      if (!entry.member_profiles) continue;
      const { error } = await sendEventThankYouEmail(entry.member_profiles.email, entry.member_profiles.first_name, event, nextEvent);
      if (!error) emailsSent++;
    }

    await admin.from("events").update({ attendee_thank_you_sent_at: new Date().toISOString() }).eq("id", event.id);
  }

  return NextResponse.json({ processedEvents: events.length, emailsSent });
}
