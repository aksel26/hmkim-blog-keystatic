import React from 'react';
import Markdoc, { Config } from '@markdoc/markdoc';
import { CodeBlock } from './CodeBlock';

interface MarkdocRendererProps {
    node: any; // Markdoc node
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
        <div className="prose mx-auto">
            {Markdoc.renderers.react(renderable, React, { components })}
        </div>
    );
}
