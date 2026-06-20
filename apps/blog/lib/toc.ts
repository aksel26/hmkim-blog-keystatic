export interface TocItem {
    id: string;
    text: string;
    level: number;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s가-힣-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

interface MarkdocLikeNode {
    type?: string;
    attributes?: {
        content?: unknown;
        level?: unknown;
    };
    content?: unknown;
    children?: unknown;
}

function getTextContent(node: unknown): string {
    if (!node) return '';
    if (typeof node === 'string') return node;

    // Handle array
    if (Array.isArray(node)) {
        return node.map(getTextContent).join('');
    }

    // Handle text nodes with content property (Markdoc format)
    if (typeof node === 'object') {
        const markdocNode = node as MarkdocLikeNode;

        if (typeof markdocNode.attributes?.content === 'string') {
            return markdocNode.attributes.content;
        }

        if (typeof markdocNode.content === 'string') {
            return markdocNode.content;
        }

        if (markdocNode.children) {
            return getTextContent(markdocNode.children);
        }
    }

    return '';
}

// Helper function to extract TOC from Markdoc node
export function extractTocFromMarkdoc(node: unknown): TocItem[] {
    const items: TocItem[] = [];
    const usedIds = new Map<string, number>();

    function traverse(node: unknown) {
        if (!node) return;

        if (typeof node !== 'object') return;

        const markdocNode = node as MarkdocLikeNode;
        const level = markdocNode.attributes?.level;

        if (markdocNode.type === 'heading' && typeof level === 'number' && level >= 2 && level <= 4) {
            const text = getTextContent(markdocNode);
            let id = slugify(text);

            // Handle empty or duplicate slugs
            if (!id) {
                id = `heading-${items.length}`;
            }

            // Make duplicate IDs unique by appending a number
            const count = usedIds.get(id) || 0;
            if (count > 0) {
                id = `${id}-${count}`;
            }
            usedIds.set(id.replace(/-\d+$/, ''), count + 1);

            items.push({
                id,
                text: text || `Heading ${items.length + 1}`,
                level,
            });
        }

        if (Array.isArray(markdocNode.children)) {
            markdocNode.children.forEach(traverse);
        }
    }

    traverse(node);
    return items;
}
