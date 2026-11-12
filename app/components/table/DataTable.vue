<script setup lang="ts" generic="T extends object">
import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
import { PAGE_SIZE } from "~/constants";

type RowId = T extends { id: infer Id extends string | number } ? Id : never;

const {
  data,
  viewable,
  deletable,
  rowDeletable,
  editable,
  selectable,
  columns,
  enumerate,
  dropdownItems,
  total = 0,
} = defineProps<{
  data: T[] | undefined;
  columns: TableColumn<T>[];
  loading?: boolean;
  viewable?: boolean;
  deletable?: boolean;
  rowDeletable?: (row: T) => boolean;
  editable?: boolean;
  selectable?: boolean;
  enumerate?: boolean;
  total?: number;
  pagination?: boolean;
  dropdownItems?: (row: T) => DropdownMenuItem[];
}>();
const emit = defineEmits<{
  edit: [row: T];
  view: [row: T];
  delete: [ids: RowId[]];
}>();
const slots = useSlots();
const page = defineModel("page", { default: 1 });
const rowSelection = ref<Record<string, boolean>>({});

function getForwardedSlotNames() {
  return Object.keys(slots).filter((name) => name !== "actions-cell");
}

function getRowId(row: T): RowId | undefined {
  if ("id" in row && (typeof row.id === "string" || typeof row.id === "number")) {
    return row.id as RowId;
  }
}

function isRowDeletable(row: T) {
  return !!deletable && (rowDeletable?.(row) ?? true);
}

function canSelectRow(row: { original: T }) {
  return !!selectable && (rowDeletable?.(row.original) ?? true);
}

const selectedIds = computed(() => {
  const ids: RowId[] = [];
  for (const [index, selected] of Object.entries(rowSelection.value)) {
    const row = data?.[Number(index)];
    if (!selected || !row || !selectable || !isRowDeletable(row)) continue;
    const id = getRowId(row);
    if (id !== undefined) ids.push(id);
  }
  return ids;
});

function deleteSelectedRows() {
  if (!selectedIds.value.length) return;
  emit("delete", selectedIds.value);
}

const UCheckbox = resolveComponent("UCheckbox");

function getActions(row: T): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = [];
  if (viewable) {
    items.push({
      label: "Lihat Detail",
      icon: "i-tabler-eye",
      onSelect: () => emit("view", row),
    });
  }
  if (editable) {
    items.push({
      label: "Edit",
      icon: "i-tabler-edit",
      onSelect: () => emit("edit", row),
    });
  }
  if (dropdownItems) items.push(...dropdownItems(row));
  const id = getRowId(row);
  if (isRowDeletable(row) && id !== undefined) {
    if (items.length) items.push({ type: "separator" });
    items.push({
      label: "Hapus",
      icon: "i-tabler-trash",
      color: "error",
      onSelect() {
        if (isRowDeletable(row)) emit("delete", [id]);
      },
    });
  }
  return items;
}

const newColumns = computed<TableColumn<T>[]>(() => {
  const result: TableColumn<T>[] = [];
  if (selectable) {
    result.push({
      id: "select",
      header: ({ table }) =>
        h(UCheckbox, {
          modelValue: table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : table.getIsAllPageRowsSelected(),
          "onUpdate:modelValue": (value: boolean | "indeterminate") =>
            table.toggleAllPageRowsSelected(!!value),
          "aria-label": "Select all",
          disabled: !table.getRowModel().rows.some((row) => row.getCanSelect()),
        }),
      cell: ({ row }) =>
        row.getCanSelect()
          ? h(UCheckbox, {
              modelValue: row.getIsSelected(),
              "onUpdate:modelValue": (value: boolean | "indeterminate") =>
                row.toggleSelected(!!value),
              "aria-label": "Select row",
            })
          : null,
    });
  }
  if (enumerate) {
    result.push({
      header: "No.",
      cell: ({ row }) => row.index + 1 + (page.value - 1) * PAGE_SIZE,
    });
  }
  result.push(...columns);
  if (viewable || deletable || editable || dropdownItems) {
    result.push({ id: "actions", header: "" });
  }
  return result;
});

watch([() => data, page], () => {
  rowSelection.value = {};
});
</script>

<template>
  <div class="w-full space-y-4">
    <!-- Floating Action Bar for Bulk Selection -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-10 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-10 opacity-0"
      >
        <div
          v-if="selectedIds.length > 0"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md"
        >
          <UButton
            icon="i-tabler-x"
            color="neutral"
            variant="subtle"
            size="sm"
            class="rounded-full font-medium"
            @click="rowSelection = {}"
          >
            {{ selectedIds.length }} Terpilih
          </UButton>
          <UButton
            icon="i-tabler-trash"
            color="error"
            size="sm"
            class="rounded-full font-medium"
            @click="deleteSelectedRows"
          >
            Hapus
          </UButton>
        </div>
      </Transition>
    </Teleport>
    <UTable
      v-model:row-selection="rowSelection"
      class="border-accented rounded-lg border"
      :data="data"
      :columns="newColumns"
      :row-selection-options="{ enableRowSelection: canSelectRow }"
      :loading="loading"
      :ui="{
        th: 'text-muted font-medium',
        td: 'text-highlighted',
      }"
    >
      <template #actions-cell="slotData">
        <slot name="actions-cell" v-bind="slotData">
          <div class="text-center">
            <UDropdownMenu :items="getActions(slotData.row.original)" :ui="{ content: 'w-48' }">
              <UButton
                icon="i-tabler-dots-vertical"
                color="neutral"
                variant="ghost"
                aria-label="Actions dropdown"
              />
            </UDropdownMenu>
          </div>
        </slot>
      </template>
      <template v-for="slotName in getForwardedSlotNames()" :key="slotName" #[slotName]="slotData">
        <slot :name="slotName" v-bind="slotData ?? {}" />
      </template>
    </UTable>

    <div v-if="pagination" class="mt-2 flex items-center justify-center md:justify-between">
      <p class="text-muted hidden px-2 text-sm md:block">
        Menampilkan {{ total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1 }} sampai
        {{ Math.min(page * PAGE_SIZE, total) }} dari {{ total }} item
      </p>
      <div class="flex justify-center">
        <UPagination v-model:page="page" :total="total" :items-per-page="PAGE_SIZE" />
      </div>
    </div>
  </div>
</template>
