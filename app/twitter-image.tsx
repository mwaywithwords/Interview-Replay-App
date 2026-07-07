import { branding } from "@/lib/branding";
import {
  generateSocialImage,
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from "@/lib/social-image";

export const alt = `${branding.brandName} — ${branding.ogSubtitle}`;
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE;

// Node.js runtime is required: generateSocialImage reads the logo from disk via fs.
export const runtime = "nodejs";

/** File-based metadata: Next.js emits twitter:image with summary_large_image card. */
export default async function Image() {
  return generateSocialImage();
}
