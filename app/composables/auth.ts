import type { UseFetchOptions } from "#app";
import { authClient } from "~/utils/auth";

type Session = (typeof authClient)["$Infer"]["Session"];

export async function useAuthSession() {
  const sessionFetch = (path: string, opts?: UseFetchOptions<Session>) => {
    return useFetch<Session>(path, {
      ...opts,
      credentials: "include",
    });
  };

  const { data, isPending, error } = await authClient.useSession(sessionFetch);

  return { session: data, isPending, error };
}
