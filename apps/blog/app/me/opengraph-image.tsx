import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const alt = "김현민 - FrontEnd Developer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const iconData = await readFile(join(process.cwd(), "app/icon.png"));
  const iconBase64 = `data:image/png;base64,${iconData.toString("base64")}`;

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
          background: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle top border accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #0984e3 0%, #ff6900 100%)",
          }}
        />

        {/* Logo */}
        <img
          src={iconBase64}
          alt="Logo"
          width={100}
          height={100}
          style={{
            borderRadius: 20,
            marginBottom: 32,
          }}
        />

        {/* Name */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#171717",
            margin: 0,
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "baseline",
          }}
        >
          김현민
          <span style={{ color: "#ff6900" }}>.</span>
        </h1>

        {/* Role */}
        <p
          style={{
            fontSize: 24,
            color: "#0984e3",
            marginTop: 16,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          FrontEnd Developer
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: 22,
            color: "#6b7280",
            marginTop: 24,
            maxWidth: 500,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          직관적이고 빠른 웹 애플리케이션을 만듭니다
        </p>

        {/* Bottom email */}
        <p
          style={{
            position: "absolute",
            bottom: 48,
            fontSize: 16,
            color: "#9ca3af",
            letterSpacing: "0.02em",
          }}
        >
          kevinxkim2023@gmail.com
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
