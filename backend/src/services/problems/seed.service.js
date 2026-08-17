import Problem from "../../models/Problem.js";
import { PROBLEM_SEED } from "../../data/problems.seed.js";
import { generateStarterCode, generateExpectedOutput } from "./codegen.service.js";

/**
 * Upsert the curated problem bank. Idempotent — runs on every boot and
 * regenerates starter code so bank updates propagate.
 */
export async function seedProblemBank() {
  try {
    // backfill: any problem without a source is in-house
    await Problem.updateMany({ source: { $exists: false } }, { $set: { source: "custom" } });

    let upserted = 0;
    for (const spec of PROBLEM_SEED) {
      const starterCode = generateStarterCode(spec);
      const expectedOutput = generateExpectedOutput(spec);

      await Problem.updateOne(
        { slug: spec.slug },
        {
          $set: {
            title: spec.title,
            difficulty: spec.difficulty,
            tags: spec.tags,
            source: "custom",
            description: spec.description,
            constraints: spec.constraints,
            examples: spec.examples,
            starterCode,
            expectedOutput,
            testCases: spec.tests,
            hiddenTestCases: spec.hiddenTests || [],
            solutionApproach: spec.solutionApproach || "",
            codegen: {
              fn: spec.fn,
              params: spec.params,
              returns: spec.returns,
            },
            order: spec.order,
          },
        },
        { upsert: true }
      );
      upserted++;
    }
    const total = await Problem.countDocuments();
    console.log(`✅ Problem bank ready: ${total} problems (${upserted} upserted this boot)`);
  } catch (error) {
    console.error("⚠️ Problem bank seed failed:", error.message);
  }
}
