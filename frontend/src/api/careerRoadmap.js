import axiosInstance from "../lib/axios";

export const careerRoadmapApi = {
  getCareerRoadmap: async () => {
    const response = await axiosInstance.get("/career-roadmap");
    return response.data;
  },
  generateCareerRoadmap: async (data) => {
    const response = await axiosInstance.post("/career-roadmap/generate", data);
    return response.data;
  },
};
