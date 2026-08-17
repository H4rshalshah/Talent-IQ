import axiosInstance from "../lib/axios";

export const codeReviewApi = {
  reviewCode: async (data) => {
    const response = await axiosInstance.post("/code/review", data);
    return response.data;
  },
};
