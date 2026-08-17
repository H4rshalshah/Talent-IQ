import { useQuery } from "@tanstack/react-query";
import { performanceApi } from "../api/performance";

export const usePerformance = () =>
  useQuery({
    queryKey: ["performance"],
    queryFn: performanceApi.getPerformance,
  });

export const usePerformanceById = (interviewId) =>
  useQuery({
    queryKey: ["performance", interviewId],
    queryFn: () => performanceApi.getPerformanceById(interviewId),
    enabled: !!interviewId,
  });
