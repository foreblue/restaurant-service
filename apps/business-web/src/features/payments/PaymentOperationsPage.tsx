import { type ColumnDef } from "@tanstack/react-table";
import { CreditCard, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";
import { Alert, Button, DateInput, Field, Select } from "@/components/ui";
import {
  useBusinessPaymentsQuery,
  useBusinessRefundsQuery,
} from "@/features/payments/paymentOperationsQueries";
import {
  type BusinessPaymentListItemResponse,
  type BusinessRefundListItemResponse,
} from "@/shared/api/businessApiClient";

type PaymentTab = "payments" | "refunds";

const paymentStatusOptions = [
  { label: "전체 결제 상태", value: "" },
  { label: "결제 완료", value: "PAID" },
  { label: "현장 결제", value: "OFFLINE" },
  { label: "카드 보증", value: "CARD_GUARANTEE" },
  { label: "환불 대기", value: "REFUND_PENDING" },
];

const refundStatusOptions = [
  { label: "전체 환불 상태", value: "" },
  { label: "환불 처리중", value: "PENDING" },
  { label: "환불 완료", value: "SUCCEEDED" },
  { label: "환불 실패", value: "FAILED" },
];

export function PaymentOperationsPage() {
  const [tab, setTab] = useState<PaymentTab>("payments");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [refundStatus, setRefundStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<BusinessPaymentListItemResponse | null>(
    null,
  );
  const [selectedRefund, setSelectedRefund] = useState<BusinessRefundListItemResponse | null>(null);
  const paymentsQuery = useBusinessPaymentsQuery(
    {
      status: paymentStatus || null,
      from: from || null,
      to: to || null,
    },
    tab === "payments",
  );
  const refundsQuery = useBusinessRefundsQuery(
    {
      status: refundStatus || null,
      from: from || null,
      to: to || null,
    },
    tab === "refunds",
  );
  const paymentColumns = useMemo<Array<ColumnDef<BusinessPaymentListItemResponse>>>(
    () => [
      {
        accessorKey: "paymentNumber",
        header: "결제",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.paymentNumber}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.reservationNumber}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "customerName",
        header: "예약",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.customerName}</p>
            <p className="text-xs text-muted-foreground">{row.original.productName}</p>
          </div>
        ),
      },
      {
        accessorKey: "paymentType",
        header: "유형",
        cell: ({ row }) => paymentTypeLabel(row.original.paymentType),
      },
      {
        accessorKey: "amount",
        header: "금액",
        cell: ({ row }) => formatPrice(row.original.amount),
      },
      {
        accessorKey: "status",
        header: "상태",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge label={row.original.statusLabel} tone={row.original.statusTone} />
            {row.original.cardGuaranteeHeld ? <Flag label="카드 보증" /> : null}
            {row.original.actionRequired ? <Flag label="확인 필요" tone="danger" /> : null}
          </div>
        ),
      },
      {
        accessorKey: "paidAt",
        header: "일시",
        cell: ({ row }) => formatDateTime(row.original.paidAt ?? row.original.dueAt),
      },
      {
        id: "detail",
        header: "상세",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`${row.original.paymentNumber} 상세 보기`}
            onClick={() => setSelectedPayment(row.original)}
          >
            상세
          </Button>
        ),
      },
    ],
    [],
  );
  const refundColumns = useMemo<Array<ColumnDef<BusinessRefundListItemResponse>>>(
    () => [
      {
        accessorKey: "refundNumber",
        header: "환불",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.refundNumber}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.reservationNumber}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "customerName",
        header: "예약",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.customerName}</p>
            <p className="text-xs text-muted-foreground">{row.original.productName}</p>
          </div>
        ),
      },
      {
        accessorKey: "refundAmount",
        header: "환불액",
        cell: ({ row }) => formatPrice(row.original.refundAmount),
      },
      {
        accessorKey: "status",
        header: "상태",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge label={row.original.statusLabel} tone={row.original.statusTone} />
            {row.original.actionRequired ? <Flag label="확인 필요" tone="danger" /> : null}
          </div>
        ),
      },
      {
        accessorKey: "failureMessage",
        header: "실패 사유",
        cell: ({ row }) => row.original.failureMessage ?? "-",
      },
      {
        accessorKey: "requestedAt",
        header: "요청일",
        cell: ({ row }) => formatDateTime(row.original.requestedAt),
      },
      {
        id: "detail",
        header: "상세",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`${row.original.refundNumber} 상세 보기`}
            onClick={() => setSelectedRefund(row.original)}
          >
            상세
          </Button>
        ),
      },
    ],
    [],
  );

  function resetFilters() {
    setPaymentStatus("");
    setRefundStatus("");
    setFrom("");
    setTo("");
    setSelectedPayment(null);
    setSelectedRefund(null);
  }

  function switchTab(nextTab: PaymentTab) {
    setTab(nextTab);
    setSelectedPayment(null);
    setSelectedRefund(null);
  }

  function updatePaymentStatus(value: string) {
    setPaymentStatus(value);
    setSelectedPayment(null);
  }

  function updateRefundStatus(value: string) {
    setRefundStatus(value);
    setSelectedRefund(null);
  }

  function updateDateRange(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    setSelectedPayment(null);
    setSelectedRefund(null);
  }

  return (
    <section className="grid gap-5">
      <header className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard aria-hidden className="size-4" />
            결제 확인
          </p>
          <h1 className="mt-1 text-2xl font-semibold">결제/환불 내역</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            예약 운영에 필요한 결제, 카드 보증, 환불 상태를 확인합니다. 정산 자동화 화면은 아닙니다.
          </p>
        </div>
        <div className="inline-flex w-fit rounded-md border border-input bg-background p-1">
          <TabButton
            active={tab === "payments"}
            label="결제"
            onClick={() => switchTab("payments")}
          />
          <TabButton active={tab === "refunds"} label="환불" onClick={() => switchTab("refunds")} />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tab === "payments" ? (
          <>
            <Metric label="결제 건수" value={`${paymentsQuery.data?.summary.totalCount ?? 0}건`} />
            <Metric
              label="결제 완료 금액"
              value={formatPrice(paymentsQuery.data?.summary.paidAmount ?? 0)}
            />
            <Metric
              label="카드 보증"
              value={`${paymentsQuery.data?.summary.cardGuaranteeCount ?? 0}건`}
            />
            <Metric
              label="확인 필요"
              value={`${paymentsQuery.data?.summary.actionRequiredCount ?? 0}건`}
            />
          </>
        ) : (
          <>
            <Metric label="환불 건수" value={`${refundsQuery.data?.summary.totalCount ?? 0}건`} />
            <Metric
              label="환불 완료 금액"
              value={formatPrice(refundsQuery.data?.summary.refundAmount ?? 0)}
            />
            <Metric label="환불 실패" value={`${refundsQuery.data?.summary.failedCount ?? 0}건`} />
            <Metric
              label="확인 필요"
              value={`${refundsQuery.data?.summary.actionRequiredCount ?? 0}건`}
            />
          </>
        )}
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <Field id="payment-status-filter" label={tab === "payments" ? "결제 상태" : "환불 상태"}>
            <Select
              id="payment-status-filter"
              options={tab === "payments" ? paymentStatusOptions : refundStatusOptions}
              value={tab === "payments" ? paymentStatus : refundStatus}
              onChange={(event) =>
                tab === "payments"
                  ? updatePaymentStatus(event.target.value)
                  : updateRefundStatus(event.target.value)
              }
            />
          </Field>
          <Field id="payment-from" label="시작일">
            <DateInput
              id="payment-from"
              value={from}
              onChange={(event) => updateDateRange(event.target.value, to)}
            />
          </Field>
          <Field id="payment-to" label="종료일">
            <DateInput
              id="payment-to"
              value={to}
              onChange={(event) => updateDateRange(from, event.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw aria-hidden className="size-4" />
              필터 초기화
            </Button>
          </div>
        </div>
      </section>

      {tab === "payments" ? (
        paymentsQuery.isPending ? (
          <Panel title="결제 내역을 불러오는 중입니다." />
        ) : paymentsQuery.isError ? (
          <Alert variant="danger">{errorMessage(paymentsQuery.error)}</Alert>
        ) : (
          <>
            <DataTable
              columns={paymentColumns}
              data={paymentsQuery.data.items}
              emptyMessage="조건에 맞는 결제 내역이 없습니다."
              getRowId={(row) => String(row.id)}
            />
            {selectedPayment ? (
              <PaymentDetailPanel
                payment={selectedPayment}
                onClose={() => setSelectedPayment(null)}
              />
            ) : null}
          </>
        )
      ) : refundsQuery.isPending ? (
        <Panel title="환불 내역을 불러오는 중입니다." />
      ) : refundsQuery.isError ? (
        <Alert variant="danger">{errorMessage(refundsQuery.error)}</Alert>
      ) : (
        <>
          <DataTable
            columns={refundColumns}
            data={refundsQuery.data.items}
            emptyMessage="조건에 맞는 환불 내역이 없습니다."
            getRowId={(row) => String(row.id)}
          />
          {selectedRefund ? (
            <RefundDetailPanel refund={selectedRefund} onClose={() => setSelectedRefund(null)} />
          ) : null}
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
      {title}
    </div>
  );
}

function PaymentDetailPanel({
  payment,
  onClose,
}: {
  payment: BusinessPaymentListItemResponse;
  onClose: () => void;
}) {
  return (
    <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <DetailHeader title="결제 상세" onClose={onClose} />
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem label="결제번호" value={payment.paymentNumber} />
        <DetailItem label="예약번호" value={payment.reservationNumber} />
        <DetailItem label="예약자" value={payment.customerName} />
        <DetailItem label="상품" value={payment.productName} />
        <DetailItem label="결제 유형" value={paymentTypeLabel(payment.paymentType)} />
        <DetailItem label="금액" value={formatPrice(payment.amount)} />
        <DetailItem label="상태" value={payment.statusLabel} />
        <DetailItem label="일시" value={formatDateTime(payment.paidAt ?? payment.dueAt)} />
      </dl>
      <div className="flex flex-wrap gap-1.5">
        {payment.cardGuaranteeHeld ? <Flag label="카드 보증" /> : null}
        {payment.actionRequired ? <Flag label="확인 필요" tone="danger" /> : null}
      </div>
    </section>
  );
}

function RefundDetailPanel({
  refund,
  onClose,
}: {
  refund: BusinessRefundListItemResponse;
  onClose: () => void;
}) {
  return (
    <section className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <DetailHeader title="환불 상세" onClose={onClose} />
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem label="환불번호" value={refund.refundNumber} />
        <DetailItem label="예약번호" value={refund.reservationNumber} />
        <DetailItem label="예약자" value={refund.customerName} />
        <DetailItem label="상품" value={refund.productName} />
        <DetailItem label="환불액" value={formatPrice(refund.refundAmount)} />
        <DetailItem label="상태" value={refund.statusLabel} />
        <DetailItem label="요청일" value={formatDateTime(refund.requestedAt)} />
        <DetailItem label="완료일" value={formatDateTime(refund.completedAt)} />
      </dl>
      <div className="grid gap-2">
        <p className="text-sm font-medium">실패 사유</p>
        <p className="rounded-md bg-muted px-3 py-2 text-sm">
          {refund.failureMessage ?? "등록된 실패 사유가 없습니다."}
        </p>
      </div>
      {refund.status === "PENDING" ? (
        <Alert>환불 처리중입니다. PG 처리 결과가 확정될 때까지 상태를 재확인하세요.</Alert>
      ) : null}
      {refund.status === "FAILED" ? (
        <Alert variant="danger">플랫폼 관리자 문의 필요: 환불 실패 또는 보정 대상입니다.</Alert>
      ) : null}
      {refund.actionRequired ? (
        <div className="flex flex-wrap gap-1.5">
          <Flag label="확인 필요" tone="danger" />
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        정산금 계산이나 지급 스케줄은 이 화면에서 제공하지 않습니다.
      </p>
    </section>
  );
}

function DetailHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <button
        className="flex size-8 items-center justify-center rounded-md border border-input text-muted-foreground transition hover:bg-muted hover:text-foreground"
        type="button"
        aria-label={`${title} 닫기`}
        onClick={onClose}
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={
        active
          ? "h-8 rounded px-3 text-sm font-medium text-primary"
          : "h-8 rounded px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      }
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  const className =
    tone === "success"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function Flag({ label, tone = "default" }: { label: string; tone?: "default" | "danger" }) {
  return (
    <span
      className={
        tone === "danger"
          ? "inline-flex rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"
          : "inline-flex rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      {label}
    </span>
  );
}

function paymentTypeLabel(value: string) {
  const labels: Record<string, string> = {
    DEPOSIT: "예약금",
    PREPAID: "선결제",
    CARD_GUARANTEE: "카드 보증",
    ONSITE: "현장 결제",
    FREE: "무료",
  };

  return labels[value] ?? value;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
