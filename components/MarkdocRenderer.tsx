import React from 'react';
import Markdoc, { Config, nodes, Tag } from '@markdoc/markdoc';
import { CodeBlock } from './CodeBlock';

interface MarkdocRendererProps {
    node: any; // Markdoc node
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

const config: Config = {
    nodes: {
        fence: {
            render: 'CodeBlock',
            attributes: {
                language: {
                    type: String,
                },
            },
        },
        heading: {
            ...nodes.heading,
            transform(node, config) {
                const attributes = node.transformAttributes(config);
                const children = node.transformChildren(config);
                const text = getTextContent(node.children);
                const id = slugify(text);

                return new Tag(
                    `h${node.attributes['level']}`,
                    { ...attributes, id },
                    children
                );
            },
        },
    },
};

const components = {
    CodeBlock: ({ language, children }: { language?: string; children: string }) => (
        <CodeBlock className={language ? `language-${language}` : undefined}>
            {children}
        </CodeBlock>
    ),
};

export function MarkdocRenderer({ node }: MarkdocRendererProps) {
    const renderable = Markdoc.transform(node, config);
    return (
        <div className="prose dark:prose-invert mx-auto max-w-none">
            {Markdoc.renderers.react(renderable, React, { components })}
        </div>
    );
}
