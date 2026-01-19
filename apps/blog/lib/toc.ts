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

function getTextContent(node: any): string {
    if (!node) return '';
    if (typeof node === 'string') return node;

    // Handle array
    if (Array.isArray(node)) {
        return node.map(getTextContent).join('');
    }

    // Handle text nodes with content property (Markdoc format)
    if (node.attributes?.content && typeof node.attributes.content === 'string') {
        return node.attributes.content;
    }

    // Check for content directly on node
    if (typeof node.content === 'string') {
        return node.content;
    }

    // Recursively handle children
    if (node.children) {
        return getTextContent(node.children);
    }

    return '';
}

// Helper function to extract TOC from Markdoc node
export function extractTocFromMarkdoc(node: any): TocItem[] {
    const items: TocItem[] = [];
    const usedIds = new Map<string, number>();

    function traverse(node: any) {
        if (!node) return;

        if (node.type === 'heading' && node.attributes?.level >= 2 && node.attributes?.level <= 4) {
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

        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(traverse);
        }
    }

    traverse(node);
    return items;
}
