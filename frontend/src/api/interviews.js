import axiosInstance from "../lib/axios";

export const interviewApi = {
  createAiInterview: async (data) => {
    const response = await axiosInstance.post("/interviews/ai/create", data);
    return response.data;
  },

  getAiQuestion: async (interviewId) => {
    const response = await axiosInstance.post("/interviews/ai/question", { interviewId });
    return response.data;
  },

  submitAiAnswer: async ({ interviewId, questionId, answer }) => {
    const response = await axiosInstance.post("/interviews/ai/answer", {
      interviewId,
      questionId,
      answer,
    });
    return response.data;
  },

  completeAiInterview: async (interviewId) => {
    const response = await axiosInstance.post("/interviews/ai/complete", { interviewId });
    return response.data;
  },

  listInterviews: async () => {
    const response = await axiosInstance.get("/interviews");
    return response.data;
  },

  getInterviewById: async (id) => {
    const response = await axiosInstance.get(`/interviews/${id}`);
    return response.data;
  },

  abortInterview: async (id) => {
    const response = await axiosInstance.post(`/interviews/${id}/abort`);
    return response.data;
  },

  getDashboardData: async () => {
    const response = await axiosInstance.get("/dashboard");
    return response.data;
  },
};
