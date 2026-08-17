import axiosInstance from "../lib/axios";

export const performanceApi = {
  getPerformance: async () => {
    const response = await axiosInstance.get("/performance");
    return response.data;
  },
  getPerformanceById: async (interviewId) => {
    const response = await axiosInstance.get(`/performance/${interviewId}`);
    return response.data;
  },
};
