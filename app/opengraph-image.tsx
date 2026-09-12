import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TP Tour — Golf. Network. Compete.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0E0D",
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(31,122,85,0.45), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(195,164,109,0.25), transparent 60%)",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 8,
            color: "#C3A46D",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          TP Tour
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 108,
            fontWeight: 800,
            letterSpacing: -2,
            color: "#F4F1E9",
            textTransform: "uppercase",
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          Golf. Network. Compete.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 30,
            color: "rgba(244,241,233,0.65)",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          The UAE&apos;s Golf Society for Finance &amp; Crypto Professionals
        </div>
      </div>
    ),
    { ...size },
  );
}
