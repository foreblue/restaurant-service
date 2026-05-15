import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit3, PackagePlus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

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
  useSaveReservationProductCancellationPolicyMutation,
  useUpdateReservationProductPaymentPolicyMutation,
  useUpdateReservationProductMutation,
} from "@/features/products/reservationProductsQueries";
import {
  type BusinessDayOfWeek,
  type ReservationProductDepositType,
  type ReservationProductPaymentMode,
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

interface ProductPolicyFormValues {
  paymentMode: ReservationProductPaymentMode;
  depositType: ReservationProductDepositType;
  paymentAmount: string;
  noShowFeeAmount: string;
  cancellationName: string;
  refundRate48Hours: string;
  refundRate24Hours: string;
  refundRate0Hours: string;
  noShowRefundRate: string;
  cancellationNoShowFee: string;
}

const allDays: BusinessDayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const dayOptions: Array<{ value: BusinessDayOfWeek; label: string; shortLabel: string }> = [
  { value: "MONDAY", label: "월요일", shortLabel: "월" },
  { value: "TUESDAY", label: "화요일", shortLabel: "화" },
  { value: "WEDNESDAY", label: "수요일", shortLabel: "수" },
  { value: "THURSDAY", label: "목요일", shortLabel: "목" },
  { value: "FRIDAY", label: "금요일", shortLabel: "금" },
  { value: "SATURDAY", label: "토요일", shortLabel: "토" },
  { value: "SUNDAY", label: "일요일", shortLabel: "일" },
];

const sortOptions = [
  { label: "최신 등록순", value: "newest" },
  { label: "상품명순", value: "name" },
  { label: "노출 우선", value: "visible" },
];
const paymentModeOptions = [
  { label: "무료/현장 결제", value: "NONE" },
  { label: "예약금", value: "DEPOSIT" },
  { label: "전액 선결제", value: "PREPAY" },
  { label: "카드 보증", value: "CARD_GUARANTEE" },
];
const depositTypeOptions = [
  { label: "예약 건당", value: "PER_RESERVATION" },
  { label: "인원당", value: "PER_PERSON" },
];
const emptyProducts: ReservationProductResponse[] = [];
const emptyPolicyFormValues: ProductPolicyFormValues = {
  paymentMode: "NONE",
  depositType: "PER_RESERVATION",
  paymentAmount: "0",
  noShowFeeAmount: "0",
  cancellationName: "기본 취소 정책",
  refundRate48Hours: "100",
  refundRate24Hours: "50",
  refundRate0Hours: "0",
  noShowRefundRate: "0",
  cancellationNoShowFee: "0",
};

export function ReservationProductsPage() {
  const productsQuery = useReservationProductsQuery();
  const createProduct = useCreateReservationProductMutation();
  const updateProduct = useUpdateReservationProductMutation();
  const deleteProduct = useDeleteReservationProductMutation();
  const updatePaymentPolicy = useUpdateReservationProductPaymentPolicyMutation();
  const saveCancellationPolicy = useSaveReservationProductCancellationPolicyMutation();
  const [formMode, setFormMode] = useState<ProductFormMode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReservationProductResponse | null>(null);
  const [sortKey, setSortKey] = useState<ProductSortKey>("newest");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [policyValues, setPolicyValues] = useState<ProductPolicyFormValues>(emptyPolicyFormValues);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySaved, setPolicySaved] = useState(false);
  const form = useForm<ReservationProductFormValues>({
    defaultValues: emptyReservationProductFormValues,
    resolver: zodResolver(reservationProductFormSchema),
  });
  const watchedValues = useWatch({ control: form.control });
  const formValues: ReservationProductFormValues = {
    ...emptyReservationProductFormValues,
    ...watchedValues,
  };
  const selectedDays = formValues.availableDays;
  const products = productsQuery.data ?? emptyProducts;
  const sortedProducts = useMemo(() => sortProducts(products, sortKey), [products, sortKey]);
  const visibleCount = products.filter((product) => product.visible).length;
  const hiddenCount = products.length - visibleCount;
  const saveError = createProduct.error ?? updateProduct.error;
  const isSaving = createProduct.isPending || updateProduct.isPending;
  const policySaveError = updatePaymentPolicy.error ?? saveCancellationPolicy.error;
  const isPolicySaving = updatePaymentPolicy.isPending || saveCancellationPolicy.isPending;
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
      id: "conditions",
      header: "예약 조건",
      cell: ({ row }) => (
        <div className="grid min-w-[180px] gap-1 text-xs text-muted-foreground">
          <span>{formatPartySize(row.original)}</span>
          <span>{formatAvailableDays(row.original.availableDays)}</span>
          <span>
            {formatAvailableTime(row.original)} · 재고 {row.original.slotCapacity}
          </span>
        </div>
      ),
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
    setPolicyValues(emptyPolicyFormValues);
    setPolicyError(null);
    setPolicySaved(false);
    createProduct.reset();
    updateProduct.reset();
    updatePaymentPolicy.reset();
    saveCancellationPolicy.reset();
    form.reset(emptyReservationProductFormValues);
  }

  function openEditForm(product: ReservationProductResponse) {
    setFormMode({ type: "edit", product });
    setResultMessage(null);
    setPolicyValues(toPolicyFormValues(product));
    setPolicyError(null);
    setPolicySaved(false);
    createProduct.reset();
    updateProduct.reset();
    updatePaymentPolicy.reset();
    saveCancellationPolicy.reset();
    form.reset(toFormValues(product));
  }

  function closeForm() {
    setFormMode(null);
    form.reset(emptyReservationProductFormValues);
    setPolicyValues(emptyPolicyFormValues);
    setPolicyError(null);
    setPolicySaved(false);
    createProduct.reset();
    updateProduct.reset();
    updatePaymentPolicy.reset();
    saveCancellationPolicy.reset();
  }

  function toggleAvailableDay(day: BusinessDayOfWeek, checked: boolean) {
    const current = form.getValues("availableDays");
    const nextDays = checked
      ? allDays.filter((item) => item === day || current.includes(item))
      : current.filter((item) => item !== day);

    form.setValue("availableDays", nextDays, {
      shouldDirty: true,
      shouldValidate: true,
    });
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
          request: toSaveRequest(values),
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

  function updatePolicy(patch: Partial<ProductPolicyFormValues>) {
    setPolicyError(null);
    setPolicySaved(false);
    updatePaymentPolicy.reset();
    saveCancellationPolicy.reset();
    setPolicyValues((current) => ({ ...current, ...patch }));
  }

  async function handleSavePolicy() {
    if (!formMode || formMode.type !== "edit") {
      return;
    }

    const validationError = validatePolicyForm(policyValues, formMode.product);

    setPolicyError(null);
    setPolicySaved(false);

    if (validationError) {
      setPolicyError(validationError);
      return;
    }

    try {
      await updatePaymentPolicy.mutateAsync({
        productId: formMode.product.id,
        request: toPaymentPolicyRequest(policyValues, formMode.product),
      });
      await saveCancellationPolicy.mutateAsync({
        productId: formMode.product.id,
        request: toCancellationPolicyRequest(policyValues),
      });
      setPolicySaved(true);
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

            <div className="grid gap-4 lg:grid-cols-3">
              <Field
                id="product-min-party"
                label="최소 인원"
                error={form.formState.errors.minPartySize?.message}
              >
                <Input
                  id="product-min-party"
                  inputMode="numeric"
                  invalid={Boolean(form.formState.errors.minPartySize)}
                  {...fieldA11y("product-min-party", {
                    error: form.formState.errors.minPartySize?.message,
                  })}
                  {...form.register("minPartySize")}
                />
              </Field>
              <Field
                id="product-max-party"
                label="최대 인원"
                error={form.formState.errors.maxPartySize?.message}
              >
                <Input
                  id="product-max-party"
                  inputMode="numeric"
                  invalid={Boolean(form.formState.errors.maxPartySize)}
                  {...fieldA11y("product-max-party", {
                    error: form.formState.errors.maxPartySize?.message,
                  })}
                  {...form.register("maxPartySize")}
                />
              </Field>
              <Field
                id="product-slot-capacity"
                label="슬롯 재고"
                error={form.formState.errors.slotCapacity?.message}
              >
                <Input
                  id="product-slot-capacity"
                  inputMode="numeric"
                  invalid={Boolean(form.formState.errors.slotCapacity)}
                  {...fieldA11y("product-slot-capacity", {
                    error: form.formState.errors.slotCapacity?.message,
                  })}
                  {...form.register("slotCapacity")}
                />
              </Field>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-medium">예약 가능 요일</p>
              <div
                aria-label="예약 가능 요일"
                className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                role="group"
              >
                {dayOptions.map((day) => (
                  <Checkbox
                    checked={selectedDays.includes(day.value)}
                    id={`available-day-${day.value}`}
                    key={day.value}
                    label={`${day.label} 가능`}
                    onChange={(event) => toggleAvailableDay(day.value, event.target.checked)}
                  />
                ))}
              </div>
              {form.formState.errors.availableDays?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.availableDays.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                id="product-available-start"
                label="예약 가능 시작"
                error={form.formState.errors.availableStartTime?.message}
              >
                <Input
                  id="product-available-start"
                  type="time"
                  invalid={Boolean(form.formState.errors.availableStartTime)}
                  {...fieldA11y("product-available-start", {
                    error: form.formState.errors.availableStartTime?.message,
                  })}
                  {...form.register("availableStartTime")}
                />
              </Field>
              <Field
                id="product-available-end"
                label="예약 가능 종료"
                error={form.formState.errors.availableEndTime?.message}
              >
                <Input
                  id="product-available-end"
                  type="time"
                  invalid={Boolean(form.formState.errors.availableEndTime)}
                  {...fieldA11y("product-available-end", {
                    error: form.formState.errors.availableEndTime?.message,
                  })}
                  {...form.register("availableEndTime")}
                />
              </Field>
            </div>

            <Alert>
              설정 요약: {formValues.minPartySize || "-"}-{formValues.maxPartySize || "-"}명,{" "}
              {formatAvailableDays(selectedDays)}, {formatFormTimeRange(formValues)}, 슬롯 재고{" "}
              {formValues.slotCapacity || "-"}
            </Alert>

            {formMode.type === "edit" ? (
              <section className="grid gap-4 border-t border-border pt-4">
                <div>
                  <h3 className="text-sm font-semibold">결제/취소 정책</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    고객 예약 화면에 표시할 결제 방식과 취소 환불 기준입니다.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Field id="product-payment-mode" label="결제 방식">
                    <Select
                      id="product-payment-mode"
                      options={paymentModeOptions}
                      value={policyValues.paymentMode}
                      onChange={(event) =>
                        updatePolicy({
                          paymentMode: event.target.value as ReservationProductPaymentMode,
                        })
                      }
                    />
                  </Field>
                  {policyValues.paymentMode === "DEPOSIT" ? (
                    <>
                      <Field id="product-deposit-type" label="예약금 기준">
                        <Select
                          id="product-deposit-type"
                          options={depositTypeOptions}
                          value={policyValues.depositType}
                          onChange={(event) =>
                            updatePolicy({
                              depositType: event.target.value as ReservationProductDepositType,
                            })
                          }
                        />
                      </Field>
                      <TextFieldInline
                        id="product-payment-amount"
                        label="예약금"
                        value={policyValues.paymentAmount}
                        onChange={(value) => updatePolicy({ paymentAmount: value })}
                      />
                    </>
                  ) : null}
                  {policyValues.paymentMode === "CARD_GUARANTEE" ? (
                    <TextFieldInline
                      id="product-no-show-fee"
                      label="카드 보증 수수료"
                      value={policyValues.noShowFeeAmount}
                      onChange={(value) => updatePolicy({ noShowFeeAmount: value })}
                    />
                  ) : null}
                  {policyValues.paymentMode === "PREPAY" ? (
                    <Alert>전액 선결제 금액: {formatPrice(formMode.product.priceAmount)}</Alert>
                  ) : null}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_repeat(5,120px)]">
                  <TextFieldInline
                    id="product-cancel-name"
                    label="취소 정책명"
                    value={policyValues.cancellationName}
                    onChange={(value) => updatePolicy({ cancellationName: value })}
                  />
                  <TextFieldInline
                    id="refund-rate-48"
                    label="48시간 전"
                    value={policyValues.refundRate48Hours}
                    onChange={(value) => updatePolicy({ refundRate48Hours: value })}
                  />
                  <TextFieldInline
                    id="refund-rate-24"
                    label="24시간 전"
                    value={policyValues.refundRate24Hours}
                    onChange={(value) => updatePolicy({ refundRate24Hours: value })}
                  />
                  <TextFieldInline
                    id="refund-rate-0"
                    label="당일"
                    value={policyValues.refundRate0Hours}
                    onChange={(value) => updatePolicy({ refundRate0Hours: value })}
                  />
                  <TextFieldInline
                    id="refund-rate-no-show"
                    label="노쇼 환불율"
                    value={policyValues.noShowRefundRate}
                    onChange={(value) => updatePolicy({ noShowRefundRate: value })}
                  />
                  <TextFieldInline
                    id="cancel-no-show-fee"
                    label="노쇼 수수료"
                    value={policyValues.cancellationNoShowFee}
                    onChange={(value) => updatePolicy({ cancellationNoShowFee: value })}
                  />
                </div>

                <Alert title="고객 화면 요약">
                  {paymentPolicySummary(policyValues, formMode.product)}{" "}
                  {cancellationPolicySummary(policyValues)}
                </Alert>

                {policyError ? <Alert variant="danger">{policyError}</Alert> : null}
                {policySaveError ? (
                  <Alert variant="danger">{errorMessage(policySaveError)}</Alert>
                ) : null}
                {policySaved ? (
                  <Alert variant="success">결제/취소 정책이 저장되었습니다.</Alert>
                ) : null}

                <div className="flex justify-end">
                  <Button type="button" isLoading={isPolicySaving} onClick={handleSavePolicy}>
                    <Save aria-hidden className="size-4" />
                    정책 저장
                  </Button>
                </div>
              </section>
            ) : null}

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

function formatPartySize(product: ReservationProductResponse) {
  return product.minPartySize === product.maxPartySize
    ? `${product.minPartySize}명`
    : `${product.minPartySize}-${product.maxPartySize}명`;
}

function formatAvailableDays(days: BusinessDayOfWeek[]) {
  if (days.length === allDays.length) {
    return "전체 요일";
  }

  return dayOptions
    .filter((day) => days.includes(day.value))
    .map((day) => day.shortLabel)
    .join(", ");
}

function formatAvailableTime(product: ReservationProductResponse) {
  if (!product.availableStartTime || !product.availableEndTime) {
    return "전체 영업시간";
  }

  return `${formatTime(product.availableStartTime)}-${formatTime(product.availableEndTime)}`;
}

function formatFormTimeRange(values: ReservationProductFormValues) {
  if (!values.availableStartTime && !values.availableEndTime) {
    return "전체 영업시간";
  }

  return `${values.availableStartTime || "-"}-${values.availableEndTime || "-"}`;
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

function TextFieldInline({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label}>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function toFormValues(product: ReservationProductResponse): ReservationProductFormValues {
  return {
    name: product.name,
    description: product.description ?? "",
    priceAmount: String(product.priceAmount),
    visible: product.visible,
    minPartySize: String(product.minPartySize),
    maxPartySize: String(product.maxPartySize),
    availableDays: product.availableDays,
    availableStartTime: product.availableStartTime ?? "",
    availableEndTime: product.availableEndTime ?? "",
    slotCapacity: String(product.slotCapacity),
  };
}

function toPolicyFormValues(product: ReservationProductResponse): ProductPolicyFormValues {
  return {
    ...emptyPolicyFormValues,
    paymentMode: product.paymentPolicyType,
    paymentAmount: String(product.paymentAmount ?? 0),
  };
}

function toSaveRequest(values: ReservationProductFormValues): ReservationProductSaveRequest {
  const description = values.description.trim();

  return {
    name: values.name.trim(),
    description: description || null,
    priceAmount: Number(values.priceAmount),
    visible: values.visible,
    minPartySize: Number(values.minPartySize),
    maxPartySize: Number(values.maxPartySize),
    availableDays: values.availableDays,
    availableStartTime: values.availableStartTime || null,
    availableEndTime: values.availableEndTime || null,
    slotCapacity: Number(values.slotCapacity),
  };
}

function validatePolicyForm(values: ProductPolicyFormValues, product: ReservationProductResponse) {
  const paymentAmount = parseInteger(values.paymentAmount, "결제 금액");
  const noShowFeeAmount = parseInteger(values.noShowFeeAmount, "노쇼 수수료");
  const cancellationNoShowFee = parseInteger(values.cancellationNoShowFee, "노쇼 수수료");
  const refundRates = [
    parseInteger(values.refundRate48Hours, "48시간 전 환불율"),
    parseInteger(values.refundRate24Hours, "24시간 전 환불율"),
    parseInteger(values.refundRate0Hours, "당일 환불율"),
    parseInteger(values.noShowRefundRate, "노쇼 환불율"),
  ];

  if (!values.cancellationName.trim()) {
    return "취소 정책명을 입력해 주세요.";
  }

  if (typeof paymentAmount === "string") return paymentAmount;
  if (typeof noShowFeeAmount === "string") return noShowFeeAmount;
  if (typeof cancellationNoShowFee === "string") return cancellationNoShowFee;

  for (const refundRate of refundRates) {
    if (typeof refundRate === "string") {
      return refundRate;
    }
    if (refundRate < 0 || refundRate > 100) {
      return "환불율은 0부터 100 사이 정수로 입력해 주세요.";
    }
  }

  if (values.paymentMode === "DEPOSIT" && paymentAmount < 1) {
    return "예약금은 1원 이상이어야 합니다.";
  }
  if (values.paymentMode === "PREPAY" && product.priceAmount < 1) {
    return "전액 선결제 상품은 가격이 1원 이상이어야 합니다.";
  }
  if (values.paymentMode === "CARD_GUARANTEE" && noShowFeeAmount < 1) {
    return "카드 보증 수수료는 1원 이상이어야 합니다.";
  }

  return null;
}

function toPaymentPolicyRequest(
  values: ProductPolicyFormValues,
  product: ReservationProductResponse,
) {
  return {
    paymentMode: values.paymentMode,
    depositType: values.paymentMode === "DEPOSIT" ? values.depositType : null,
    paymentAmount:
      values.paymentMode === "DEPOSIT"
        ? Number(values.paymentAmount)
        : values.paymentMode === "PREPAY"
          ? product.priceAmount
          : null,
    noShowFeeAmount:
      values.paymentMode === "CARD_GUARANTEE" ? Number(values.noShowFeeAmount) : null,
  };
}

function toCancellationPolicyRequest(values: ProductPolicyFormValues) {
  return {
    name: values.cancellationName.trim(),
    rules: [
      { beforeVisitHours: 48, refundRate: Number(values.refundRate48Hours) },
      { beforeVisitHours: 24, refundRate: Number(values.refundRate24Hours) },
      { beforeVisitHours: 0, refundRate: Number(values.refundRate0Hours) },
    ],
    noShowRule: {
      refundRate: Number(values.noShowRefundRate),
      feeAmount: Number(values.cancellationNoShowFee),
    },
  };
}

function paymentPolicySummary(
  values: ProductPolicyFormValues,
  product: ReservationProductResponse,
) {
  if (values.paymentMode === "DEPOSIT") {
    return `예약금 ${formatPrice(Number(values.paymentAmount || 0))} 결제 후 예약을 확정합니다.`;
  }
  if (values.paymentMode === "PREPAY") {
    return `상품 가격 ${formatPrice(product.priceAmount)} 전액을 예약 시 결제합니다.`;
  }
  if (values.paymentMode === "CARD_GUARANTEE") {
    return `카드 보증 후 노쇼 시 최대 ${formatPrice(Number(values.noShowFeeAmount || 0))}를 청구합니다.`;
  }

  return "예약 시 결제 없이 현장 결제로 안내합니다.";
}

function cancellationPolicySummary(values: ProductPolicyFormValues) {
  return `취소 환불율: 48시간 전 ${values.refundRate48Hours}%, 24시간 전 ${values.refundRate24Hours}%, 당일 ${values.refundRate0Hours}%, 노쇼 ${values.noShowRefundRate}%.`;
}

function parseInteger(value: string, label: string) {
  if (!/^\d+$/.test(value.trim())) {
    return `${label}은 0 이상 정수로 입력해 주세요.`;
  }

  return Number(value);
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

function formatTime(value: string) {
  return value.slice(0, 5);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
