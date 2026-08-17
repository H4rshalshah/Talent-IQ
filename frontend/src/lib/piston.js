// Code execution via the Wandbox public API.
// (Piston/emkc.org became whitelist-only on 2026-02-15, so execution moved to
// Wandbox — free, no key. Mirrors backend/src/services/problems/executor.service.js.)

const WANDBOX_URL = "https://wandbox.org/api/compile.json";

// language key -> Wandbox compiler name
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

const COMPILER_OPTIONS = {
  cpp: "-x c++ -std=c++17 -O2",
};

/**
 * @param {string} language - programming language
 * @param {string} code - source code to execute
 * @returns {Promise<{success:boolean, output?:string, error?:string}>}
 */
export async function executeCode(language, code) {
  const compiler = WANDBOX_COMPILERS[language];

  if (!compiler) {
    return {
      success: false,
      error: `Unsupported language: ${language}`,
    };
  }

  try {
    const response = await fetch(WANDBOX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        compiler,
        code,
        stdin: "",
        options: COMPILER_OPTIONS[language] || "",
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Execution service error (HTTP ${response.status})` };
    }

    const data = await response.json();
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

    return {
      success: true,
      output: output || "No output",
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to execute code: ${error.message}`,
    };
  }
}
