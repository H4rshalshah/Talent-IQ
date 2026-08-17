import axiosInstance from "../lib/axios";

export const ragApi = {
  ingestKnowledge: async (source = "all") => {
    const response = await axiosInstance.post("/rag/ingest", { source });
    return response.data;
  },
  searchKnowledge: async (data) => {
    const response = await axiosInstance.post("/rag/search", data);
    return response.data;
  },
  getStats: async () => {
    const response = await axiosInstance.get("/rag/stats");
    return response.data;
  },
};
