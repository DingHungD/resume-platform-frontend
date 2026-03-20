// src/components/ui/MarkdownMessage.tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert 
                    prose-p:leading-relaxed prose-pre:bg-slate-800 
                    prose-headings:text-blue-600 dark:prose-headings:text-blue-400">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}