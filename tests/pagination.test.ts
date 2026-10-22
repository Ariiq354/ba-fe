import assert from "node:assert/strict";
import { test } from "node:test";
import { effectScope, ref } from "vue";
import { usePaginatedRefresh } from "../app/composables/pagination";

function createList(currentPage: number, itemCount: number) {
  const scope = effectScope();
  const page = ref(currentPage);
  const total = ref(itemCount);
  const error = ref<unknown>();
  const requests: { page: number; options?: { dedupe: "defer" } }[] = [];
  const refresh = async (options?: { dedupe: "defer" }) => {
    requests.push({ page: page.value, options });
  };
  const refreshList = scope.run(() =>
    usePaginatedRefresh({ page, total, error, limit: 10, refresh }),
  )!;
  return { scope, page, error, requests, refreshList };
}

await test("refreshes the current page when it is still valid", async (t) => {
  const list = createList(2, 25);
  t.after(() => list.scope.stop());

  await list.refreshList();

  assert.equal(list.page.value, 2);
  assert.deepEqual(list.requests, [{ page: 2, options: undefined }]);
});

await test("reloads the last valid page after deleting the final row on a page", async (t) => {
  const list = createList(3, 20);
  t.after(() => list.scope.stop());

  await list.refreshList();

  assert.equal(list.page.value, 2);
  assert.deepEqual(list.requests, [
    { page: 3, options: undefined },
    { page: 2, options: { dedupe: "defer" } },
  ]);
});

await test("returns to page one when the list becomes empty", async (t) => {
  const list = createList(2, 0);
  t.after(() => list.scope.stop());

  await list.refreshList();

  assert.equal(list.page.value, 1);
  assert.equal(list.requests.at(-1)?.page, 1);
});

await test("does not change the page when loading fails", async (t) => {
  const list = createList(3, 0);
  t.after(() => list.scope.stop());
  list.error.value = new Error("Request failed");

  await list.refreshList();

  assert.equal(list.page.value, 3);
  assert.equal(list.requests.length, 1);
});

await test("does not fetch after the page has been disposed", async () => {
  const list = createList(3, 0);
  list.scope.stop();

  await list.refreshList();

  assert.equal(list.page.value, 3);
  assert.equal(list.requests.length, 0);
});

await test("does not reload another page if disposed during a request", async (t) => {
  const list = createList(3, 0);
  t.after(() => list.scope.stop());

  const pendingRefresh = list.refreshList();
  list.scope.stop();
  await pendingRefresh;

  assert.equal(list.page.value, 3);
  assert.equal(list.requests.length, 1);
});
