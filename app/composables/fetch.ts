import { API_URL } from "~/constants";

export const useApi = createUseFetch((options) => {
  return {
    ...options,
    baseURL: API_URL,

    headers: {
      ...useRequestHeaders(["cookie"]),
      ...options.headers,
    },

    credentials: "include",
  };
});
