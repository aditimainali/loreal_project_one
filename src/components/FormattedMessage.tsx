import React from "react";

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-[#111111]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c8002e] underline decoration-[#e3a535] underline-offset-2 hover:text-[#ff003b]"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

interface FormattedMessageProps {
  content: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  const lines = content.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: { ordered: boolean; items: string[] } | null = null;

  const flushList = (keyPrefix: string) => {
    if (!listItems) return;
    if (listItems.ordered) {
      blocks.push(
        <ol
          key={`${keyPrefix}-ol`}
          className="my-2 list-decimal space-y-1.5 ps-5 text-sm leading-relaxed text-[#2a2826]"
        >
          {listItems.items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    } else {
      blocks.push(
        <ul
          key={`${keyPrefix}-ul`}
          className="my-2 list-disc space-y-1.5 ps-5 text-sm leading-relaxed text-[#2a2826]"
        >
          {listItems.items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    listItems = null;
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList(`empty-${index}`);
      return;
    }

    if (line.startsWith("### ") || line.startsWith("## ") || line.startsWith("# ")) {
      flushList(`heading-${index}`);
      const cleanHeading = line.replace(/^#{1,3}\s+/, "");
      blocks.push(
        <h4
          key={`h-${index}`}
          className="mt-3.5 mb-1.5 border-b border-black/10 pb-1 font-display text-lg font-semibold text-[#111111] first:mt-0"
        >
          {renderInline(cleanHeading)}
        </h4>
      );
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (!listItems || !listItems.ordered) {
        flushList(`switch-ol-${index}`);
        listItems = { ordered: true, items: [] };
      }
      listItems.items.push(orderedMatch[1]);
      return;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      if (!listItems || listItems.ordered) {
        flushList(`switch-ul-${index}`);
        listItems = { ordered: false, items: [] };
      }
      listItems.items.push(bulletMatch[1]);
      return;
    }

    flushList(`para-${index}`);
    blocks.push(
      <p key={`p-${index}`} className="my-1.5 text-sm leading-relaxed text-[#2a2826]">
        {renderInline(line)}
      </p>
    );
  });

  flushList("end");

  return <div className="space-y-1">{blocks}</div>;
};
