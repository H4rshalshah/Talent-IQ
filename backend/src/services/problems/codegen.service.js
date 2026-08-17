// ---------------------------------------------------------------------------
// Starter-code generator.
//
// Takes a language-neutral problem spec and produces, for each supported
// language, a starter file containing:
//   - the function stub the candidate fills in ("// Write your solution here")
//   - a test harness that calls the function on the sample tests and prints
//     the results in ONE canonical format (JSON-style: [0,1], true, "x")
//
// Because every language prints the same canonical shape, a single expected
// output string is shared across all languages, and the frontend comparison
// stays language-agnostic.
//
// Supported param/return types: int, string, bool, int[], string[], char[],
// and void (for in-place problems, where the runner prints the first
// (mutated) argument instead of a return value).
// ---------------------------------------------------------------------------

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "kotlin",
  "swift",
  "php",
  "ruby",
];

function stringEscape(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function canonicalExpected(tests) {
  return tests.map((t) => t.expected).join("\n");
}

// ---------------------------------------------------------------------------
// JavaScript / TypeScript
// ---------------------------------------------------------------------------

function jsTypes(type) {
  return {
    int: "number",
    string: "string",
    bool: "boolean",
    "int[]": "number[]",
    "string[]": "string[]",
    "char[]": "string[]",
  }[type] || type;
}

function generateJavaScript(spec) {
  const { fn, params, returns } = spec;
  const defaultReturn = returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? '""' : "[]";
  const fmtHelper = `function fmt(v) {
  if (Array.isArray(v)) return "[" + v.map(fmt).join(",") + "]";
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}`;
  const calls = spec.tests.map((t) => {
    if (returns === "void") {
      const arg = JSON.stringify(t.args[0]);
      return `const t = ${arg};\n${fn}(t);\nconsole.log(fmt(t));`;
    }
    const args = t.args.map(JSON.stringify).join(", ");
    return `console.log(fmt(${fn}(${args})));`;
  });
  return `function ${fn}(${params.map((p) => p.name).join(", ")}) {
  // Write your solution here
  ${returns === "void" ? "" : `return ${defaultReturn};`}
}

// --- test harness (do not modify) ---
${fmtHelper}
${calls.join("\n")}`;
}

function generateTypeScript(spec) {
  const { fn, params, returns } = spec;
  const defaultReturn = returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? '""' : "[]";
  const fmtHelper = `function fmt(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(fmt).join(",") + "]";
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}`;
  const calls = spec.tests.map((t) => {
    if (returns === "void") {
      const arg = JSON.stringify(t.args[0]);
      return `const t: ${jsTypes(params[0].type)} = ${arg};\n${fn}(t);\nconsole.log(fmt(t));`;
    }
    const args = t.args.map(JSON.stringify).join(", ");
    return `console.log(fmt(${fn}(${args})));`;
  });
  return `function ${fn}(${params.map((p) => `${p.name}: ${jsTypes(p.type)}`).join(", ")}): ${returns === "void" ? "void" : jsTypes(returns)} {
  // Write your solution here
  ${returns === "void" ? "" : `return ${defaultReturn};`}
}

// --- test harness (do not modify) ---
${fmtHelper}
${calls.join("\n")}`;
}

// ---------------------------------------------------------------------------
// Python
// ---------------------------------------------------------------------------

function generatePython(spec) {
  const { fn, params, returns } = spec;
  const defaultReturn = returns === "bool" ? "False" : returns === "int" ? "0" : returns === "string" ? '""' : "[]";
  const fmtHelper = `def fmt(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return '"' + v + '"'
    if isinstance(v, list):
        return "[" + ",".join(fmt(x) for x in v) + "]"
    return str(v)`;
  const pyValue = (v) => {
    if (v === true) return "True";
    if (v === false) return "False";
    if (typeof v === "string") return JSON.stringify(v).replace(/"/g, "'");
    if (Array.isArray(v)) return "[" + v.map(pyValue).join(", ") + "]";
    return String(v);
  };
  const calls = spec.tests.map((t) => {
    if (returns === "void") {
      return `t = ${pyValue(t.args[0])}\n${fn}(t)\nprint(fmt(t))`;
    }
    const args = t.args.map(pyValue).join(", ");
    return `print(fmt(${fn}(${args})))`;
  });
  return `def ${fn}(${params.map((p) => p.name).join(", ")}):
    # Write your solution here
    ${returns === "void" ? "pass" : `return ${defaultReturn}`}

# --- test harness (do not modify) ---
${fmtHelper}

${calls.join("\n")}`;
}

// ---------------------------------------------------------------------------
// Java
// ---------------------------------------------------------------------------

function generateJava(spec) {
  const { fn, params, returns } = spec;
  const jTypes = { int: "int", string: "String", bool: "boolean", "int[]": "int[]", "string[]": "String[]", "char[]": "char[]" };
  const defaultReturn =
    returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? '""' : returns === "char[]" ? "new char[0]" : returns === "string[]" ? "new String[0]" : "new int[0]";

  const fmtMethods = {
    "int[]": `static String fmt(int[] v) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(v[i]); }
        return sb.append("]").toString();
    }`,
    "string[]": `static String fmt(String[] v) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append("\\"").append(v[i]).append("\\""); }
        return sb.append("]").toString();
    }`,
    "char[]": `static String fmt(char[] v) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append("\\"").append(v[i]).append("\\""); }
        return sb.append("]").toString();
    }`,
    int: `static String fmt(int v) { return String.valueOf(v); }`,
    string: `static String fmt(String v) { return "\\"" + v + "\\""; }`,
    bool: `static String fmt(boolean v) { return v ? "true" : "false"; }`,
  };
  const fmtSource = returns === "void" ? fmtMethods["char[]"] : fmtMethods[returns];

  const jLit = (type, value) => {
    switch (type) {
      case "int":
        return String(value);
      case "string":
        return `"${stringEscape(value)}"`;
      case "bool":
        return String(value);
      case "int[]":
        return `new int[]{${value.join(",")}}`;
      case "string[]":
        return `new String[]{${value.map((s) => `"${stringEscape(s)}"`).join(",")}}`;
      case "char[]":
        return `new char[]{${value.map((c) => `'${c}'`).join(",")}}`;
      default:
        return String(value);
    }
  };

  const calls = spec.tests.map((t) => {
    if (returns === "void") {
      const arg = jLit(params[0].type, t.args[0]);
      return `char[] t = ${arg};\n        ${fn}(t);\n        System.out.println(fmt(t));`;
    }
    const args = t.args.map((a, i) => jLit(params[i].type, a)).join(", ");
    return `System.out.println(fmt(${fn}(${args})));`;
  });

  return `import java.util.*;

class Solution {
    public static ${returns === "void" ? "void" : jTypes[returns]} ${fn}(${params.map((p) => `${jTypes[p.type]} ${p.name}`).join(", ")}) {
        // Write your solution here
        ${returns === "void" ? "" : `return ${defaultReturn};`}
    }

    // --- test harness (do not modify) ---
    ${fmtSource}

    public static void main(String[] args) {
        ${calls.join("\n        ")}
    }
}`;
}

// ---------------------------------------------------------------------------
// C  — array params get an implicit size param (<name>Size); array returns
// get an int* returnSize out-param (LeetCode C convention).
// ---------------------------------------------------------------------------

function generateC(spec) {
  const { fn, params, returns } = spec;
  const cType = { int: "int", string: "char*", bool: "bool", "int[]": "int*", "string[]": "char**", "char[]": "char*" };

  const sigParams = [];
  for (const p of params) {
    sigParams.push(`${cType[p.type]} ${p.name}`);
    if (p.type.endsWith("[]")) sigParams.push(`int ${p.name}Size`);
  }
  if (returns.endsWith("[]")) sigParams.push("int* returnSize");
  const sig = `${returns === "void" ? "void" : cType[returns]} ${fn}(${sigParams.join(", ")})`;

  const printFns = {
    "int[]": `static void printIntArray(int* arr, int n) {
    printf("[");
    for (int i = 0; i < n; i++) { if (i) printf(","); printf("%d", arr[i]); }
    printf("]");
}`,
    "string[]": `static void printStringArray(char** arr, int n) {
    printf("[");
    for (int i = 0; i < n; i++) { if (i) printf(","); printf("\\"%s\\"", arr[i]); }
    printf("]");
}`,
    "char[]": `static void printCharArray(char* arr, int n) {
    printf("[");
    for (int i = 0; i < n; i++) { if (i) printf(","); printf("\\"%c\\"", arr[i]); }
    printf("]");
}`,
  };
  const printFn = returns === "void" ? printFns["char[]"] : printFns[returns];

  const cLit = (type, value) => {
    switch (type) {
      case "int":
        return String(value);
      case "string":
        return `"${stringEscape(value)}"`;
      case "bool":
        return String(value);
      case "int[]":
        return `{${value.join(",")}}`;
      case "string[]":
        return `{${value.map((s) => `"${stringEscape(s)}"`).join(",")}}`;
      case "char[]":
        return `{${value.map((c) => `'${c}'`).join(",")}}`;
      default:
        return String(value);
    }
  };

  const callBlocks = spec.tests.map((t, idx) => {
    const lines = ["    {"];
    const refs = [];
    params.forEach((p, i) => {
      const v = t.args[i];
      if (p.type.endsWith("[]")) {
        const n = `__a${idx}_${i}`;
        lines.push(`        ${cType[p.type].replace("*", "")} ${n}[] = ${cLit(p.type, v)};`);
        lines.push(`        int ${n}Size = ${v.length};`);
        refs.push(n, `${n}Size`);
      } else {
        refs.push(cLit(p.type, v));
      }
    });
    if (returns.endsWith("[]")) {
      const resVar = `__res${idx}`;
      lines.push("        int returnSize;");
      lines.push(`        ${cType[returns]} ${resVar} = ${fn}(${[...refs, "&returnSize"].join(", ")});`);
      const printCall = returns === "int[]" ? "printIntArray" : returns === "string[]" ? "printStringArray" : "printCharArray";
      lines.push(`        ${printCall}(${resVar}, returnSize);`);
      lines.push('        printf("\\n");');
      lines.push(`        free(${resVar});`);
    } else if (returns === "void") {
      const n = `__a${idx}_0`;
      lines.push(`        ${fn}(${refs.join(", ")});`);
      lines.push(`        printCharArray(${n}, ${n}Size);`);
      lines.push('        printf("\\n");');
    } else if (returns === "int") {
      lines.push(`        printf("%d\\n", ${fn}(${refs.join(", ")}));`);
    } else if (returns === "bool") {
      lines.push(`        printf("%s\\n", ${fn}(${refs.join(", ")}) ? "true" : "false");`);
    } else {
      lines.push(`        printf("%s\\n", ${fn}(${refs.join(", ")}));`);
    }
    lines.push("    }");
    return lines.join("\n");
  });

  return `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
${sig} {
    // Write your solution here
    ${
      returns === "void"
        ? ""
        : returns.endsWith("[]")
          ? "*returnSize = 0;\n    return NULL;"
          : `return ${returns === "bool" ? "false" : returns === "int" ? "0" : '""'};`
    }
}

// --- test harness (do not modify) ---
${printFn ? printFn : ""}

int main(void) {
${callBlocks.join("\n")}
    return 0;
}`;
}

// ---------------------------------------------------------------------------
// C++
// ---------------------------------------------------------------------------

function generateCpp(spec) {
  const { fn, params, returns } = spec;
  const cppType = { int: "int", string: "string", bool: "bool", "int[]": "vector<int>", "string[]": "vector<string>", "char[]": "vector<char>" };
  const defaultReturn = returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? '""' : "{}";
  const fmtFns = {
    "int[]": `static string fmt(const vector<int>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += to_string(v[i]); }
    return s + "]";
}`,
    "string[]": `static string fmt(const vector<string>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += "\\"" + v[i] + "\\""; }
    return s + "]";
}`,
    "char[]": `static string fmt(const vector<char>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) s += ","; s += string("\\"") + v[i] + "\\""; }
    return s + "]";
}`,
    int: `static string fmt(int v) { return to_string(v); }`,
    string: `static string fmt(const string& v) { return "\\"" + v + "\\""; }`,
    bool: `static string fmt(bool v) { return v ? "true" : "false"; }`,
  };
  const fmtSource = returns === "void" ? fmtFns["char[]"] : fmtFns[returns];

  const cppLit = (type, value) => {
    switch (type) {
      case "int":
        return String(value);
      case "string":
        return `"${stringEscape(value)}"`;
      case "bool":
        return String(value);
      case "int[]":
        return `{${value.join(",")}}`;
      case "string[]":
        return `{${value.map((s) => `"${stringEscape(s)}"`).join(",")}}`;
      case "char[]":
        return `{${value.map((c) => `'${c}'`).join(",")}}`;
      default:
        return String(value);
    }
  };

  const calls = spec.tests.map((t, idx) => {
    const lines = [];
    const refs = [];
    params.forEach((p, i) => {
      const v = t.args[i];
      if (p.type.endsWith("[]")) {
        const n = `__v${idx}_${i}`;
        lines.push(`    ${cppType[p.type]} ${n} = ${cppLit(p.type, v)};`);
        refs.push(n);
      } else {
        refs.push(cppLit(p.type, v));
      }
    });
    if (returns === "void") {
      lines.push(`    ${fn}(${refs.join(", ")});`);
      lines.push(`    cout << fmt(__v${idx}_0) << "\\n";`);
    } else {
      lines.push(`    cout << fmt(${fn}(${refs.join(", ")})) << "\\n";`);
    }
    return lines.join("\n");
  });

  const sigParams = params.map((p) => (p.type.endsWith("[]") ? `${cppType[p.type]}& ${p.name}` : `${cppType[p.type]} ${p.name}`));
  return `#include <bits/stdc++.h>
using namespace std;

${cppType[returns]} ${fn}(${sigParams.join(", ")}) {
    // Write your solution here
    ${returns === "void" ? "" : `return ${defaultReturn};`}
}

// --- test harness (do not modify) ---
${fmtSource}

int main() {
${calls.join("\n")}
    return 0;
}`;
}

// ---------------------------------------------------------------------------
// C#
// ---------------------------------------------------------------------------

function generateCsharp(spec) {
  const { fn, params, returns } = spec;
  const csType = { int: "int", string: "string", bool: "bool", "int[]": "int[]", "string[]": "string[]", "char[]": "char[]" };
  const csFn = fn.charAt(0).toUpperCase() + fn.slice(1);
  const defaultReturn = returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? '""' : "new int[0]";
  const fmtFns = {
    "int[]": `static string Fmt(int[] v) {
        var sb = new StringBuilder("[");
        for (int i = 0; i < v.Length; i++) { if (i > 0) sb.Append(','); sb.Append(v[i]); }
        return sb.Append(']').ToString();
    }`,
    "string[]": `static string Fmt(string[] v) {
        var sb = new StringBuilder("[");
        for (int i = 0; i < v.Length; i++) { if (i > 0) sb.Append(','); sb.Append('"').Append(v[i]).Append('"'); }
        return sb.Append(']').ToString();
    }`,
    "char[]": `static string Fmt(char[] v) {
        var sb = new StringBuilder("[");
        for (int i = 0; i < v.Length; i++) { if (i > 0) sb.Append(','); sb.Append('"').Append(v[i]).Append('"'); }
        return sb.Append(']').ToString();
    }`,
    int: `static string Fmt(int v) { return v.ToString(); }`,
    string: `static string Fmt(string v) { return "\\"" + v + "\\""; }`,
    bool: `static string Fmt(bool v) { return v ? "true" : "false"; }`,
  };
  const fmtSource = returns === "void" ? fmtFns["char[]"] : fmtFns[returns];

  const csLit = (type, value) => {
    switch (type) {
      case "int":
        return String(value);
      case "string":
        return `"${stringEscape(value)}"`;
      case "bool":
        return String(value);
      case "int[]":
        return `new int[]{${value.join(",")}}`;
      case "string[]":
        return `new string[]{${value.map((s) => `"${stringEscape(s)}"`).join(",")}}`;
      case "char[]":
        return `new char[]{${value.map((c) => `'${c}'`).join(",")}}`;
      default:
        return String(value);
    }
  };

  const calls = spec.tests.map((t) => {
    if (returns === "void") {
      const arg = csLit(params[0].type, t.args[0]);
      return `var t = ${arg};\n        ${csFn}(t);\n        Console.WriteLine(Fmt(t));`;
    }
    const args = t.args.map((a, i) => csLit(params[i].type, a)).join(", ");
    return `Console.WriteLine(Fmt(${csFn}(${args})));`;
  });

  return `using System;
using System.Text;
using System.Collections.Generic;

class Solution {
    public static ${returns === "void" ? "void" : csType[returns]} ${csFn}(${params.map((p) => `${csType[p.type]} ${p.name}`).join(", ")}) {
        // Write your solution here
        ${returns === "void" ? "" : `return ${defaultReturn};`}
    }

    // --- test harness (do not modify) ---
    ${fmtSource}

    static void Main() {
        ${calls.join("\n        ")}
    }
}`;
}

// ---------------------------------------------------------------------------
// Go
// ---------------------------------------------------------------------------

function generateGo(spec) {
  const { fn, params, returns } = spec;
  const goType = { int: "int", string: "string", bool: "bool", "int[]": "[]int", "string[]": "[]string", "char[]": "[]byte" };
  const defaultReturn = returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? '""' : "nil";
  const fmtFns = {
    "int[]": `func fmtInts(v []int) string {
    parts := make([]string, len(v))
    for i, x := range v { parts[i] = strconv.Itoa(x) }
    return "[" + strings.Join(parts, ",") + "]"
}`,
    "string[]": `func fmtStrings(v []string) string {
    parts := make([]string, len(v))
    for i, x := range v { parts[i] = "\\"" + x + "\\"" }
    return "[" + strings.Join(parts, ",") + "]"
}`,
    "char[]": `func fmtBytes(v []byte) string {
    parts := make([]string, len(v))
    for i, x := range v { parts[i] = "\\"" + string(x) + "\\"" }
    return "[" + strings.Join(parts, ",") + "]"
}`,
    int: `func fmtInt(v int) string { return strconv.Itoa(v) }`,
    string: `func fmtStr(v string) string { return "\\"" + v + "\\"" }`,
    bool: `func fmtBool(v bool) string { if v { return "true" }; return "false" }`,
  };
  const printName = (r) => (r === "int[]" ? "fmtInts" : r === "string[]" ? "fmtStrings" : r === "char[]" ? "fmtBytes" : r === "int" ? "fmtInt" : r === "string" ? "fmtStr" : "fmtBool");
  const goLit = (type, value) => {
    switch (type) {
      case "int":
        return String(value);
      case "string":
        return `"${stringEscape(value)}"`;
      case "bool":
        return String(value);
      case "int[]":
        return `[]int{${value.join(", ")}}`;
      case "string[]":
        return `[]string{${value.map((s) => `"${stringEscape(s)}"`).join(", ")}}`;
      case "char[]":
        return `[]byte{${value.map((c) => `'${c}'`).join(", ")}}`;
      default:
        return String(value);
    }
  };
  const calls = spec.tests.map((t) => {
    const args = t.args.map((a, i) => goLit(params[i].type, a)).join(", ");
    if (returns === "void") {
      return `t := ${goLit(params[0].type, t.args[0])}\n\t${fn}(${args})\n\tfmt.Println(fmtBytes(t))`;
    }
    return `fmt.Println(${printName(returns)}(${fn}(${args})))`;
  });
  return `package main

import (
    "fmt"
    "strconv"
    "strings"
)

func ${fn}(${params.map((p) => `${p.name} ${goType[p.type]}`).join(", ")}) ${returns === "void" ? "" : goType[returns]} {
    // Write your solution here
    ${returns === "void" ? "" : `return ${defaultReturn};`}
}

// --- test harness (do not modify) ---
${fmtFns[returns]}

func main() {
    ${calls.join("\n    ")}
}`;
}

// ---------------------------------------------------------------------------
// Rust
// ---------------------------------------------------------------------------

function generateRust(spec) {
  const { fn, params, returns } = spec;
  const rsFn = fn.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
  const rsType = { int: "i32", string: "String", bool: "bool", "int[]": "Vec<i32>", "string[]": "Vec<String>", "char[]": "Vec<char>" };
  const defaultReturn = returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? "String::new()" : "vec![]";
  const fmtFns = {
    "int[]": `fn fmt(v: &[i32]) -> String {
    let mut s = String::from("[");
    for (i, x) in v.iter().enumerate() { if i > 0 { s.push(','); } s.push_str(&x.to_string()); }
    s.push(']'); s
}`,
    "string[]": `fn fmt(v: &[String]) -> String {
    let mut s = String::from("[");
    for (i, x) in v.iter().enumerate() { if i > 0 { s.push(','); } s.push('"'); s.push_str(x); s.push('"'); }
    s.push(']'); s
}`,
    "char[]": `fn fmt(v: &[char]) -> String {
    let mut s = String::from("[");
    for (i, x) in v.iter().enumerate() { if i > 0 { s.push(','); } s.push('"'); s.push(*x); s.push('"'); }
    s.push(']'); s
}`,
    int: `fn fmt(v: i32) -> String { v.to_string() }`,
    string: `fn fmt(v: &str) -> String { format!("\\"{}\\"", v) }`,
    bool: `fn fmt(v: bool) -> String { if v { "true".into() } else { "false".into() } }`,
  };
  const rsLit = (type, value) => {
    switch (type) {
      case "int":
        return String(value);
      case "string":
        return `String::from("${stringEscape(value)}")`;
      case "bool":
        return String(value);
      case "int[]":
        return `vec![${value.join(", ")}]`;
      case "string[]":
        return `vec![${value.map((s) => `String::from("${stringEscape(s)}")`).join(", ")}]`;
      case "char[]":
        return `vec![${value.map((c) => `'${c}'`).join(", ")}]`;
      default:
        return String(value);
    }
  };
  const calls = spec.tests.map((t) => {
    const args = t.args.map((a, i) => rsLit(params[i].type, a)).join(", ");
    if (returns === "void") {
      return `let mut t = ${rsLit(params[0].type, t.args[0])};\n    ${rsFn}(${args});\n    println!("{}", fmt(&t));`;
    }
    const expr = `${rsFn}(${args})`;
    return `println!("{}", fmt(${returns.endsWith("[]") ? "&" + expr : expr}));`;
  });
  return `fn ${rsFn}(${params.map((p) => `${p.name}: ${rsType[p.type]}`).join(", ")}) -> ${returns === "void" ? "" : rsType[returns]} {
    // Write your solution here
    ${returns === "void" ? "" : `return ${defaultReturn};`}
}

// --- test harness (do not modify) ---
${fmtFns[returns]}

fn main() {
    ${calls.join("\n    ")}
}`;
}

// ---------------------------------------------------------------------------
// Kotlin
// ---------------------------------------------------------------------------

function generateKotlin(spec) {
  const { fn, params, returns } = spec;
  const ktType = { int: "Int", string: "String", bool: "Boolean", "int[]": "IntArray", "string[]": "Array<String>", "char[]": "CharArray" };
  const defaultReturn = returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? '""' : returns === "int[]" ? "intArrayOf()" : returns === "string[]" ? "arrayOf()" : "charArrayOf()";
  const fmtFns = {
    "int[]": `fun fmt(v: IntArray): String = v.joinToString(",", "[", "]")`,
    "string[]": `fun fmt(v: Array<String>): String = v.joinToString(",", "[", "]") { "\\"" + it + "\\"" }`,
    "char[]": `fun fmt(v: CharArray): String = v.joinToString(",", "[", "]") { "\\"" + it + "\\"" }`,
    int: `fun fmt(v: Int): String = v.toString()`,
    string: `fun fmt(v: String): String = "\\"" + v + "\\""`,
    bool: `fun fmt(v: Boolean): String = if (v) "true" else "false"`,
  };
  const ktLit = (type, value) => {
    switch (type) {
      case "int":
        return String(value);
      case "string":
        return `"${stringEscape(value)}"`;
      case "bool":
        return String(value);
      case "int[]":
        return `intArrayOf(${value.join(", ")})`;
      case "string[]":
        return `arrayOf(${value.map((s) => `"${stringEscape(s)}"`).join(", ")})`;
      case "char[]":
        return `charArrayOf(${value.map((c) => `'${c}'`).join(", ")})`;
      default:
        return String(value);
    }
  };
  const calls = spec.tests.map((t) => {
    const args = t.args.map((a, i) => ktLit(params[i].type, a)).join(", ");
    if (returns === "void") {
      return `val t = ${ktLit(params[0].type, t.args[0])}\n    ${fn}(${args})\n    println(fmt(t))`;
    }
    return `println(fmt(${fn}(${args})))`;
  });
  return `fun ${fn}(${params.map((p) => `${p.name}: ${ktType[p.type]}`).join(", ")}): ${returns === "void" ? "" : ktType[returns]} {
    // Write your solution here
    ${returns === "void" ? "" : `return ${defaultReturn};`}
}

// --- test harness (do not modify) ---
${fmtFns[returns]}

fun main() {
    ${calls.join("\n    ")}
}`;
}

// ---------------------------------------------------------------------------
// Swift
// ---------------------------------------------------------------------------

function generateSwift(spec) {
  const { fn, params, returns } = spec;
  const swType = { int: "Int", string: "String", bool: "Bool", "int[]": "[Int]", "string[]": "[String]", "char[]": "[Character]" };
  const defaultReturn = returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? '""' : "[]";
  const fmtFns = {
    "int[]": `func fmt(_ v: [Int]) -> String { "[" + v.map(String.init).joined(separator: ",") + "]" }`,
    "string[]": `func fmt(_ v: [String]) -> String { "[" + v.map { "\\"\\($0)\\"\"" }.joined(separator: ",") + "]" }`,
    "char[]": `func fmt(_ v: [Character]) -> String { "[" + v.map { "\\"\\($0)\\"\"" }.joined(separator: ",") + "]" }`,
    int: `func fmt(_ v: Int) -> String { String(v) }`,
    string: `func fmt(_ v: String) -> String { "\\"\\(v)\\"\"" }`,
    bool: `func fmt(_ v: Bool) -> String { v ? "true" : "false" }`,
  };
  const swLit = (type, value) => {
    switch (type) {
      case "int":
        return String(value);
      case "string":
        return `"${stringEscape(value)}"`;
      case "bool":
        return String(value);
      case "int[]":
        return `[${value.join(", ")}]`;
      case "string[]":
        return `[${value.map((s) => `"${stringEscape(s)}"`).join(", ")}]`;
      case "char[]":
        return `[${value.map((c) => `"${c}"`).join(", ")}]`;
      default:
        return String(value);
    }
  };
  const calls = spec.tests.map((t) => {
    const args = t.args.map((a, i) => swLit(params[i].type, a)).join(", ");
    if (returns === "void") {
      return `var t = ${swLit(params[0].type, t.args[0])}\n${fn}(${args})\nprint(fmt(t))`;
    }
    return `print(fmt(${fn}(${args})))`;
  });
  return `func ${fn}(${params.map((p) => `_ ${p.name}: ${swType[p.type]}`).join(", ")}) -> ${returns === "void" ? "" : swType[returns]} {
    // Write your solution here
    ${returns === "void" ? "" : `return ${defaultReturn};`}
}

// --- test harness (do not modify) ---
${fmtFns[returns]}

${calls.join("\n")}`;
}

// ---------------------------------------------------------------------------
// PHP
// ---------------------------------------------------------------------------

function generatePhp(spec) {
  const { fn, params, returns } = spec;
  const defaultReturn = returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? '""' : "[]";
  const fmtFn = `function fmt($v) {
    if (is_array($v)) {
        return "[" . implode(",", array_map("fmt", $v)) . "]";
    }
    if (is_bool($v)) {
        return $v ? "true" : "false";
    }
    if (is_string($v)) {
        return '"' . $v . '"';
    }
    return (string) $v;
}`;
  const calls = spec.tests.map((t) => {
    const args = t.args.map(JSON.stringify).join(", ");
    if (returns === "void") {
      return `$t = ${JSON.stringify(t.args[0])};\n${fn}(${args});\necho fmt($t) . "\\n";`;
    }
    return `echo fmt(${fn}(${args})) . "\\n";`;
  });
  return `<?php
function ${fn}(${params.map((p) => (p.type.endsWith("[]") ? `array $${p.name}` : p.type === "int" ? `int $${p.name}` : `string $${p.name}`)).join(", ")}): ${returns === "int" ? "int" : returns === "bool" ? "bool" : returns === "string" ? "string" : "array"} {
    // Write your solution here
    ${returns === "void" ? "" : `return ${defaultReturn};`}
}

// --- test harness (do not modify) ---
${fmtFn}

${calls.join("\n")}
`;
}

// ---------------------------------------------------------------------------
// Ruby
// ---------------------------------------------------------------------------

function generateRuby(spec) {
  const { fn, params, returns } = spec;
  const rbFn = fn.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
  const defaultReturn = returns === "bool" ? "false" : returns === "int" ? "0" : returns === "string" ? '""' : "[]";
  const fmtFn = `def fmt(v)
  if v.is_a?(Array)
    "[" + v.map { |x| fmt(x) }.join(",") + "]"
  elsif v == true
    "true"
  elsif v == false
    "false"
  elsif v.is_a?(String)
    '"' + v + '"'
  else
    v.to_s
  end
end`;
  const calls = spec.tests.map((t) => {
    const args = t.args.map(JSON.stringify).join(", ");
    if (returns === "void") {
      return `t = ${JSON.stringify(t.args[0])}\n${rbFn}(${args})\nputs fmt(t)`;
    }
    return `puts fmt(${rbFn}(${args}))`;
  });
  return `def ${rbFn}(${params.map((p) => p.name).join(", ")})
  # Write your solution here
  ${returns === "void" ? "" : `return ${defaultReturn}`}
end

# --- test harness (do not modify) ---
${fmtFn}

${calls.join("\n")}`;
}

// ---------------------------------------------------------------------------
// main API
// ---------------------------------------------------------------------------

const GENERATORS = {
  javascript: generateJavaScript,
  typescript: generateTypeScript,
  python: generatePython,
  java: generateJava,
  c: generateC,
  cpp: generateCpp,
  csharp: generateCsharp,
  go: generateGo,
  rust: generateRust,
  kotlin: generateKotlin,
  swift: generateSwift,
  php: generatePhp,
  ruby: generateRuby,
};

/**
 * Generate the per-language starter code map for a problem spec.
 * @param {object} spec language-neutral problem spec
 * @returns {Record<string,string>} language -> starter code
 */
export function generateStarterCode(spec) {
  const out = {};
  for (const lang of LANGUAGES) {
    try {
      const code = GENERATORS[lang](spec);
      if (!code.includes(HARNESS_MARKER)) {
        throw new Error("generated code is missing the harness marker");
      }
      out[lang] = code;
    } catch (error) {
      console.error(`⚠️ codegen failed for ${lang} / ${spec.slug}:`, error.message);
      out[lang] = "";
    }
  }
  return out;
}

/** Canonical expected output (same for every language). */
export function generateExpectedOutput(spec) {
  return canonicalExpected(spec.tests);
}

/** First line that marks the start of the generated test harness. */
const HARNESS_MARKER = "test harness (do not modify)";

/**
 * Split generated code into the user-editable function part and the harness.
 * @returns {{fn:string, harness:string}}
 */
export function splitAtHarness(code) {
  const lines = code.split("\n");
  const idx = lines.findIndex((l) => l.includes(HARNESS_MARKER));
  if (idx === -1) return { fn: code, harness: "" };
  return {
    fn: lines.slice(0, idx).join("\n") + "\n",
    harness: lines.slice(idx).join("\n"),
  };
}

/**
 * Generate ONLY the test harness for a given set of tests (used for the
 * submit/judge path, where hidden tests replace the sample ones).
 */
export function generateHarness(lang, spec, tests) {
  const full = GENERATORS[lang]({ ...spec, tests: tests || spec.tests });
  return splitAtHarness(full).harness;
}

export const SUPPORTED_LANGUAGES = LANGUAGES;
export { HARNESS_MARKER };
