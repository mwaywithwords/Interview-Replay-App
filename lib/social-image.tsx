import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { branding, DEFAULT_SITE_URL } from "@/lib/branding";

/** Standard Open Graph / Twitter card dimensions (1.91:1). */
export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const SOCIAL_IMAGE_CONTENT_TYPE = "image/png";

/** Brand colors aligned with the landing page dark theme and primary accent. */
const COLORS = {
  background: "#10121a",
  foreground: "#f8fafc",
  muted: "#94a3b8",
  primary: "#3b63f3",
  primaryGlow: "rgba(59, 99, 243, 0.38)",
  grid: "rgba(148, 163, 184, 0.08)",
} as const;

/**
 * Generates the branded 1200×630 social preview image.
 *
 * Uses Node.js `fs` to embed `public/replayai-logo.png` as a data URI because
 * `ImageResponse` (Satori) cannot resolve relative `/public` paths at render time.
 */
export async function generateSocialImage() {
  const logoData = await readFile(
    join(process.cwd(), "public/replayai-logo.png")
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  const hostname = new URL(DEFAULT_SITE_URL).hostname;

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
          backgroundColor: COLORS.background,
          position: "relative",
          overflow: "hidden",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Ambient glow — mirrors landing page radial gradients */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "760px",
            height: "560px",
            borderRadius: "9999px",
            background: COLORS.primaryGlow,
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-80px",
            bottom: "-60px",
            width: "420px",
            height: "420px",
            borderRadius: "9999px",
            background: "rgba(37, 99, 235, 0.18)",
            filter: "blur(70px)",
          }}
        />

        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to right, ${COLORS.grid} 1px, transparent 1px), linear-gradient(to bottom, ${COLORS.grid} 1px, transparent 1px)`,
            backgroundSize: "72px 72px",
            opacity: 0.55,
          }}
        />

        {/* Centered brand content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 80px",
            position: "relative",
          }}
        >
          <img
            src={logoSrc}
            alt=""
            width={128}
            height={128}
            style={{
              borderRadius: "28px",
              marginBottom: "28px",
            }}
          />

          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: COLORS.foreground,
              lineHeight: 1,
              marginBottom: "18px",
            }}
          >
            {branding.brandName}
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: COLORS.primary,
              lineHeight: 1.2,
              marginBottom: "22px",
            }}
          >
            {branding.ogSubtitle}
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: COLORS.muted,
              lineHeight: 1.4,
              maxWidth: "900px",
            }}
          >
            {branding.ogSupportingLine}
          </div>
        </div>

        {/* Domain watermark — reinforces brand in cropped previews */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            right: "48px",
            fontSize: 20,
            fontWeight: 600,
            color: COLORS.muted,
            letterSpacing: "-0.01em",
          }}
        >
          {hostname}
        </div>
      </div>
    ),
    {
      ...SOCIAL_IMAGE_SIZE,
    }
  );
}
