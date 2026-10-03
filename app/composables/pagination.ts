import type { Ref } from "vue";
import { nextTick, onScopeDispose } from "vue";

interface PaginatedRefreshOptions {
  page: Ref<number>;
  total: Ref<number>;
  error: Ref<unknown>;
  limit: number;
  refresh: (options?: { dedupe: "defer" }) => Promise<void>;
}

export function usePaginatedRefresh({ page, total, error, limit, refresh }: PaginatedRefreshOptions) {
  let active = true;
  onScopeDispose(() => {
    active = false;
  });

  return async () => {
    if (!active)
      return;

    await refresh();
    if (!active || error.value)
      return;

    const lastPage = Math.max(1, Math.ceil(total.value / limit));
    if (page.value > lastPage) {
      page.value = lastPage;
      await nextTick();
      if (!active)
        return;
      await refresh({ dedupe: "defer" });
    }
  };
}
