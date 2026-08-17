import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { careerRoadmapApi } from "../api/careerRoadmap";

export const useCareerRoadmap = () =>
  useQuery({
    queryKey: ["careerRoadmap"],
    queryFn: careerRoadmapApi.getCareerRoadmap,
  });

export const useGenerateCareerRoadmap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["generateCareerRoadmap"],
    mutationFn: careerRoadmapApi.generateCareerRoadmap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerRoadmap"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || "Unable to generate career roadmap"),
  });
};
