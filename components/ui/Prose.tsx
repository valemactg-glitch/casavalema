import { clsx } from "clsx";

/** Render mínimo de Markdown para documentos legales y de contenido. */
export function Prose({ markdown, className }: { markdown: string; className?: string }) {
  const blocks = markdown.trim().split(/\n{2,}/);
  return (
    <div className={clsx("space-y-4 text-[14px] leading-relaxed text-ink-2", className)}>
      {blocks.map((block, i) => {
        const line = block.trim();
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="pt-2 text-[17px] text-ink">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="pt-3 text-[20px] text-ink">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-[26px] text-ink">
              {line.slice(2)}
            </h1>
          );
        }
        if (/^[-*] /.test(line)) {
          const items = line.split("\n").map((l) => l.replace(/^[-*] /, ""));
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5">
              {items.map((it, j) => (
                <li key={j}>{renderInline(it)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>{renderInline(line)}</p>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  // sólo **negrita** y _cursiva_
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("_") && p.endsWith("_")) {
      return <em key={i}>{p.slice(1, -1)}</em>;
    }
    return <span key={i}>{p}</span>;
  });
}
