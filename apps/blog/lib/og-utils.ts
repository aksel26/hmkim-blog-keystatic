/**
 * OG Image generation utilities
 * Fetches post data directly from GitHub for dynamic OG image generation
 */

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

/**
 * Fetch thumbnail image data
 */
export async function fetchThumbnailData(
  thumbnailPath: string | null
): Promise<ArrayBuffer | null> {
  if (!thumbnailPath) return null;

  try {
    // If it's already a full URL, use it directly
    const imageUrl = thumbnailPath.startsWith("http")
      ? thumbnailPath
      : `${SITE_BASE_URL}${thumbnailPath}`;

    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error(`Failed to fetch thumbnail: ${imageUrl}`);
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error("Error fetching thumbnail:", error);
    return null;
  }
}
