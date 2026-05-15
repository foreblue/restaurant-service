import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit3, PackagePlus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { DataTable } from "@/components/table/DataTable";
import { Alert, Button, Checkbox, Field, fieldA11y, Input, Select } from "@/components/ui";
import {
  emptyReservationProductFormValues,
  type ReservationProductFormValues,
  reservationProductFormSchema,
} from "@/features/products/reservationProductSchema";
import {
  useCreateReservationProductMutation,
  useDeleteReservationProductMutation,
  useReservationProductsQuery,
  useUpdateReservationProductMutation,
} from "@/features/products/reservationProductsQueries";
import {
  type BusinessDayOfWeek,
  type ReservationProductResponse,
  type ReservationProductSaveRequest,
} from "@/shared/api/businessApiClient";

type ProductFormMode =
  | {
      type: "create";
    }
  | {
      type: "edit";
      product: ReservationProductResponse;
    };

type ProductSortKey = "newest" | "name" | "visible";

const allDays: BusinessDayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const sortOptions = [
  { label: "최신 등록순", value: "newest" },
  { label: "상품명순", value: "name" },
  { label: "노출 우선", value: "visible" },
];
const emptyProducts: ReservationProductResponse[] = [];

export function ReservationProductsPage() {
  const productsQuery = useReservationProductsQuery();
  const createProduct = useCreateReservationProductMutation();
  const updateProduct = useUpdateReservationProductMutation();
  const deleteProduct = useDeleteReservationProductMutation();
  const [formMode, setFormMode] = useState<ProductFormMode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReservationProductResponse | null>(null);
  const [sortKey, setSortKey] = useState<ProductSortKey>("newest");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const form = useForm<ReservationProductFormValues>({
    defaultValues: emptyReservationProductFormValues,
    resolver: zodResolver(reservationProductFormSchema),
  });
  const products = productsQuery.data ?? emptyProducts;
  const sortedProducts = useMemo(() => sortProducts(products, sortKey), [products, sortKey]);
  const visibleCount = products.filter((product) => product.visible).length;
  const hiddenCount = products.length - visibleCount;
  const saveError = createProduct.error ?? updateProduct.error;
  const isSaving = createProduct.isPending || updateProduct.isPending;
  const columns: Array<ColumnDef<ReservationProductResponse>> = [
    {
      accessorKey: "name",
      header: "상품",
      cell: ({ row }) => (
        <div className="grid min-w-[180px] gap-1">
          <span className="font-medium">{row.original.name}</span>
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {row.original.description || "설명 없음"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "priceAmount",
      header: "가격",
      cell: ({ row }) => formatPrice(row.original.priceAmount),
    },
    {
      accessorKey: "visible",
      header: "노출",
      cell: ({ row }) => <VisibilityBadge visible={row.original.visible} />,
    },
    {
      accessorKey: "createdAt",
      header: "등록일",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      id: "actions",
      header: "관리",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label={`${row.original.name} 수정`}
            onClick={() => openEditForm(row.original)}
          >
            <Edit3 aria-hidden className="size-4" />
            수정
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            aria-label={`${row.original.name} 삭제`}
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 aria-hidden className="size-4" />
            삭제
          </Button>
        </div>
      ),
    },
  ];

  function openCreateForm() {
    setFormMode({ type: "create" });
    setResultMessage(null);
    createProduct.reset();
    updateProduct.reset();
    form.reset(emptyReservationProductFormValues);
  }

  function openEditForm(product: ReservationProductResponse) {
    setFormMode({ type: "edit", product });
    setResultMessage(null);
    createProduct.reset();
    updateProduct.reset();
    form.reset(toFormValues(product));
  }

  function closeForm() {
    setFormMode(null);
    form.reset(emptyReservationProductFormValues);
    createProduct.reset();
    updateProduct.reset();
  }

  async function handleSubmit(values: ReservationProductFormValues) {
    if (!formMode) {
      return;
    }

    setResultMessage(null);

    try {
      if (formMode.type === "create") {
        await createProduct.mutateAsync(toSaveRequest(values));
        setResultMessage("상품이 생성되었습니다.");
      } else {
        await updateProduct.mutateAsync({
          productId: formMode.product.id,
          request: toSaveRequest(values, formMode.product),
        });
        setResultMessage("상품이 수정되었습니다.");
      }
      closeForm();
    } catch {
      // Mutation state renders the error.
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setResultMessage(null);

    try {
      await deleteProduct.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setResultMessage("상품이 삭제되었습니다.");
    } catch {
      // Mutation state renders the error.
    }
  }

  if (productsQuery.isPending) {
    return <Panel title="예약 상품" description="예약 상품을 불러오는 중입니다." />;
  }

  if (productsQuery.isError) {
    return <Panel title="예약 상품" description={productsQuery.error.message} variant="danger" />;
  }

  return (
    <section className="grid gap-5">
      <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">예약 상품</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            고객 예약 페이지에 노출할 기본 예약 상품을 관리합니다.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <PackagePlus aria-hidden className="size-4" />
          상품 추가
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="전체 상품" value={`${products.length}개`} />
        <Metric label="노출 상품" value={`${visibleCount}개`} />
        <Metric label="비노출 상품" value={`${hiddenCount}개`} />
      </div>

      {resultMessage ? <Alert variant="success">{resultMessage}</Alert> : null}
      {deleteProduct.isError ? (
        <Alert variant="danger">{errorMessage(deleteProduct.error)}</Alert>
      ) : null}

      {formMode ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {formMode.type === "create" ? "상품 추가" : "상품 수정"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                상품별 인원, 요일, 시간, 재고 설정은 다음 단계에서 관리합니다.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
              <X aria-hidden className="size-4" />
              닫기
            </Button>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
              <Field id="product-name" label="상품명" error={form.formState.errors.name?.message}>
                <Input
                  id="product-name"
                  invalid={Boolean(form.formState.errors.name)}
                  {...fieldA11y("product-name", { error: form.formState.errors.name?.message })}
                  {...form.register("name")}
                />
              </Field>
              <Field
                id="product-price"
                label="가격"
                error={form.formState.errors.priceAmount?.message}
              >
                <Input
                  id="product-price"
                  inputMode="numeric"
                  invalid={Boolean(form.formState.errors.priceAmount)}
                  {...fieldA11y("product-price", {
                    error: form.formState.errors.priceAmount?.message,
                  })}
                  {...form.register("priceAmount")}
                />
              </Field>
            </div>

            <Field
              id="product-description"
              label="상품 설명"
              error={form.formState.errors.description?.message}
            >
              <textarea
                className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                id="product-description"
                {...fieldA11y("product-description", {
                  error: form.formState.errors.description?.message,
                })}
                {...form.register("description")}
              />
            </Field>

            <Checkbox id="product-visible" label="예약 페이지 노출" {...form.register("visible")} />

            {saveError ? <Alert variant="danger">{errorMessage(saveError)}</Alert> : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                취소
              </Button>
              <Button type="submit" isLoading={isSaving}>
                <Save aria-hidden className="size-4" />
                상품 저장
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">상품 목록</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              삭제된 상품은 목록에서 제외되고 새 고객 예약에는 노출되지 않습니다.
            </p>
          </div>
          <Field id="product-sort" label="목록 정렬" className="sm:w-48">
            <Select
              id="product-sort"
              options={sortOptions}
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as ProductSortKey)}
            />
          </Field>
        </div>
        <DataTable
          columns={columns}
          data={sortedProducts}
          emptyMessage="등록된 예약 상품이 없습니다."
          getRowId={(row) => String(row.id)}
        />
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="예약 상품 삭제"
        description={
          deleteTarget
            ? `${deleteTarget.name} 상품을 삭제/비활성화합니다. 고객 예약 페이지와 상품 목록에서 제외됩니다.`
            : ""
        }
        confirmLabel="삭제/비활성화"
        intent="danger"
        isPending={deleteProduct.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}

function VisibilityBadge({ visible }: { visible: boolean }) {
  return (
    <span
      className={
        visible
          ? "inline-flex rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium text-primary"
          : "inline-flex rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      {visible ? "노출" : "비노출"}
    </span>
  );
}

function Panel({
  title,
  description,
  variant = "info",
}: {
  title: string;
  description: string;
  variant?: "info" | "danger";
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
      <div className="mt-4">
        <Alert variant={variant}>{description}</Alert>
      </div>
    </section>
  );
}

function toFormValues(product: ReservationProductResponse): ReservationProductFormValues {
  return {
    name: product.name,
    description: product.description ?? "",
    priceAmount: String(product.priceAmount),
    visible: product.visible,
  };
}

function toSaveRequest(
  values: ReservationProductFormValues,
  current?: ReservationProductResponse,
): ReservationProductSaveRequest {
  const description = values.description.trim();

  return {
    name: values.name.trim(),
    description: description || null,
    priceAmount: Number(values.priceAmount),
    visible: values.visible,
    minPartySize: current?.minPartySize ?? 1,
    maxPartySize: current?.maxPartySize ?? 4,
    availableDays: current?.availableDays ?? allDays,
    availableStartTime: current?.availableStartTime ?? null,
    availableEndTime: current?.availableEndTime ?? null,
    slotCapacity: current?.slotCapacity ?? 4,
  };
}

function sortProducts(products: ReservationProductResponse[], sortKey: ProductSortKey) {
  return [...products].sort((a, b) => {
    if (sortKey === "name") {
      return a.name.localeCompare(b.name, "ko-KR");
    }

    if (sortKey === "visible" && a.visible !== b.visible) {
      return a.visible ? -1 : 1;
    }

    const createdAtDiff = timestamp(b.createdAt) - timestamp(a.createdAt);

    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return b.id - a.id;
  });
}

function timestamp(value: string | null) {
  return value ? Date.parse(value) || 0 : 0;
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
