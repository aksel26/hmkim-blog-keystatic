/**
 * OG Image generation utilities
 * Fetches post data directly from GitHub for dynamic OG image generation
 */

import { readFile } from "fs/promises";
import { join } from "path";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/aksel26/hmkim-blog-keystatic/main/apps/blog";
const SITE_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "https://hmkim-blog.vercel.app";

interface PostMetadata {
  title: string;
  summary: string;
  thumbnailImage: string | null;
}

/**
 * Parse YAML frontmatter from mdoc file content
 */
function parseYamlFrontmatter(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  // Extract frontmatter between --- delimiters
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return result;

  const frontmatter = frontmatterMatch[1];
  const lines = frontmatter.split('\n');

  let currentKey = '';
  let currentValue = '';
  let isMultiLine = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for new key
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)/);

    if (keyMatch && !line.startsWith('  ') && !line.startsWith('\t')) {
      // Save previous key-value if exists
      if (currentKey && isMultiLine) {
        result[currentKey] = currentValue.trim();
      }

      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();

      // Check for multi-line indicator
      if (value === '>' || value === '>-' || value === '|' || value === '|-') {
        isMultiLine = true;
        currentValue = '';
      } else {
        isMultiLine = false;
        // Remove quotes if present
        let cleanValue = value;
        if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
            (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
          cleanValue = cleanValue.slice(1, -1);
        }
        result[currentKey] = cleanValue;
      }
    } else if (isMultiLine && line.startsWith('  ')) {
      // Multi-line continuation
      currentValue += (currentValue ? ' ' : '') + line.trim();
    }
  }

  // Save last multi-line value
  if (currentKey && isMultiLine && currentValue) {
    result[currentKey] = currentValue.trim();
  }

  return result;
}

/**
 * Fetch post metadata from GitHub
 */
export async function fetchPostFromGitHub(
  category: "tech" | "life",
  slug: string
): Promise<PostMetadata | null> {
  try {
    // Fetch mdoc file from GitHub
    const mdocUrl = `${GITHUB_RAW_BASE}/content/${category}/${slug}.mdoc`;
    console.log(`[OG] Fetching from: ${mdocUrl}`);

    const response = await fetch(mdocUrl, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`[OG] Failed to fetch from GitHub: ${mdocUrl}, status: ${response.status}`);
      return null;
    }

    const content = await response.text();
    console.log(`[OG] Content length: ${content.length}`);

    const metadata = parseYamlFrontmatter(content);
    console.log(`[OG] Parsed metadata:`, JSON.stringify(metadata));

    return {
      title: metadata.title || `${category.charAt(0).toUpperCase() + category.slice(1)} Post`,
      summary: metadata.summary || "",
      thumbnailImage: metadata.thumbnailImage || null,
    };
  } catch (error) {
    console.error("[OG] Error fetching post from GitHub:", error);
    return null;
  }
}

export interface ThumbnailResult {
  data: ArrayBuffer;
  mimeType: string;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
  };
  return mimeTypes[ext || ''] || 'image/png';
}

/**
 * Check if image format is supported by @vercel/og
 */
function isSupportedFormat(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase();
  // @vercel/og only supports png, jpeg, gif - NOT webp
  return ['png', 'jpg', 'jpeg', 'gif'].includes(ext || '');
}

/**
 * Fetch thumbnail image data with MIME type
 * Returns null for unsupported formats (webp, etc.)
 * Tries local file first (for Vercel build), then falls back to URL fetch
 */
export async function fetchThumbnailData(
  thumbnailPath: string | null
): Promise<ThumbnailResult | null> {
  if (!thumbnailPath) return null;

  // Skip unsupported formats like webp
  if (!isSupportedFormat(thumbnailPath)) {
    console.log(`[OG] Skipping unsupported format: ${thumbnailPath}`);
    return null;
  }

  const mimeType = getMimeType(thumbnailPath);

  // Try reading from local public folder first (works during Vercel build)
  if (thumbnailPath.startsWith("/")) {
    try {
      const localPath = join(process.cwd(), "public", thumbnailPath);
      console.log(`[OG] Trying local file: ${localPath}`);
      const buffer = await readFile(localPath);
      console.log(`[OG] Local file read: ${buffer.length} bytes, type: ${mimeType}`);
      return {
        data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        mimeType,
      };
    } catch {
      console.log(`[OG] Local file not found, trying URL fetch`);
    }
  }

  // Fallback: fetch from URL
  try {
    const imageUrl = thumbnailPath.startsWith("http")
      ? thumbnailPath
      : `${SITE_BASE_URL}${thumbnailPath}`;

    console.log(`[OG] Fetching thumbnail: ${imageUrl}`);

    const response = await fetch(imageUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      console.error(`[OG] Failed to fetch thumbnail: ${imageUrl}, status: ${response.status}`);
      return null;
    }

    const data = await response.arrayBuffer();
    console.log(`[OG] Thumbnail fetched: ${data.byteLength} bytes, type: ${mimeType}`);

    return { data, mimeType };
  } catch (error) {
    console.error("[OG] Error fetching thumbnail:", error);
    return null;
  }
}
