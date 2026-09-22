export const useApi = createUseFetch((options) => {
  const config = useRuntimeConfig();

  return {
    ...options,
    baseURL: config.public.apiUrl,

    headers: {
      ...useRequestHeaders(["cookie"]),
      ...options.headers,
    },

    credentials: "include",
  };
});
