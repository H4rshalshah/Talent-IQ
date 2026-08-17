import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { codeReviewApi } from "../api/codeReview";

export const useCodeReview = () =>
  useMutation({
    mutationKey: ["codeReview"],
    mutationFn: codeReviewApi.reviewCode,
    onError: (error) =>
      toast.error(
        error?.response?.data?.message ||
          "AI code review is temporarily unavailable. Please try again."
      ),
  });
