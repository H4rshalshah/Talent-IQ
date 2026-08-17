import axiosInstance from "../lib/axios";

export const problemApi = {
  listProblems: async (params = {}) => {
    const response = await axiosInstance.get("/problems", { params });
    return response.data;
  },
  getProblem: async (slug) => {
    const response = await axiosInstance.get(`/problems/${slug}`);
    return response.data;
  },
  submitProblem: async (slug, data) => {
    const response = await axiosInstance.post(`/problems/${slug}/submit`, data);
    return response.data;
  },
  toggleBookmark: async (slug) => {
    const response = await axiosInstance.post(`/problems/${slug}/bookmark`);
    return response.data;
  },
  getProgress: async () => {
    const response = await axiosInstance.get("/problems/progress");
    return response.data;
  },
  syncCodeforces: async () => {
    const response = await axiosInstance.post("/codeforces/sync");
    return response.data;
  },
};
