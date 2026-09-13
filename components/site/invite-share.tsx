import { ShareLinkButtons } from "@/components/ui/share-link-buttons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";
const INVITE_URL = `${SITE_URL}/register`;
const INVITE_MESSAGE = `Here's the link to join TP Tour — it's a networking event I think you'd be interested in. Click the link and register: ${INVITE_URL}`;

export function InviteShare() {
  return (
    <div className="border border-white/10 bg-tp-dark p-8">
      <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">Invite Someone to TP Tour</h2>
      <p className="mt-2 text-sm text-tp-offwhite/60">
        Know someone who&rsquo;d fit right in? Send them a direct invite.
      </p>
      <div className="mt-5">
        <ShareLinkButtons url={INVITE_URL} message={INVITE_MESSAGE} emailSubject="Join me on TP Tour" />
      </div>
    </div>
  );
}
