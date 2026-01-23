import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "HM Blog - Tech & Life";
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
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            opacity: 0.15,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
            opacity: 0.1,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "white",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "#3b82f6" }}>HM</span> Blog
          </h1>
          <p
            style={{
              fontSize: 32,
              color: "rgba(255, 255, 255, 0.6)",
              marginTop: 20,
              letterSpacing: "0.05em",
            }}
          >
            Tech & Life
          </p>
        </div>

        {/* Bottom tagline */}
        <p
          style={{
            position: "absolute",
            bottom: 50,
            fontSize: 20,
            color: "rgba(255, 255, 255, 0.4)",
          }}
        >
          Stories about code and life
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
