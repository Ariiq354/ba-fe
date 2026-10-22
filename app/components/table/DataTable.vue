<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";

const {
  data,
  viewable,
  deletable,
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
const selectedIds = computed(() =>
  Object.keys(rowSelection.value)
    .filter((key) => rowSelection.value[key])
    .map((key) => data?.[Number(key)]?.id)
    .filter((id) => id != null),
);

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
              "aria-label": "Pilih semua baris",
            }),
          cell: ({ row }) =>
            h(UCheckbox, {
              modelValue: row.getIsSelected(),
              "onUpdate:modelValue": (value: boolean | "indeterminate") =>
                row.toggleSelected(!!value),
              "aria-label": "Pilih baris",
            }),
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
              ...(deletable && (viewable || editable)
                ? [{ type: "separator" as const } as DropdownMenuItem]
                : []),
              ...(deletable
                ? [
                    {
                      label: "Hapus",
                      icon: "i-tabler-trash",
                      color: "error",
                      onSelect() {
                        emit("delete", [row.original.id]);
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
                    "aria-label": "Tindakan untuk baris ini",
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
    <div
      v-if="selectedIds.length"
      class="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted px-3 py-2"
    >
      <p class="text-sm font-medium" role="status" aria-live="polite">
        {{ selectedIds.length }} dipilih
      </p>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="ghost" size="sm" @click="rowSelection = {}">
          Batal pilih
        </UButton>
        <UButton
          v-if="deletable"
          icon="i-tabler-trash"
          color="error"
          variant="soft"
          size="sm"
          @click="emit('delete', selectedIds)"
        >
          Hapus yang dipilih
        </UButton>
      </div>
    </div>
    <UTable
      v-model:row-selection="rowSelection"
      class="border-y border-default"
      :data="data"
      :columns="newColumns"
      :loading="loading"
      :ui="{
        th: 'px-3 py-3 text-xs text-muted font-medium bg-muted/50',
        td: 'px-3 py-3 text-sm text-highlighted',
        tr: 'data-[selected=true]:bg-primary/5',
      }"
    >
      <template v-for="(_, slotName) in slots" :key="slotName" #[slotName]="slotData">
        <slot :name="slotName" v-bind="slotData ?? {}" />
      </template>
    </UTable>

    <div v-if="pagination" class="mt-2 flex items-center justify-center md:justify-between">
      <p class="text-muted hidden text-xs tabular-nums md:block">
        Menampilkan {{ total === 0 ? 0 : (page - 1) * 10 + 1 }} sampai
        {{ Math.min((page - 1) * 10 + 10, total) }} dari {{ total }} item
      </p>
      <div class="flex justify-center">
        <UPagination v-model:page="page" :total="total" />
      </div>
    </div>
  </div>
</template>
