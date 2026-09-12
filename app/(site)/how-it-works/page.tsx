import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How TP Tour membership, events, handicaps and the Order of Merit work.",
};

const faqs = [
  {
    q: "What is TP Tour?",
    a: "TP Tour is a golf society for professionals working across Finance, Crypto, Digital Assets and FinTech in the UAE. We run a season-long calendar of competitive golf events at leading courses in Dubai and Abu Dhabi, bringing the community together on the course.",
  },
  {
    q: "Who can join?",
    a: "Anyone working in or around Finance, Crypto, Digital Assets or FinTech in the UAE is welcome to apply. You don't need to know anyone else in the Tour before joining — most members meet their first connections at their first event.",
  },
  {
    q: "Do I need a handicap to join?",
    a: "It helps, but it isn't required to register. You can add or update your handicap at any time from your profile, and it's used to calculate fair results in competitions.",
  },
  {
    q: "How does membership approval work?",
    a: "After you register, your application is reviewed before you can enter events. This usually doesn't take long — you'll be notified once you're approved, and can then enter any event on the schedule.",
  },
  {
    q: "How do I enter an event?",
    a: "Once approved, go to the event on the Tour Schedule and click Enter Event. Confirm your details and agree to the competition rules, and you're on the tee sheet — the whole process takes under a minute.",
  },
  {
    q: "What happens if an event is full?",
    a: "You can join the waiting list from the event page. If a space opens up, we'll move you into the event and let you know.",
  },
  {
    q: "What is the Order of Merit?",
    a: "It's the season-long leaderboard. Every eligible event awards points based on where you finish, and those points accumulate across the season. At the end of the season, the player with the most points is crowned TP Tour Champion.",
  },
  {
    q: "What if I can't make an event I've entered?",
    a: "Withdraw from the event as early as possible so your place can go to someone on the waiting list. See the TP Tour Terms for cancellation and payment details.",
  },
  {
    q: "How much does it cost?",
    a: "Entry prices vary by event and are shown on each event's page before you enter — they typically cover green fees and any catering at the venue.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-white/10 py-20 lg:py-28">
        <Container className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">How It Works</p>
          <h1 className="mt-4 font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-5xl">
            Everything You Need to Know.
          </h1>
          <p className="mt-6 text-balance text-lg leading-relaxed text-tp-offwhite/70">
            From joining to entering your first event, here&rsquo;s how TP Tour works.
          </p>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container className="max-w-3xl">
          <div className="divide-y divide-white/10 border-y border-white/10">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-7">
                <h2 className="font-heading text-lg font-bold uppercase text-tp-offwhite">{faq.q}</h2>
                <p className="mt-3 leading-relaxed text-tp-offwhite/70">{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-white/10 bg-tp-dark py-20 text-center lg:py-24">
        <Container>
          <h2 className="font-heading text-3xl font-bold uppercase text-tp-offwhite sm:text-4xl">
            Ready to Join the Tour?
          </h2>
          <div className="mt-8">
            <LinkButton href="/register" variant="gold" size="lg">
              Join TP Tour
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}
