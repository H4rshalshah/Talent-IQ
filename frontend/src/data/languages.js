/**
 * Language support matrix for the editor.
 *
 * `executable: true` means the sandbox runtime is verified to work for run +
 * submit + judge. Languages that cannot run reliably are `false` so they are
 * never selectable but still render (with a badge) if code references them.
 * This list must stay in sync with `EXECUTABLE_LANGUAGES` in
 * backend/src/services/problems/executor.service.js — the backend rejects any
 * language it cannot execute.
 */
export const LANGUAGE_CONFIG = {
  javascript: { name: "JavaScript", icon: "/javascript.png", monacoLang: "javascript", executable: true },
  python: { name: "Python", icon: "/python.png", monacoLang: "python", executable: true },
  java: { name: "Java", icon: "/java.png", monacoLang: "java", executable: true },
  c: { name: "C", icon: "", monacoLang: "c", executable: true },
  cpp: { name: "C++", icon: "", monacoLang: "cpp", executable: true },
  csharp: { name: "C#", icon: "", monacoLang: "csharp", executable: true },
  go: { name: "Go", icon: "", monacoLang: "go", executable: true },
  rust: { name: "Rust", icon: "", monacoLang: "rust", executable: true },
  php: { name: "PHP", icon: "", monacoLang: "php", executable: true },
  ruby: { name: "Ruby", icon: "", monacoLang: "ruby", executable: true },
  typescript: { name: "TypeScript", icon: "", monacoLang: "typescript", executable: false },
  kotlin: { name: "Kotlin", icon: "", monacoLang: "kotlin", executable: false },
  swift: { name: "Swift", icon: "", monacoLang: "swift", executable: false },
};

export const EXECUTABLE_LANGUAGES = Object.entries(LANGUAGE_CONFIG)
  .filter(([, cfg]) => cfg.executable)
  .map(([key]) => key);
