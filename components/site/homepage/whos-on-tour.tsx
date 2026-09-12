import { Container } from "@/components/ui/container";

// Placeholder members for illustration only — replace with live data once
// the member base is large enough to showcase for real.
const MOCK_MEMBERS = [
  { initials: "JK", name: "James K.", company: "Investment Bank", industry: "Investment Banking", handicap: "8.2", events: 5, oom: 3 },
  { initials: "SM", name: "Sarah M.", company: "Crypto Exchange", industry: "Digital Assets", handicap: "14.6", events: 4, oom: 7 },
  { initials: "OA", name: "Omar A.", company: "Hedge Fund", industry: "Hedge Fund", handicap: "5.4", events: 6, oom: 1 },
  { initials: "DT", name: "Daniel T.", company: "FinTech Startup", industry: "FinTech", handicap: "11.3", events: 5, oom: 5 },
  { initials: "FS", name: "Fatima S.", company: "Recruitment Firm", industry: "Recruitment", handicap: "16.4", events: 4, oom: 9 },
];

export function WhosOnTour() {
  return (
    <section className="border-y border-white/10 bg-tp-dark py-20 lg:py-28">
      <Container className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold">Who&rsquo;s on Tour</p>
        <h2 className="mt-4 font-heading text-balance text-4xl font-bold uppercase leading-tight text-tp-offwhite sm:text-5xl">
          250+ Members. One Community.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-tp-offwhite/70">
          Founders. Traders. Investors. Brokers. Recruiters. Advisors. FinTech leaders. Crypto professionals.
          All brought together by golf.
        </p>
      </Container>

      <div className="no-scrollbar mt-14 overflow-x-auto pl-6 lg:pl-10">
        <div className="flex w-max gap-4 pr-6 lg:pr-10">
          {MOCK_MEMBERS.map((m) => (
            <div key={m.name} className="w-60 shrink-0 border border-white/10 bg-tp-black p-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tp-green/25 font-heading text-lg font-bold text-tp-green-light">
                {m.initials}
              </span>
              <p className="mt-4 font-heading font-bold uppercase text-tp-offwhite">{m.name}</p>
              <p className="mt-1 text-sm text-tp-offwhite/50">{m.company}</p>
              <p className="text-xs text-tp-offwhite/40">{m.industry}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 pt-4 text-xs text-tp-offwhite/50">
                <span>Hcp {m.handicap}</span>
                <span>{m.events} Events</span>
                <span className="text-tp-gold">OOM #{m.oom}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
