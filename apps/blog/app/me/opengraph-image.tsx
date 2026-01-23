import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "About Hyunmin Kim";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Decorative gradient circle */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            opacity: 0.1,
          }}
        />

        {/* Profile circle */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 60,
            marginBottom: 30,
          }}
        >
          <span>👋</span>
        </div>

        {/* Name */}
        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "white",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Hyunmin Kim
        </h1>

        {/* Role */}
        <p
          style={{
            fontSize: 28,
            color: "#3b82f6",
            marginTop: 16,
            fontWeight: 500,
          }}
        >
          Software Engineer
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: 22,
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: 24,
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Building intuitive and performant web applications
        </p>

        {/* Blog name */}
        <p
          style={{
            position: "absolute",
            bottom: 50,
            fontSize: 20,
            color: "rgba(255, 255, 255, 0.3)",
          }}
        >
          HM Blog
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
