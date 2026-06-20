export interface TocItem {
    id: string;
    text: string;
    level: number;
}

type MarkdocNodeLike = {
    type?: string;
    attributes?: {
        level?: number;
        content?: unknown;
    };
    content?: unknown;
    children?: unknown;
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s가-힣-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function isMarkdocNodeLike(node: unknown): node is MarkdocNodeLike {
    return typeof node === 'object' && node !== null;
}

function getTextContent(node: unknown): string {
    if (!node) return '';
    if (typeof node === 'string') return node;

    // Handle array
    if (Array.isArray(node)) {
        return node.map(getTextContent).join('');
    }

    // Handle text nodes with content property (Markdoc format)
    if (isMarkdocNodeLike(node) && typeof node.attributes?.content === 'string') {
        return node.attributes.content;
    }

    // Check for content directly on node
    if (isMarkdocNodeLike(node) && typeof node.content === 'string') {
        return node.content;
    }

    // Recursively handle children
    if (isMarkdocNodeLike(node) && node.children) {
        return getTextContent(node.children);
    }

    return '';
}

// Helper function to extract TOC from Markdoc node
export function extractTocFromMarkdoc(node: unknown): TocItem[] {
    const items: TocItem[] = [];
    const usedIds = new Map<string, number>();

    function traverse(node: unknown) {
        if (!node) return;

        if (
            isMarkdocNodeLike(node) &&
            node.type === 'heading' &&
            typeof node.attributes?.level === 'number' &&
            node.attributes.level >= 2 &&
            node.attributes.level <= 4
        ) {
            const text = getTextContent(node);
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
                    level: node.attributes.level,
                });
        }

        if (isMarkdocNodeLike(node) && Array.isArray(node.children)) {
            node.children.forEach(traverse);
        }
    }

    traverse(node);
    return items;
}
