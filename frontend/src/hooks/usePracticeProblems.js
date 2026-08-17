import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { problemApi } from "../api/problems";

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

/**
 * Unified problem-bank list. `source` is explicit: "codeforces", "custom",
 * or omitted for all sources. Used by the Practice page (source tabs) and the
 * ProblemPage dropdown (source: "custom").
 */
export const usePracticeProblems = (filters = {}) =>
  useQuery({
    queryKey: ["practice-problems", filters],
    queryFn: () => problemApi.listProblems(filters),
    placeholderData: (prev) => prev,
  });

/** Per-user aggregate progress (solved / attempted / bookmarked). */
export const useProblemProgress = () =>
  useQuery({
    queryKey: ["problem-progress"],
    queryFn: problemApi.getProgress,
  });

/** Toggle bookmark on a problem card. */
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug) => problemApi.toggleBookmark(slug),
    onMutate: async (slug) => {
      await queryClient.cancelQueries({ queryKey: ["practice-problems"] });
      queryClient.setQueriesData({ queryKey: ["practice-problems"] }, (old) => {
        if (!old?.data?.problems) return old;
        return {
          ...old,
          data: {
            ...old.data,
            problems: old.data.problems.map((p) =>
              p.slug === slug ? { ...p, bookmarked: !p.bookmarked } : p
            ),
          },
        };
      });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not update bookmark")),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["practice-problems"] });
      queryClient.invalidateQueries({ queryKey: ["problem-progress"] });
    },
  });
};

/** Admin-only: trigger a Codeforces sync. */
export const useSyncCodeforces = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: problemApi.syncCodeforces,
    onSuccess: (res) => {
      const stats = res?.data;
      toast.success(
        `Synced ${stats?.total ?? 0} problems (${stats?.inserted ?? 0} new, ${stats?.updated ?? 0} updated)`
      );
      queryClient.invalidateQueries({ queryKey: ["practice-problems"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Sync failed")),
  });
};

/** Judge submission (in-house problems only). */
export const useSubmitProblem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["submitProblem"],
    mutationFn: ({ slug, language, code }) => problemApi.submitProblem(slug, { language, code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practice-problems"] });
      queryClient.invalidateQueries({ queryKey: ["problem-progress"] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to run submission"),
  });
};

/** Single problem detail. */
export const useProblem = (slug) =>
  useQuery({
    queryKey: ["problem", slug],
    queryFn: () => problemApi.getProblem(slug),
    enabled: !!slug,
  });
