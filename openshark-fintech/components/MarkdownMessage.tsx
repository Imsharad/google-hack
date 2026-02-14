import React from 'react';

// ── Inline parser ──────────────────────────────────────────────────
// Converts markdown inline syntax to React elements.
// Order matters: bold-italic before bold before italic.

export function renderInline(text: string): React.ReactNode[] {
  // Regex for inline patterns — ordered by specificity
  const pattern =
    /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+?)`)|(\[([^\]]+)\]\(([^)]+)\))/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Push text before the match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // ***bold italic***
      nodes.push(
        <strong key={match.index} className="font-semibold italic">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // **bold**
      nodes.push(
        <strong key={match.index} className="font-semibold text-airbnb-black">
          {match[4]}
        </strong>
      );
    } else if (match[5]) {
      // *italic*
      nodes.push(
        <em key={match.index} className="italic text-airbnb-dark">
          {match[6]}
        </em>
      );
    } else if (match[7]) {
      // `inline code`
      nodes.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-stone-100 text-[13px] font-mono font-medium text-airbnb-black"
        >
          {match[8]}
        </code>
      );
    } else if (match[9]) {
      // [link](url)
      nodes.push(
        <a
          key={match.index}
          href={match[11]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-airbnb-red hover:underline underline-offset-2 font-medium"
        >
          {match[10]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

// ── Block-level renderer ───────────────────────────────────────────

interface Props {
  text: string;
}

const MarkdownMessage: React.FC<Props> = ({ text }) => {
  // 1. Split by fenced code blocks first
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  const segments: { type: 'text' | 'code'; content: string; lang?: string }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = codeBlockRegex.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', content: text.slice(last, m.index) });
    }
    segments.push({ type: 'code', content: m[2].trimEnd(), lang: m[1] || undefined });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    segments.push({ type: 'text', content: text.slice(last) });
  }

  return (
    <div className="md-msg space-y-3">
      {segments.map((seg, si) =>
        seg.type === 'code' ? (
          <div key={si} className="rounded-xl overflow-hidden my-3">
            {seg.lang && (
              <div className="bg-[#1e1e2e] px-4 py-2 flex items-center">
                <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
                  {seg.lang}
                </span>
              </div>
            )}
            <pre
              className={`bg-[#1e1e2e] text-stone-200 text-[13px] leading-relaxed font-mono px-4 py-3 overflow-x-auto ${
                seg.lang ? '' : 'rounded-xl'
              }`}
            >
              <code>{seg.content}</code>
            </pre>
          </div>
        ) : (
          <TextBlock key={si} content={seg.content} />
        )
      )}
    </div>
  );
};

// Renders a non-code text block — handles paragraphs, headers, lists, hr
const TextBlock: React.FC<{ content: string }> = ({ content }) => {
  // Split into paragraphs by double newline
  const paragraphs = content.split(/\n{2,}/);

  return (
    <>
      {paragraphs.map((para, pi) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Check if this paragraph is actually a list block
        const lines = trimmed.split('\n');
        const isUnorderedList = lines.every(
          (l) => /^\s*[-*]\s/.test(l) || l.trim() === ''
        );
        const isOrderedList = lines.every(
          (l) => /^\s*\d+[.)]\s/.test(l) || l.trim() === ''
        );

        if (isUnorderedList) {
          return (
            <ul key={pi} className="space-y-1.5 my-1">
              {lines
                .filter((l) => l.trim())
                .map((line, li) => {
                  const text = line.replace(/^\s*[-*]\s+/, '');
                  return (
                    <li key={li} className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                      <span className="mt-[9px] w-[5px] h-[5px] rounded-full bg-airbnb-gray/50 shrink-0" />
                      <span>{renderInline(text)}</span>
                    </li>
                  );
                })}
            </ul>
          );
        }

        if (isOrderedList) {
          return (
            <ol key={pi} className="space-y-1.5 my-1">
              {lines
                .filter((l) => l.trim())
                .map((line, li) => {
                  const text = line.replace(/^\s*\d+[.)]\s+/, '');
                  return (
                    <li key={li} className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                      <span className="mt-[1px] text-[13px] font-semibold text-airbnb-gray/70 tabular-nums shrink-0 min-w-[18px] text-right">
                        {li + 1}.
                      </span>
                      <span>{renderInline(text)}</span>
                    </li>
                  );
                })}
            </ol>
          );
        }

        // Process line-by-line for headers, hr, or regular text
        return (
          <React.Fragment key={pi}>
            {lines.map((line, li) => {
              const t = line.trim();
              if (!t) return null;

              // Horizontal rule
              if (/^[-*_]{3,}$/.test(t)) {
                return <hr key={li} className="border-airbnb-line my-3" />;
              }

              // Headers
              if (t.startsWith('### ')) {
                return (
                  <h4 key={li} className="text-[15px] font-semibold text-airbnb-black mt-3 mb-1">
                    {renderInline(t.slice(4))}
                  </h4>
                );
              }
              if (t.startsWith('## ')) {
                return (
                  <h3 key={li} className="text-base font-bold text-airbnb-black mt-3 mb-1">
                    {renderInline(t.slice(3))}
                  </h3>
                );
              }
              if (t.startsWith('# ')) {
                return (
                  <h2 key={li} className="text-lg font-bold text-airbnb-black mt-3 mb-1">
                    {renderInline(t.slice(2))}
                  </h2>
                );
              }

              // Blockquote
              if (t.startsWith('> ')) {
                return (
                  <blockquote
                    key={li}
                    className="border-l-[3px] border-airbnb-red/30 pl-4 py-0.5 text-airbnb-dark italic"
                  >
                    {renderInline(t.slice(2))}
                  </blockquote>
                );
              }

              // Regular paragraph line
              return (
                <p key={li} className="text-[15px] leading-[1.7] text-airbnb-dark">
                  {renderInline(t)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default MarkdownMessage;
