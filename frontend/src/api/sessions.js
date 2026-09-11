import axiosInstance from "../lib/axios";

// The API returns the standard envelope ({ success, data }). Unwrapping here
// keeps every consumer working with plain objects ({ session }, { sessions })
// instead of reaching through response.data.data in components.
const unwrap = (response) => response.data.data;

export const sessionApi = {
  createSession: async (data) => unwrap(await axiosInstance.post("/sessions", data)),

  getActiveSessions: async () => unwrap(await axiosInstance.get("/sessions/active")),
  getMyRecentSessions: async () => unwrap(await axiosInstance.get("/sessions/my-recent")),

  getSessionById: async (id) => unwrap(await axiosInstance.get(`/sessions/${id}`)),

  joinSession: async (id) => unwrap(await axiosInstance.post(`/sessions/${id}/join`)),
  endSession: async (id) => unwrap(await axiosInstance.post(`/sessions/${id}/end`)),
  getStreamToken: async () => unwrap(await axiosInstance.get("/chat/token")),
};
