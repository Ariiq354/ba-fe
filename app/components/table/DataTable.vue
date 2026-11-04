<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";

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
  data: any[] | undefined;
  columns: TableColumn<any>[];
  loading?: boolean;
  viewable?: boolean;
  deletable?: boolean;
  rowDeletable?: (row: any) => boolean;
  editable?: boolean;
  selectable?: boolean;
  enumerate?: boolean;
  total?: number;
  pagination?: boolean;
  dropdownItems?: (e: any) => DropdownMenuItem[];
}>();
const emit = defineEmits<{
  (e: "edit" | "view", row: any): void;
  (e: "delete", payload: any | any[]): void;
}>();
const slots = useSlots();
const page = defineModel("page", { default: 1 });
const rowSelection = ref<Record<string, boolean>>({});

function isRowDeletable(row: any) {
  return !!deletable && (rowDeletable?.(row) ?? true);
}

function canSelectRow(row: { original: any }) {
  return !!selectable && (rowDeletable?.(row.original) ?? true);
}

const selectedIds = computed(() =>
  Object.entries(rowSelection.value)
    .filter(([, selected]) => selected)
    .map(([index]) => data?.[Number(index)])
    .filter((row) => row && canSelectRow({ original: row }) && isRowDeletable(row))
    .map((row) => row.id)
    .filter((id) => id != null),
);

function deleteSelectedRows() {
  if (!selectedIds.value.length) return;
  emit("delete", selectedIds.value);
}

const UButton = resolveComponent("UButton");
const UCheckbox = resolveComponent("UCheckbox");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const newColumns = computed<TableColumn<any>[]>(() => [
  ...(selectable
    ? [
        {
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
        } as TableColumn<any>,
      ]
    : []),
  ...(enumerate
    ? [
        {
          header: "No.",
          cell: (info: any) => info.row.index + 1 + (page.value! - 1) * 10,
        },
      ]
    : []),
  ...columns,
  ...(viewable || deletable || editable || dropdownItems
    ? [
        {
          header: "",
          accessorKey: "actions",
          cell: ({ row }) => {
            const canDelete = isRowDeletable(row.original);
            const items: DropdownMenuItem[] = [
              ...(viewable
                ? [
                    {
                      label: "Lihat Detail",
                      icon: "i-tabler-eye",
                      onSelect() {
                        emit("view", row.original);
                      },
                    } as DropdownMenuItem,
                  ]
                : []),
              ...(editable
                ? [
                    {
                      label: "Edit",
                      icon: "i-tabler-edit",
                      onSelect() {
                        emit("edit", row.original);
                      },
                    } as DropdownMenuItem,
                  ]
                : []),
              ...(dropdownItems ? dropdownItems(row.original) : []),
              ...(canDelete && (viewable || editable)
                ? [{ type: "separator" as const } as DropdownMenuItem]
                : []),
              ...(canDelete
                ? [
                    {
                      label: "Hapus",
                      icon: "i-tabler-trash",
                      color: "error",
                      onSelect() {
                        if (isRowDeletable(row.original)) emit("delete", [row.original.id]);
                      },
                    } as DropdownMenuItem,
                  ]
                : []),
            ];

            return h(
              "div",
              { class: "text-center" },
              h(
                UDropdownMenu,
                {
                  items,
                  ui: {
                    content: "w-48",
                  },
                },
                () =>
                  h(UButton, {
                    icon: "i-tabler-dots-vertical",
                    color: "neutral",
                    variant: "ghost",
                    "aria-label": "Actions dropdown",
                  }),
              ),
            );
          },
        } as TableColumn<any>,
      ]
    : []),
]);

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
      <template v-for="(_, slotName) in slots" :key="slotName" #[slotName]="slotData">
        <slot :name="slotName" v-bind="slotData ?? {}" />
      </template>
    </UTable>

    <div v-if="pagination" class="mt-2 flex items-center justify-center md:justify-between">
      <p class="text-muted hidden px-2 text-sm md:block">
        Menampilkan {{ total === 0 ? 0 : (page - 1) * 10 + 1 }} sampai
        {{ Math.min((page - 1) * 10 + 10, total) }} dari {{ total }} item
      </p>
      <div class="flex justify-center">
        <UPagination v-model:page="page" :total="total" />
      </div>
    </div>
  </div>
</template>
