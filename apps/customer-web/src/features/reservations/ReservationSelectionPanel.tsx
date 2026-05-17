"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { Alert, Button, Select, StateBlock } from "@/components/ui";
import { usePublicApiClient } from "@/shared/api/usePublicApiClient";
import { PublicApiError, toCustomerApiErrorMessage } from "@/shared/api/apiError";

import { ReservationCustomerForm } from "./ReservationCustomerForm";
import { buildReservationCreateRequest, createPublicReservation } from "./reservationCreateApi";
import { ReservationCompletionCard } from "./ReservationCompletionCard";
import { getAvailabilityDates, getAvailabilityTimes } from "./reservationOptionsApi";
import {
  type AvailableDate,
  type AvailableTimeSlot,
  type PublicReservationProduct,
} from "./reservationOptionsTypes";
import { type ReservationCustomerFormValues } from "./reservationCustomerSchema";

interface ReservationSelectionPanelProps {
  products: PublicReservationProduct[];
  restaurantId: number;
}

export function ReservationSelectionPanel({
  products,
  restaurantId,
}: ReservationSelectionPanelProps) {
  const apiClient = usePublicApiClient();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    () => products[0]?.id ?? null,
  );
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const [partySize, setPartySize] = useState(() => selectedProduct?.minPartySize ?? 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailableTimeSlot | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      setPartySize(selectedProduct.minPartySize);
    }
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  }, [selectedProductId, selectedProduct]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  }, [partySize]);

  useEffect(() => {
    setSelectedTimeSlot(null);
  }, [selectedDate]);

  useEffect(() => {
    createReservationMutation.reset();
  }, [selectedProductId, partySize, selectedDate, selectedTimeSlot?.timeSlotId]);

  const partySizeOptions = useMemo(
    () => createPartySizeOptions(selectedProduct),
    [selectedProduct],
  );

  const datesQuery = useQuery({
    enabled: Boolean(selectedProduct),
    queryFn: () =>
      getAvailabilityDates(
        {
          partySize,
          productId: selectedProduct?.id ?? 0,
          restaurantId,
        },
        apiClient,
      ),
    queryKey: ["availability-dates", restaurantId, selectedProduct?.id, partySize],
  });

  const timesQuery = useQuery({
    enabled: Boolean(selectedProduct && selectedDate),
    queryFn: () =>
      getAvailabilityTimes(
        {
          date: selectedDate ?? "",
          partySize,
          productId: selectedProduct?.id ?? 0,
          restaurantId,
        },
        apiClient,
      ),
    queryKey: ["availability-times", restaurantId, selectedProduct?.id, partySize, selectedDate],
  });

  const createReservationMutation = useMutation({
    mutationFn: (customerInfo: ReservationCustomerFormValues) => {
      if (!selectedProduct || !selectedDate || !selectedTimeSlot) {
        throw new Error("예약 선택 정보가 완성되지 않았습니다.");
      }

      const idempotencyKey = createIdempotencyKey();

      return createPublicReservation(
        buildReservationCreateRequest({
          customerInfo,
          idempotencyKey,
          partySize,
          product: selectedProduct,
          restaurantId,
          selectedDate,
          selectedTimeSlot,
        }),
        idempotencyKey,
        apiClient,
      );
    },
  });

  if (products.length === 0) {
    return (
      <StateBlock title="예약 가능한 상품이 없습니다.">
        <p>매장이 예약 상품을 공개하면 이 영역에서 선택할 수 있습니다.</p>
      </StateBlock>
    );
  }

  return (
    <section className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-950">예약 상품</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          상품, 인원, 날짜, 시간을 순서대로 선택해 주세요.
        </p>
      </div>

      <div className="grid gap-2" role="list">
        {products.map((product) => (
          <button
            aria-pressed={product.id === selectedProductId}
            className="rounded-md border bg-white p-3 text-left transition hover:border-teal-600 aria-pressed:border-teal-700 aria-pressed:bg-teal-50"
            key={product.id}
            type="button"
            onClick={() => setSelectedProductId(product.id)}
          >
            <span className="block font-semibold text-slate-950">{product.name}</span>
            {product.description ? (
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                {product.description}
              </span>
            ) : null}
            <span className="mt-2 block text-sm font-medium text-teal-800">
              {formatCurrency(product.displayPrice)} · {product.minPartySize}-{product.maxPartySize}
              명
            </span>
          </button>
        ))}
      </div>

      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        인원
        <Select
          value={String(partySize)}
          onChange={(event) => setPartySize(Number(event.target.value))}
        >
          {partySizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}명
            </option>
          ))}
        </Select>
      </label>

      <AvailabilityDates
        dates={datesQuery.data?.dates ?? []}
        loading={datesQuery.isLoading}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />

      <AvailabilityTimes
        loading={timesQuery.isLoading}
        selectedTimeSlotId={selectedTimeSlot?.timeSlotId ?? null}
        times={timesQuery.data?.times ?? []}
        onSelect={setSelectedTimeSlot}
      />

      {selectedProduct && selectedDate && selectedTimeSlot ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-950">
          {selectedProduct.name} · {partySize}명 · {selectedDate} · {selectedTimeSlot.startTime}
        </div>
      ) : null}

      {createReservationMutation.data ? (
        <ReservationCompletionCard reservation={createReservationMutation.data} />
      ) : selectedProduct && selectedDate && selectedTimeSlot ? (
        <ReservationCustomerForm
          submitLabel="예약 완료"
          submitting={createReservationMutation.isPending}
          onSubmit={(values) => createReservationMutation.mutate(values)}
        />
      ) : (
        <StateBlock title="고객 정보 입력 전입니다.">
          <p>상품, 날짜, 시간을 선택하면 고객 정보를 입력할 수 있습니다.</p>
        </StateBlock>
      )}

      {createReservationMutation.isError ? (
        <ReservationCreateError
          error={createReservationMutation.error}
          onRefresh={() => {
            setSelectedTimeSlot(null);
            void datesQuery.refetch();
            void timesQuery.refetch();
          }}
        />
      ) : null}
    </section>
  );
}

function ReservationCreateError({ error, onRefresh }: { error: unknown; onRefresh: () => void }) {
  const isConflict = error instanceof PublicApiError && error.status === 409;

  if (isConflict) {
    return (
      <StateBlock
        action={{ label: "가능 시간 다시 조회", onClick: onRefresh }}
        title={toCustomerApiErrorMessage(error)}
        variant="error"
      >
        <p>방금 선택한 시간이 마감되었을 수 있습니다.</p>
      </StateBlock>
    );
  }

  return (
    <Alert title="예약을 완료하지 못했습니다." variant="error">
      {toCustomerApiErrorMessage(error)}
    </Alert>
  );
}

function AvailabilityDates({
  dates,
  loading,
  onSelect,
  selectedDate,
}: {
  dates: AvailableDate[];
  loading: boolean;
  onSelect: (date: string) => void;
  selectedDate: string | null;
}) {
  if (loading) {
    return <StateBlock title="가능 날짜를 불러오는 중입니다." variant="loading" />;
  }

  if (dates.length === 0) {
    return (
      <StateBlock title="선택 가능한 날짜가 없습니다.">
        <p>다른 인원이나 상품을 선택해 주세요.</p>
      </StateBlock>
    );
  }

  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-semibold text-slate-800">날짜</h3>
      <div className="grid grid-cols-2 gap-2">
        {dates.map((date) => (
          <Button
            disabled={!date.available}
            key={date.date}
            type="button"
            variant={date.date === selectedDate ? "primary" : "secondary"}
            onClick={() => onSelect(date.date)}
          >
            {date.date}
          </Button>
        ))}
      </div>
    </div>
  );
}

function AvailabilityTimes({
  loading,
  onSelect,
  selectedTimeSlotId,
  times,
}: {
  loading: boolean;
  onSelect: (timeSlot: AvailableTimeSlot) => void;
  selectedTimeSlotId: string | null;
  times: AvailableTimeSlot[];
}) {
  if (loading) {
    return <StateBlock title="가능 시간을 불러오는 중입니다." variant="loading" />;
  }

  if (times.length === 0) {
    return (
      <StateBlock title="시간을 선택해 주세요.">
        <p>날짜를 선택하면 가능한 시간이 표시됩니다.</p>
      </StateBlock>
    );
  }

  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-semibold text-slate-800">시간</h3>
      <div className="grid grid-cols-2 gap-2">
        {times.map((timeSlot) => (
          <Button
            disabled={!timeSlot.available}
            key={timeSlot.timeSlotId}
            type="button"
            variant={timeSlot.timeSlotId === selectedTimeSlotId ? "primary" : "secondary"}
            onClick={() => onSelect(timeSlot)}
          >
            {timeSlot.startTime}
          </Button>
        ))}
      </div>
    </div>
  );
}

function createPartySizeOptions(product: PublicReservationProduct | null) {
  if (!product) {
    return [1];
  }

  return Array.from(
    { length: product.maxPartySize - product.minPartySize + 1 },
    (_, index) => product.minPartySize + index,
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    currency: "KRW",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
