import { API_URL } from "~/constants";

export const useApi = createUseFetch({
  baseURL: API_URL,
  credentials: "include",
});
