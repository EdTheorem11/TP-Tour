import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

export function Hero({
  eyebrow,
  heading,
  subheading,
}: {
  eyebrow: string;
  heading: string;
  subheading: string;
}) {
  const lines = heading.split(".").map((l) => l.trim()).filter(Boolean);

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-tp-black">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(31,122,85,0.35), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(195,164,109,0.18), transparent 60%)",
        }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
        <defs>
          <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#F4F1E9" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-tp-black to-transparent" />

      <Container className="relative z-10 py-32">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-tp-gold animate-reveal-up">
          {eyebrow}
        </p>
        <h1 className="font-heading text-balance text-[13vw] font-bold uppercase leading-[0.95] tracking-tight text-tp-offwhite sm:text-6xl lg:text-8xl">
          {lines.map((line, i) => (
            <span
              key={line}
              className="block animate-reveal-up"
              style={{ animationDelay: `${0.1 + i * 0.12}s`, animationFillMode: "backwards" }}
            >
              {line}
              {i === 0 && <span className="text-tp-green-light">.</span>}
              {i !== 0 && "."}
            </span>
          ))}
        </h1>
        <p
          className="mt-8 max-w-xl text-balance text-lg leading-relaxed text-tp-offwhite/70 animate-reveal-up"
          style={{ animationDelay: "0.5s", animationFillMode: "backwards" }}
        >
          {subheading}
        </p>
        <div
          className="mt-10 flex flex-wrap items-center gap-4 animate-reveal-up"
          style={{ animationDelay: "0.62s", animationFillMode: "backwards" }}
        >
          <LinkButton href="/tour-schedule" variant="gold" size="lg">
            View Tour Schedule
          </LinkButton>
          <LinkButton href="/register" variant="outline" size="lg">
            Join TP Tour
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
