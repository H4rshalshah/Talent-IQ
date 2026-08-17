import Problem from "../../models/Problem.js";
import { fetchCodeforcesProblemSet, mapToProblemDocs } from "./codeforces.service.js";

let syncing = false;

/**
 * Sync the Codeforces problem set into MongoDB. Upserts on externalId so
 * repeated syncs never create duplicates. Returns sync stats or throws.
 * Rejects concurrent syncs rather than racing them.
 */
export async function syncCodeforcesProblems() {
  if (syncing) {
    const error = new Error("A Codeforces sync is already running. Try again in a moment.");
    error.code = "SYNC_IN_PROGRESS";
    throw error;
  }
  syncing = true;

  try {
    const fetched = await fetchCodeforcesProblemSet();
    if (!fetched.ok) throw new Error(fetched.error);

    const docs = mapToProblemDocs(fetched.problems, fetched.statistics);
    if (!docs.length) throw new Error("Codeforces returned no usable problems");

    // bulk upsert — one round trip instead of one per problem
    const operations = docs.map((doc) => {
      const { externalId, ...set } = doc;
      return {
        updateOne: {
          filter: { externalId },
          update: { $set: set },
          upsert: true,
        },
      };
    });

    const result = await Problem.bulkWrite(operations, { ordered: false });
    const inserted = result.upsertedCount ?? 0;
    const updated = result.modifiedCount ?? 0;

    return { total: docs.length, inserted, updated };
  } finally {
    syncing = false;
  }
}
