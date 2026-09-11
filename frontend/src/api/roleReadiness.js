import axiosInstance from "../lib/axios";

export const roleReadinessApi = {
  getReadiness: async (role) => {
    const response = await axiosInstance.get("/role-readiness", { params: { role } });
    return response.data;
  },
  getRequirements: async () => {
    const response = await axiosInstance.get("/role-readiness/requirements");
    return response.data;
  },
};
