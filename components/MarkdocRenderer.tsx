import React from 'react';
import Markdoc, { Config, nodes, Tag } from '@markdoc/markdoc';
import Image from 'next/image';
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
        image: {
            render: 'Image',
            attributes: {
                src: { type: String, required: true },
                alt: { type: String },
                title: { type: String },
            },
        },
        table: {
            render: 'Table',
        },
        th: {
            render: 'Th',
        },
        td: {
            render: 'Td',
        },
    },
    tags: {
        video: {
            render: 'Video',
            attributes: {
                src: { type: String, required: true },
                autoplay: { type: Boolean, default: true },
                loop: { type: Boolean, default: true },
                muted: { type: Boolean, default: true },
                controls: { type: Boolean, default: false },
                width: { type: String },
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
    Image: ({ src, alt, title }: { src: string; alt?: string; title?: string }) => (
        <span className="block relative w-full">
            <Image
                src={src}
                alt={alt || ''}
                title={title}
                width={800}
                height={600}
                className="rounded-lg object-cover w-full h-auto"
                sizes="(max-width: 768px) 100vw, 800px"
            />
        </span>
    ),
    Table: ({ children }: { children: React.ReactNode }) => (
        <table className="w-full table-fixed border-collapse">
            {children}
        </table>
    ),
    Th: ({ children }: { children: React.ReactNode }) => (
        <th className="p-2 align-top">{children}</th>
    ),
    Td: ({ children }: { children: React.ReactNode }) => (
        <td className="p-2 align-top">{children}</td>
    ),
    Video: ({
        src,
        autoplay,
        loop,
        muted,
        controls,
        width,
    }: {
        src: string;
        autoplay?: boolean;
        loop?: boolean;
        muted?: boolean;
        controls?: boolean;
        width?: string;
    }) => (
        <video
            src={src}
            autoPlay={autoplay}
            loop={loop}
            muted={muted}
            controls={controls}
            playsInline
            style={{ width: width || '100%', maxWidth: '100%' }}
            className="rounded-lg"
        />
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
