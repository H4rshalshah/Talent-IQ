import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { interviewApi } from "../api/interviews";

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

export const useListInterviews = () =>
  useQuery({
    queryKey: ["interviews"],
    queryFn: interviewApi.listInterviews,
  });

export const useInterviewById = (id) =>
  useQuery({
    queryKey: ["interview", id],
    queryFn: () => interviewApi.getInterviewById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

export const useDashboardData = () =>
  useQuery({
    queryKey: ["dashboardData"],
    queryFn: interviewApi.getDashboardData,
  });

export const useCreateAiInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["createAiInterview"],
    mutationFn: interviewApi.createAiInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to create AI interview")),
  });
};

export const useGetAiQuestion = () =>
  useMutation({
    mutationKey: ["getAiQuestion"],
    mutationFn: interviewApi.getAiQuestion,
    onError: (error) => toast.error(errorMessage(error, "AI interviewer is temporarily unavailable. Please try again.")),
  });

export const useSubmitAiAnswer = () =>
  useMutation({
    mutationKey: ["submitAiAnswer"],
    mutationFn: interviewApi.submitAiAnswer,
    onError: (error) => toast.error(errorMessage(error, "AI interviewer is temporarily unavailable. Please try again.")),
  });

export const useCompleteAiInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["completeAiInterview"],
    mutationFn: interviewApi.completeAiInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to complete interview")),
  });
};

export const useAbortInterview = () =>
  useMutation({
    mutationKey: ["abortInterview"],
    mutationFn: interviewApi.abortInterview,
    onError: (error) => toast.error(errorMessage(error, "Failed to end interview")),
  });
