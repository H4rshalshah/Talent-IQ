import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Loader2Icon, PlayIcon, SendIcon } from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";

// Letter chip shown for languages without an icon asset
function LanguageBadge({ lang }) {
  const cfg = LANGUAGE_CONFIG[lang];
  if (cfg?.icon) {
    return <img src={cfg.icon} alt={cfg.name} className="size-6 rounded-sm" />;
  }
  return (
    <span className="size-6 rounded-sm bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
      {(cfg?.name || lang).slice(0, 2).toUpperCase()}
    </span>
  );
}

function CodeEditorPanel({
  selectedLanguage,
  languages,
  code,
  isRunning,
  onLanguageChange,
  onCodeChange,
  onRunCode,
  onSubmit,
  isSubmitting,
}) {
  const available = (languages && languages.length ? languages : Object.keys(LANGUAGE_CONFIG)).filter(
    (l) => LANGUAGE_CONFIG[l]?.executable
  );
  const cfg = LANGUAGE_CONFIG[selectedLanguage];

  // follow the app theme (light -> "vs", dark -> "vs-dark")
  const [editorTheme, setEditorTheme] = useState(() =>
    document.documentElement.dataset.theme === "gfg-dark" ? "vs-dark" : "vs"
  );
  useEffect(() => {
    const el = document.documentElement;
    const apply = () => setEditorTheme(el.dataset.theme === "gfg-dark" ? "vs-dark" : "vs");
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-full bg-base-300 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-base-100 border-t border-base-300 flex-wrap">
        <div className="flex items-center gap-3">
          <LanguageBadge lang={selectedLanguage} />
          <select className="select select-sm" value={selectedLanguage} onChange={onLanguageChange}>
            {available.map((key) => (
              <option key={key} value={key}>
                {LANGUAGE_CONFIG[key].name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {onSubmit && (
            <button
              className="btn btn-success btn-sm gap-1.5"
              disabled={isSubmitting || !code?.trim()}
              onClick={onSubmit}
              title="Run against the full test suite (sample + hidden)"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Judging...
                </>
              ) : (
                <>
                  <SendIcon className="size-4" />
                  Submit
                </>
              )}
            </button>
          )}
          <button className="btn btn-primary btn-sm gap-1.5" disabled={isRunning} onClick={onRunCode}>
            {isRunning ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="size-4" />
                Run Code
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={cfg?.monacoLang || "plaintext"}
          value={code}
          onChange={onCodeChange}
          theme={editorTheme}
          options={{
            fontSize: 15,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: false },
          }}
        />
      </div>
    </div>
  );
}
export default CodeEditorPanel;
