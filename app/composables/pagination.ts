import type { Ref } from "vue";
import { nextTick } from "vue";

interface PaginatedRefreshOptions {
  page: Ref<number>;
  total: Ref<number>;
  error: Ref<unknown>;
  limit: number;
  refresh: (options?: { dedupe: "defer" }) => Promise<void>;
}

export function usePaginatedRefresh({ page, total, error, limit, refresh }: PaginatedRefreshOptions) {
  return async () => {
    await refresh();
    if (error.value)
      return;

    const lastPage = Math.max(1, Math.ceil(total.value / limit));
    if (page.value > lastPage) {
      page.value = lastPage;
      await nextTick();
      await refresh({ dedupe: "defer" });
    }
  };
}
