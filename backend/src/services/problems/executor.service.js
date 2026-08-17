// Sandboxed code execution via the Wandbox public API.
//
// NOTE: the previous backend (Piston / emkc.org) became whitelist-only on
// 2026-02-15, so execution was migrated to Wandbox (free, no key required).
// Wandbox covers 12 of the 13 target languages — Kotlin has no Wandbox
// compiler, so it is excluded from the language selector (its codegen
// template is kept for when a Kotlin runtime is configured). For full 13/13
// coverage, self-host Piston via Docker (see README) and swap
// CODE_EXECUTION_URL/CODE_EXECUTION_PROVIDER.

const WANDBOX_URL = "https://wandbox.org/api/compile.json";

// language key -> Wandbox compiler name
// Kotlin, Swift and TypeScript are deliberately absent: Wandbox has no Kotlin
// compiler, its Swift runtime is currently broken ("failed to exec pid1"), and
// its TypeScript wrapper hardcodes an es5 lib that cannot typecheck Map/etc.
// Those languages never appear in the selector until a working runtime is
// wired up (self-hosted Piston via Docker restores all 13 — see README).
const WANDBOX_COMPILERS = {
  javascript: "nodejs-20.17.0",
  python: "cpython-3.13.8",
  java: "openjdk-jdk-22+36",
  c: "gcc-13.2.0-c",
  cpp: "gcc-13.2.0",
  csharp: "mono-6.12.0.199",
  go: "go-1.23.2",
  rust: "rust-1.82.0",
  php: "php-8.3.12",
  ruby: "ruby-4.0.2",
};

// C++ is compiled by the gcc compiler with an explicit -x c++ flag
const COMPILER_OPTIONS = {
  cpp: "-x c++ -std=c++17 -O2",
};

export const EXECUTABLE_LANGUAGES = Object.keys(WANDBOX_COMPILERS);

/**
 * Execute source code in the Wandbox sandbox.
 * @returns {Promise<{success:boolean, output:string, error?:string}>}
 */
export async function executePiston(language, code) {
  const compiler = WANDBOX_COMPILERS[language];
  if (!compiler) return { success: false, output: "", error: `Unsupported language: ${language}` };

  try {
    const res = await fetch(WANDBOX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler,
        code,
        stdin: "",
        options: COMPILER_OPTIONS[language] || "",
      }),
    });

    if (!res.ok) {
      return { success: false, output: "", error: `Execution service error (HTTP ${res.status})` };
    }

    const data = await res.json();
    const output = data.program_output || "";
    const compilerError = data.compiler_error || data.compiler_message || "";
    const programError = data.program_error || "";
    const signal = data.signal || "";

    if (signal) {
      return { success: false, output, error: `Execution terminated (${signal})` };
    }
    if (compilerError) {
      return { success: false, output, error: compilerError.slice(0, 2000) };
    }
    if (programError) {
      return { success: false, output, error: programError.slice(0, 2000) };
    }
    if (data.status !== "0" && !output) {
      return { success: false, output, error: "Execution failed" };
    }

    return { success: true, output: output || "No output" };
  } catch (error) {
    return { success: false, output: "", error: `Failed to execute code: ${error.message}` };
  }
}

/**
 * Normalize an output line for comparison: trim, lowercase (so Python's True
 * matches JS true), and collapse whitespace around brackets/commas so array
 * prints match across languages.
 */
export function normalizeLine(line) {
  return line
    .trim()
    .toLowerCase()
    .replace(/\[\s+/g, "[")
    .replace(/\s+\]/g, "]")
    .replace(/\s*,\s*/g, ",");
}
