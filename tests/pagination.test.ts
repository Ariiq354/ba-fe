import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { effectScope, ref, watch } from "vue";
import { usePaginatedRefresh } from "../app/composables/pagination";

describe("paginated list refresh lifecycle", () => {
  it("loads the last remaining page after its final pending transaction is processed", async () => {
    const scope = effectScope();
    const page = ref(3);
    const total = ref(21);
    const requestedPages: number[] = [];
    const refreshList = scope.run(() => usePaginatedRefresh({
      page,
      total,
      error: ref(null),
      limit: 10,
      refresh: async () => {
        requestedPages.push(page.value);
        total.value = 20;
      },
    }))!;

    try {
      await refreshList();
      assert.equal(page.value, 2);
      assert.deepEqual(requestedPages, [3, 2]);
    }
    finally {
      scope.stop();
    }
  });

  it("does not run a modal callback's stale query after its page is disposed", async () => {
    const scope = effectScope();
    let requests = 0;
    const refreshList = scope.run(() => usePaginatedRefresh({
      page: ref(2),
      total: ref(11),
      error: ref(null),
      limit: 10,
      refresh: async () => {
        requests++;
      },
    }))!;

    scope.stop();
    await refreshList();
    assert.equal(requests, 0);
  });

  it("does not correct or reload a page disposed while its refresh is in flight", async () => {
    const scope = effectScope();
    const page = ref(3);
    let requests = 0;
    let finishRefresh!: () => void;
    const response = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    const refreshList = scope.run(() => usePaginatedRefresh({
      page,
      total: ref(20),
      error: ref(null),
      limit: 10,
      refresh: async () => {
        requests++;
        await response;
      },
    }))!;

    const pending = refreshList();
    scope.stop();
    finishRefresh();
    await pending;

    assert.equal(page.value, 3);
    assert.equal(requests, 1);
  });

  it("does not issue a corrective query if page disposal occurs during the page change", async () => {
    const scope = effectScope();
    const page = ref(3);
    let requests = 0;
    const refreshList = scope.run(() => {
      watch(page, () => scope.stop());
      return usePaginatedRefresh({
        page,
        total: ref(20),
        error: ref(null),
        limit: 10,
        refresh: async () => {
          requests++;
        },
      });
    })!;

    try {
      await refreshList();
      assert.equal(requests, 1);
    }
    finally {
      scope.stop();
    }
  });
});
