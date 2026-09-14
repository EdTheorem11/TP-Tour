import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { HeroBackground } from "@/components/site/hero-background";

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
    <HeroBackground
      src="/hero.png"
      videoSrc="/hero-video.mp4"
      alt="TP Tour — golf at sunrise with the Dubai skyline"
    >
      <Container className="py-32">
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
    </HeroBackground>
  );
}
