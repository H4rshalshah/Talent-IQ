import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders markdown safely.
 *
 * react-markdown does NOT render raw HTML unless rehype-raw is added, so
 * model output and problem statements can never inject markup (prompt
 * injection through AI text cannot become an XSS vector). Styling lives in
 * the `.md-content` scope in index.css so every markdown surface looks the
 * same and long content wraps instead of overflowing.
 */
export default function Markdown({ children, className = "" }) {
  if (children == null || children === "") return null;
  return (
    <div className={`md-content ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(children)}</ReactMarkdown>
    </div>
  );
}
