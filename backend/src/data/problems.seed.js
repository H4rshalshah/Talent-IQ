// ---------------------------------------------------------------------------
// Curated LeetCode-style problem bank (original content written in-house).
//
// Each problem is a language-neutral spec consumed by
// services/problems/codegen.service.js, which generates the starter code for
// all 13 supported languages plus the canonical expected output.
//
// `tests` are the sample cases embedded in the starter harness; `hiddenTests`
// are additional cases used only by the judge (POST /api/problems/:slug/submit).
// ---------------------------------------------------------------------------

export const PROBLEM_SEED = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    description:
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice. You may return the answer in any order.",
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "-10⁹ ≤ target ≤ 10⁹", "Exactly one valid answer exists"],
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9, so we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
      { input: "nums = [3,3], target = 6", output: "[0,1]" },
    ],
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
    hiddenTests: [
      { args: [[1, 5, 8, 3], 11], expected: "[2,3]" },
      { args: [[-3, 4, 3, 90], 0], expected: "[0,2]" },
      { args: [[2, 5, 5, 11], 10], expected: "[1,2]" },
    ],
    solutionApproach:
      "Use a hash map that stores each number's index as you scan. For every element, check whether the complement (target - current) is already in the map; if so, return both indices. This is O(n) time and O(n) space.",
    order: 1,
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    tags: ["String", "Stack"],
    description:
      "Given a string `s` containing only the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if every opening bracket is closed by the same type of bracket, and brackets close in the correct order.",
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only: ()[]{}"],
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
      { input: 's = "([)]"', output: "false" },
    ],
    fn: "isValid",
    params: [{ name: "s", type: "string" }],
    returns: "bool",
    tests: [
      { args: ["()"], expected: "true" },
      { args: ["()[]{}"], expected: "true" },
      { args: ["(]"], expected: "false" },
      { args: ["([)]"], expected: "false" },
    ],
    hiddenTests: [
      { args: ["{[]}"], expected: "true" },
      { args: ["("], expected: "false" },
      { args: ["]"], expected: "false" },
      { args: [""], expected: "true" },
    ],
    solutionApproach:
      "Use a stack. When you see an opening bracket, push it; when you see a closing bracket, pop the top and verify it is the matching opening bracket. At the end the stack must be empty. O(n) time and O(n) space.",
    order: 2,
  },
  {
    slug: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy",
    tags: ["String", "Two Pointers"],
    description:
      "Write a function that reverses a string. The input string is given as an array of characters and must be reversed by modifying the input array in place — do not return a new array.",
    constraints: ["1 ≤ s.length ≤ 10⁵", "s[i] is a printable ASCII character"],
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' },
    ],
    fn: "reverseString",
    params: [{ name: "s", type: "char[]" }],
    returns: "void",
    tests: [
      { args: [["h", "e", "l", "l", "o"]], expected: '["o","l","l","e","h"]' },
      { args: [["H", "a", "n", "n", "a", "h"]], expected: '["h","a","n","n","a","H"]' },
    ],
    hiddenTests: [
      { args: [["a", "b", "c"]], expected: '["c","b","a"]' },
      { args: [["x"]], expected: '["x"]' },
      { args: [["A", " ", "m", "a", "n"]], expected: '["n","a","m"," ","A"]' },
    ],
    solutionApproach:
      "Swap the first and last characters, then move inward with two pointers, stopping when they meet. This is O(n) time with O(1) extra space.",
    order: 3,
  },
  {
    slug: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    tags: ["Array", "Dynamic Programming"],
    description:
      "You are given an array `prices` where `prices[i]` is the price of a stock on day `i`. You want to maximize profit by choosing a single day to buy one stock and choosing a different day in the future to sell it.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.",
    constraints: ["1 ≤ prices.length ≤ 10⁵", "0 ≤ prices[i] ≤ 10⁴"],
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price 1) and sell on day 5 (price 6), profit = 6 - 1 = 5." },
      { input: "prices = [7,6,4,3,1]", output: "0", explanation: "Prices only fall, so no profitable transaction exists." },
      { input: "prices = [2,4,1]", output: "2" },
    ],
    fn: "maxProfit",
    params: [{ name: "prices", type: "int[]" }],
    returns: "int",
    tests: [
      { args: [[7, 1, 5, 3, 6, 4]], expected: "5" },
      { args: [[7, 6, 4, 3, 1]], expected: "0" },
      { args: [[2, 4, 1]], expected: "2" },
    ],
    hiddenTests: [
      { args: [[1, 2]], expected: "1" },
      { args: [[3, 2, 6, 5, 0, 3]], expected: "4" },
      { args: [[2, 1]], expected: "0" },
    ],
    solutionApproach:
      "Track the minimum price seen so far and, at each day, compute the profit if sold today; keep the maximum profit. Single pass, O(n) time and O(1) space.",
    order: 4,
  },
  {
    slug: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    tags: ["String", "Hash Table"],
    description:
      "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An anagram is a word formed by rearranging the letters of another word, using all the original letters exactly once.",
    constraints: ["1 ≤ s.length, t.length ≤ 5 × 10⁴", "s and t consist of lowercase English letters"],
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" },
      { input: 's = "a", t = "ab"', output: "false" },
    ],
    fn: "isAnagram",
    params: [
      { name: "s", type: "string" },
      { name: "t", type: "string" },
    ],
    returns: "bool",
    tests: [
      { args: ["anagram", "nagaram"], expected: "true" },
      { args: ["rat", "car"], expected: "false" },
      { args: ["a", "ab"], expected: "false" },
    ],
    hiddenTests: [
      { args: ["ab", "ba"], expected: "true" },
      { args: ["", ""], expected: "true" },
      { args: ["aacc", "ccac"], expected: "false" },
    ],
    solutionApproach:
      "Count character frequencies of the first string into a 26-slot array, then decrement with the second string; if any count goes negative or remains nonzero the strings are not anagrams. O(n) time, O(1) space.",
    order: 5,
  },
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming"],
    description:
      "Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum, and return its sum.",
    constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      { input: "nums = [1]", output: "1" },
      { input: "nums = [5,4,-1,7,8]", output: "23" },
      { input: "nums = [-1]", output: "-1" },
    ],
    fn: "maxSubArray",
    params: [{ name: "nums", type: "int[]" }],
    returns: "int",
    tests: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: "6" },
      { args: [[1]], expected: "1" },
      { args: [[5, 4, -1, 7, 8]], expected: "23" },
      { args: [[-1]], expected: "-1" },
    ],
    hiddenTests: [
      { args: [[-2, -1]], expected: "-1" },
      { args: [[0]], expected: "0" },
      { args: [[3, -2, 5, -1]], expected: "6" },
    ],
    solutionApproach:
      "Kadane's algorithm: keep a running sum, reset it to the current element whenever it drops below the current element, and track the maximum seen. O(n) time and O(1) space.",
    order: 6,
  },
  {
    slug: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    tags: ["Array", "Two Pointers"],
    description:
      "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the i-th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that, together with the x-axis, form a container that holds the most water. Return the maximum amount of water the container can store. You may not slant the container.",
    constraints: ["n == height.length", "2 ≤ n ≤ 10⁵", "0 ≤ height[i] ≤ 10⁴"],
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "Lines 2 and 9 (0-indexed 1 and 8) form the widest tall container." },
      { input: "height = [1,1]", output: "1" },
      { input: "height = [4,3,2,1,4]", output: "16" },
    ],
    fn: "maxArea",
    params: [{ name: "height", type: "int[]" }],
    returns: "int",
    tests: [
      { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: "49" },
      { args: [[1, 1]], expected: "1" },
      { args: [[4, 3, 2, 1, 4]], expected: "16" },
    ],
    hiddenTests: [
      { args: [[2, 3, 4, 5, 18, 17, 6]], expected: "17" },
      { args: [[1, 2, 1]], expected: "2" },
      { args: [[8, 7, 2, 1]], expected: "7" },
    ],
    solutionApproach:
      "Two pointers starting at both ends. Move the pointer with the shorter line inward, since the shorter side bounds the area. Track the maximum area. O(n) time and O(1) space.",
    order: 7,
  },
  {
    slug: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    tags: ["String", "Sliding Window", "Hash Table"],
    description:
      "Given a string `s`, find the length of the longest substring without repeating characters.",
    constraints: ["0 ≤ s.length ≤ 5 × 10⁴", "s consists of English letters, digits, symbols and spaces"],
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1" },
      { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with the length of 3.' },
      { input: 's = ""', output: "0" },
    ],
    fn: "lengthOfLongestSubstring",
    params: [{ name: "s", type: "string" }],
    returns: "int",
    tests: [
      { args: ["abcabcbb"], expected: "3" },
      { args: ["bbbbb"], expected: "1" },
      { args: ["pwwkew"], expected: "3" },
      { args: [""], expected: "0" },
    ],
    hiddenTests: [
      { args: ["au"], expected: "2" },
      { args: ["dvdf"], expected: "3" },
      { args: [" "], expected: "1" },
    ],
    solutionApproach:
      "Sliding window with a hash map from character to its most recent index. Expand the right edge; when a repeat is found, move the left edge past the previous occurrence. O(n) time, O(min(n, alphabet)) space.",
    order: 8,
  },
  {
    slug: "product-of-array-except-self",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    tags: ["Array", "Prefix Sum"],
    description:
      "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nThe product of any prefix or suffix of `nums` fits in a 32-bit integer. Your solution must run in O(n) time and must not use the division operator.",
    constraints: ["2 ≤ nums.length ≤ 10⁵", "-30 ≤ nums[i] ≤ 30"],
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" },
    ],
    fn: "productExceptSelf",
    params: [{ name: "nums", type: "int[]" }],
    returns: "int[]",
    tests: [
      { args: [[1, 2, 3, 4]], expected: "[24,12,8,6]" },
      { args: [[-1, 1, 0, -3, 3]], expected: "[0,0,9,0,0]" },
    ],
    hiddenTests: [
      { args: [[0, 0]], expected: "[0,0]" },
      { args: [[2, 3, 4]], expected: "[12,8,6]" },
      { args: [[-1, 1]], expected: "[1,-1]" },
    ],
    solutionApproach:
      "Two passes: first compute running products from the left into the answer array, then multiply by running products from the right. O(n) time and O(1) extra space (excluding the output).",
    order: 9,
  },
  {
    slug: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    tags: ["Array", "Two Pointers", "Stack"],
    description:
      "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    constraints: ["n == height.length", "1 ≤ n ≤ 2 × 10⁴", "0 ≤ height[i] ≤ 10⁵"],
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "Six units of water are trapped between the bars." },
      { input: "height = [4,2,0,3,2,5]", output: "9" },
    ],
    fn: "trap",
    params: [{ name: "height", type: "int[]" }],
    returns: "int",
    tests: [
      { args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: "6" },
      { args: [[4, 2, 0, 3, 2, 5]], expected: "9" },
    ],
    hiddenTests: [
      { args: [[4, 2, 3]], expected: "1" },
      { args: [[2, 0, 2]], expected: "2" },
      { args: [[0, 1, 0]], expected: "0" },
    ],
    solutionApproach:
      "Two pointers with running left/right maximums: water at a bar equals min(maxLeft, maxRight) - height. Move the pointer on the lower side. O(n) time and O(1) space.",
    order: 10,
  },
  {
    slug: "jump-game",
    title: "Jump Game",
    difficulty: "Hard",
    tags: ["Array", "Greedy"],
    description:
      "You are given an integer array `nums`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\n\nReturn `true` if you can reach the last index, or `false` otherwise.",
    constraints: ["1 ≤ nums.length ≤ 10⁴", "0 ≤ nums[i] ≤ 10⁵"],
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "true", explanation: "Jump 1 step to index 1, then 3 steps to the last index." },
      { input: "nums = [3,2,1,0,4]", output: "false", explanation: "You will always arrive at index 3, which has no reachable way forward." },
    ],
    fn: "canJump",
    params: [{ name: "nums", type: "int[]" }],
    returns: "bool",
    tests: [
      { args: [[2, 3, 1, 1, 4]], expected: "true" },
      { args: [[3, 2, 1, 0, 4]], expected: "false" },
    ],
    hiddenTests: [
      { args: [[0]], expected: "true" },
      { args: [[2, 0, 0]], expected: "true" },
      { args: [[1, 1, 0, 1]], expected: "false" },
      { args: [[1, 2, 3]], expected: "true" },
    ],
    solutionApproach:
      "Greedy: track the furthest reachable index. If the current index exceeds the furthest reachable, return false; otherwise update furthest = max(furthest, i + nums[i]). O(n) time and O(1) space.",
    order: 11,
  },
  {
    slug: "sliding-window-maximum",
    title: "Sliding Window Maximum",
    difficulty: "Hard",
    tags: ["Array", "Queue", "Sliding Window"],
    description:
      "You are given an array of integers `nums` and a sliding window of size `k` which moves from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position, return the maximum number in the window.",
    constraints: ["1 ≤ nums.length ≤ 10⁵", "1 ≤ k ≤ nums.length", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    examples: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" },
      { input: "nums = [1], k = 1", output: "[1]" },
      { input: "nums = [1,-1], k = 1", output: "[1,-1]" },
    ],
    fn: "maxSlidingWindow",
    params: [
      { name: "nums", type: "int[]" },
      { name: "k", type: "int" },
    ],
    returns: "int[]",
    tests: [
      { args: [[1, 3, -1, -3, 5, 3, 6, 7], 3], expected: "[3,3,5,5,6,7]" },
      { args: [[1], 1], expected: "[1]" },
      { args: [[1, -1], 1], expected: "[1,-1]" },
    ],
    hiddenTests: [
      { args: [[9, 11], 2], expected: "[11]" },
      { args: [[4, -2], 2], expected: "[4]" },
      { args: [[1, 3, 1, 2, 0, 5], 3], expected: "[3,3,2,5]" },
    ],
    solutionApproach:
      "Use a monotonic deque that stores indices in decreasing value order. For each window, pop expired indices from the front and remove smaller values from the back before pushing the current index. O(n) time and O(k) space.",
    order: 12,
  },
  {
    slug: "fizz-buzz",
    title: "Fizz Buzz",
    difficulty: "Easy",
    tags: ["Math", "String"],
    description:
      "Given an integer `n`, return a string array `answer` (1-indexed) where: `answer[i]` is `\"FizzBuzz\"` if `i` is divisible by 3 and 5, `\"Fizz\"` if divisible by 3, `\"Buzz\"` if divisible by 5, and `i` itself (as a string) otherwise.",
    constraints: ["1 ≤ n ≤ 10⁴"],
    examples: [
      { input: "n = 3", output: '["1","2","Fizz"]' },
      { input: "n = 5", output: '["1","2","Fizz","4","Buzz"]' },
      { input: "n = 15", output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
    ],
    fn: "fizzBuzz",
    params: [{ name: "n", type: "int" }],
    returns: "string[]",
    tests: [
      { args: [3], expected: '["1","2","Fizz"]' },
      { args: [5], expected: '["1","2","Fizz","4","Buzz"]' },
      { args: [15], expected: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
    ],
    hiddenTests: [
      { args: [1], expected: '["1"]' },
      { args: [2], expected: '["1","2"]' },
    ],
    solutionApproach:
      "Loop from 1 to n and append the appropriate token: check divisibility by 15 first, then 3, then 5, otherwise the number itself as a string. O(n) time and O(n) space for the output.",
    order: 13,
  },
];
