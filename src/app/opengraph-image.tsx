import { ImageResponse } from "next/og";

export const alt = "AI-native Product Designer who ships code and design";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fafaf9",
          color: "#171717",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#4F46E5", fontWeight: 600 }}>
          AI-native Product Designer
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: 900,
          }}
        >
          I ship code and design at breakthrough speed.
        </div>
        <div style={{ fontSize: 26, color: "#717171" }}>Portfolio</div>
      </div>
    ),
    { ...size },
  );
}
