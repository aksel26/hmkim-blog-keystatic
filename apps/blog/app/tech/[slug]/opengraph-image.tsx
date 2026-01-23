import { ImageResponse } from "next/og";
import { fetchPostFromGitHub, fetchThumbnailData } from "@/lib/og-utils";

export const runtime = "nodejs";

export const alt = "Tech Post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch post data from GitHub
  const post = await fetchPostFromGitHub("tech", slug);

  const title = post?.title || "Tech Post";
  const summary = post?.summary || "";

  // Fetch thumbnail image
  const thumbnailData = await fetchThumbnailData(post?.thumbnailImage || null);

  // With thumbnail: image top, text bottom
  if (thumbnailData) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#0a0a0a",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Top: Thumbnail (60%) */}
          <div
            style={{
              width: "100%",
              height: "60%",
              display: "flex",
              position: "relative",
            }}
          >
            <img
              src={`data:image/jpeg;base64,${Buffer.from(thumbnailData).toString("base64")}`}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Bottom gradient overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "40%",
                background: "linear-gradient(to bottom, transparent, #0a0a0a)",
              }}
            />
            {/* Category badge */}
            <div
              style={{
                position: "absolute",
                top: 24,
                left: 24,
                background: "#3b82f6",
                color: "white",
                padding: "8px 20px",
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              TECH
            </div>
          </div>

          {/* Bottom: Content (40%) */}
          <div
            style={{
              width: "100%",
              height: "40%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 40px 30px 40px",
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: title.length > 40 ? 32 : 40,
                fontWeight: 700,
                color: "white",
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </h1>

            {/* Summary */}
            {summary && (
              <p
                style={{
                  fontSize: 18,
                  color: "rgba(255, 255, 255, 0.6)",
                  marginTop: 12,
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {summary}
              </p>
            )}
          </div>

          {/* HM. watermark */}
          <span
            style={{
              position: "absolute",
              bottom: 24,
              right: 32,
              fontSize: 20,
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.25)",
              letterSpacing: "-0.02em",
            }}
          >
            HM.
          </span>
        </div>
      ),
      {
        ...size,
      }
    );
  }

  // Without thumbnail: gradient background
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #3b82f6 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: 60,
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -50,
            right: 200,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.2)",
          }}
        />

        {/* Category badge */}
        <div
          style={{
            display: "flex",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              color: "white",
              padding: "10px 24px",
              borderRadius: 24,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.05em",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            TECH
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: title.length > 30 ? 48 : 56,
            fontWeight: 700,
            color: "white",
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </h1>

        {/* Summary */}
        {summary && (
          <p
            style={{
              fontSize: 24,
              color: "rgba(255, 255, 255, 0.7)",
              marginTop: 24,
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {summary}
          </p>
        )}

        {/* HM. watermark */}
        <span
          style={{
            position: "absolute",
            bottom: 40,
            right: 50,
            fontSize: 48,
            fontWeight: 800,
            color: "rgba(255, 255, 255, 0.15)",
            letterSpacing: "-0.02em",
          }}
        >
          HM.
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
