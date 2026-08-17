// Verifies the codegen harnesses end-to-end: for every supported language it
// generates the two-sum starter code, injects a correct solution, executes it
// via Piston and asserts the canonical output "[0,1]\n[1,2]\n[0,1]".
import { generateStarterCode, SUPPORTED_LANGUAGES } from "../src/services/problems/codegen.service.js";
import { executePiston } from "../src/services/problems/executor.service.js";

// Wandbox lacks Kotlin, Swift is broken, and TypeScript can't typecheck modern
// libs. Keep the codegen templates but skip them (excluded from the selector).
const SKIP = new Set(["kotlin", "swift", "typescript"]);

const TWO_SUM = {
  slug: "two-sum",
  fn: "twoSum",
  params: [
    { name: "nums", type: "int[]" },
    { name: "target", type: "int" },
  ],
  returns: "int[]",
  tests: [
    { args: [[2, 7, 11, 15], 9], expected: "[0,1]" },
    { args: [[3, 2, 4], 6], expected: "[1,2]" },
    { args: [[3, 3], 6], expected: "[0,1]" },
  ],
};

const EXPECTED = "[0,1]\n[1,2]\n[0,1]";

const SOLUTIONS = {
  javascript: `  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];`,
  typescript: `  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need)!, i];
    seen.set(nums[i], i);
  }
  return [];`,
  python: `    seen = {}
    for i, num in enumerate(nums):
        need = target - num
        if need in seen:
            return [seen[need], i]
        seen[num] = i
    return []`,
  java: `        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(nums[i], i);
        }
        return new int[0];`,
  c: `    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                int* result = (int*)malloc(2 * sizeof(int));
                result[0] = i; result[1] = j;
                *returnSize = 2;
                return result;
            }
        }
    }
    *returnSize = 0;
    return NULL;`,
  cpp: `    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];
        if (seen.count(need)) return {seen[need], i};
        seen[nums[i]] = i;
    }
    return {};`,
  csharp: `        var seen = new Dictionary<int, int>();
        for (int i = 0; i < nums.Length; i++) {
            int need = target - nums[i];
            if (seen.ContainsKey(need)) return new int[] { seen[need], i };
            seen[nums[i]] = i;
        }
        return new int[0];`,
  go: `    seen := make(map[int]int)
    for i, num := range nums {
        need := target - num
        if j, ok := seen[need]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return nil`,
  rust: `    use std::collections::HashMap;
    let mut seen = HashMap::new();
    for (i, &num) in nums.iter().enumerate() {
        let need = target - num;
        if let Some(&j) = seen.get(&need) {
            return vec![j, i as i32];
        }
        seen.insert(num, i as i32);
    }
    vec![]`,
  kotlin: `    val seen = mutableMapOf<Int, Int>()
    for (i in nums.indices) {
        val need = target - nums[i]
        if (seen.containsKey(need)) return intArrayOf(seen[need]!!, i)
        seen[nums[i]] = i
    }
    return intArrayOf()`,
  swift: `    var seen = [Int: Int]()
    for (i, num) in nums.enumerated() {
        let need = target - num
        if let j = seen[need] { return [j, i] }
        seen[num] = i
    }
    return []`,
  php: `    $seen = [];
    foreach ($nums as $i => $num) {
        $need = $target - $num;
        if (isset($seen[$need])) return [$seen[$need], $i];
        $seen[$num] = $i;
    }
    return [];`,
  ruby: `  seen = {}
  nums.each_with_index do |num, i|
    need = target - num
    return [seen[need], i] if seen.key?(need)
    seen[num] = i
  end
  return []`,
};

const STUB_REGEX = {
  javascript: /  \/\/ Write your solution here\n  return \[\];/,
  typescript: /  \/\/ Write your solution here\n  return \[\];/,
  python: /    # Write your solution here\n    return \[\]/,
  java: /        \/\/ Write your solution here\n        return new int\[0\];/,
  c: /    \/\/ Write your solution here\n    \*returnSize = 0;\n    return NULL;/,
  cpp: /    \/\/ Write your solution here\n    return \{\};/,
  csharp: /        \/\/ Write your solution here\n        return new int\[0\];/,
  go: /    \/\/ Write your solution here\n    return nil;/,
  rust: /    \/\/ Write your solution here\n    return vec!\[\];/,
  kotlin: /    \/\/ Write your solution here\n    return intArrayOf\(\);/,
  swift: /    \/\/ Write your solution here\n    return \[\]/,
  php: /    \/\/ Write your solution here\n    return \[\];/,
  ruby: /  # Write your solution here\n  return \[\]/,
};

const starter = generateStarterCode(TWO_SUM);
let failures = 0;

for (const lang of SUPPORTED_LANGUAGES) {
  if (SKIP.has(lang)) {
    console.log(`- ${lang}: no runtime available (excluded from selector)`);
    continue;
  }
  const regex = STUB_REGEX[lang];
  if (!regex) {
    console.log(`✗ ${lang}: no stub regex defined`);
    failures++;
    continue;
  }
  const code = starter[lang].replace(regex, SOLUTIONS[lang]);
  if (code === starter[lang]) {
    console.log(`✗ ${lang}: stub pattern not found in generated code`);
    failures++;
    continue;
  }
  const t0 = Date.now();
  const result = await executePiston(lang, code);
  const ms = Date.now() - t0;
  const output = (result.output || "").trim().replace(/\s+/g, " ").replace(/ /g, "");
  const ok = result.success && output.replace(/\s/g, "") === EXPECTED.replace(/\s/g, "");
  if (!ok) {
    console.log(`✗ ${lang}: ${result.error ? "error: " + result.error.slice(0, 160) : "output: " + JSON.stringify(result.output)}`);
    failures++;
  } else {
    console.log(`✓ ${lang} (${ms}ms)`);
  }
}

console.log(failures === 0 ? "\nALL LANGUAGES PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
