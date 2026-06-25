import React from "react";

export function renderTextWithBold(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-extrabold text-gray-950 dark:text-white">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export function SlimMarkdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-3 text-sm text-gray-900 leading-relaxed font-sans font-medium">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return (
            <h4
              key={idx}
              className="text-base font-black text-gray-950 italic uppercase tracking-wider pt-4 border-l-2 border-orange-500 pl-3"
            >
              {trimmed.replace("###", "").trim()}
            </h4>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h3
              key={idx}
              className="text-lg font-black text-gray-950 italic uppercase tracking-wider pt-6 pb-2 border-b border-gray-200"
            >
              {trimmed.replace("##", "").trim()}
            </h3>
          );
        }
        if (trimmed.startsWith("#")) {
          return (
            <h2
              key={idx}
              className="text-xl font-black text-orange-600 italic uppercase tracking-wider pt-8 pb-3"
            >
              {trimmed.replace("#", "").trim()}
            </h2>
          );
        }
        if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
          const content = trimmed.substring(1).trim();
          return (
            <div key={idx} className="flex gap-2 pl-4 text-gray-900">
              <span className="text-orange-600 font-bold">•</span>
              <span>{renderTextWithBold(content)}</span>
            </div>
          );
        }
        if (/^\d+\./.test(trimmed)) {
          const num = trimmed.match(/^\d+\./)?.[0] || "1.";
          const content = trimmed.replace(/^\d+\./, "").trim();
          return (
            <div key={idx} className="flex gap-2 pl-4 text-gray-900">
              <span className="text-orange-600 font-mono font-bold">{num}</span>
              <span>{renderTextWithBold(content)}</span>
            </div>
          );
        }
        if (trimmed === "") {
          return <div key={idx} className="h-2" />;
        }
        return <p key={idx} className="text-gray-900">{renderTextWithBold(line)}</p>;
      })}
    </div>
  );
}

export default SlimMarkdown;
