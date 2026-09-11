import axiosInstance from "../lib/axios";

export const codeApi = {
  /**
   * Execute a standalone snippet in the server-side sandbox. Used by the
   * collaborative (human) interview editor. All code execution goes through
   * the backend — the browser never talks to an execution provider directly.
   */
  execute: async ({ language, code }) => {
    const response = await axiosInstance.post("/code/execute", { language, code });
    return response.data;
  },
};
