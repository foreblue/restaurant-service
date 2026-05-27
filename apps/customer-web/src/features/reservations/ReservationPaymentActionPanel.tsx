"use client";

import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Alert, Button } from "@/components/ui";
import { toCustomerApiErrorMessage } from "@/shared/api/apiError";
import { usePublicApiClient } from "@/shared/api/usePublicApiClient";

import { cancelPublicReservation } from "./reservationDetailApi";
import { type PublicReservationResponse } from "./reservationCreateTypes";
import {
  createReservationPaymentReturnUrl,
  startReservationGuarantee,
  startReservationPayment,
} from "./reservationPaymentApi";
import { type ReservationPaymentPolicyView } from "./reservationPaymentPolicy";
import { runReservationPaymentAction } from "./reservationPaymentSdk";
import {
  type PublicGuaranteeStartResponse,
  type PublicPaymentAction,
  type PublicPaymentStartResponse,
  type PublicPaymentStatus,
} from "./reservationPaymentTypes";

interface ReservationPaymentActionPanelProps {
  paymentPolicy: ReservationPaymentPolicyView;
  reservation: PublicReservationResponse;
}

type PaymentActionResult =
  | {
      action: PublicPaymentAction | null;
      expiresAt: string | null;
      paymentId: number;
      status: PublicPaymentStatus;
      state: "failed" | "redirecting" | "succeeded";
    }
  | {
      state: "abandoned";
    };

export function ReservationPaymentActionPanel({
  paymentPolicy,
  reservation,
}: ReservationPaymentActionPanelProps) {
  const apiClient = usePublicApiClient();
  const [attemptKey, setAttemptKey] = useState(() => createIdempotencyKey("payment"));
  const returnUrl = useMemo(
    () =>
      createReservationPaymentReturnUrl({
        lookupToken: reservation.lookupToken,
        origin: browserOrigin(),
        reservationId: reservation.id,
      }),
    [reservation.id, reservation.lookupToken],
  );

  const paymentMutation = useMutation({
    mutationFn: async (): Promise<PaymentActionResult> => {
      const response =
        paymentPolicy.nextStep === "cardGuarantee"
          ? await startReservationGuarantee(
              reservation.id,
              reservation.lookupToken,
              {
                idempotencyKey: attemptKey,
                returnUrl,
              },
              apiClient,
            )
          : await startReservationPayment(
              reservation.id,
              reservation.lookupToken,
              {
                idempotencyKey: attemptKey,
                paymentMode: paymentPolicy.paymentMode,
                returnUrl,
              },
              apiClient,
            );

      return handlePaymentStartResponse(response);
    },
  });

  const abandonMutation = useMutation({
    mutationFn: () =>
      cancelPublicReservation(
        reservation.id,
        { lookupToken: reservation.lookupToken },
        { reason: "결제 단계에서 예약 포기" },
        apiClient,
      ),
    onSuccess: () => {
      paymentMutation.reset();
    },
  });

  if (paymentPolicy.nextStep === "reserveOnly") {
    return null;
  }

  const actionLabel = paymentPolicy.nextStep === "cardGuarantee" ? "카드 보증 등록" : "결제 진행";
  const busy = paymentMutation.isPending || abandonMutation.isPending;
  const result = abandonMutation.isSuccess
    ? ({ state: "abandoned" } satisfies PaymentActionResult)
    : paymentMutation.data;
  const actionCompleted =
    result?.state === "abandoned" ||
    result?.state === "redirecting" ||
    result?.state === "succeeded";

  return (
    <section className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-950">{paymentPolicy.nextStepLabel}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{paymentPolicy.description}</p>
      </div>

      <Button
        disabled={busy || actionCompleted}
        type="button"
        onClick={() => paymentMutation.mutate()}
      >
        {paymentMutation.isPending ? "처리 중" : actionLabel}
      </Button>

      <PaymentActionState result={result} />

      {paymentMutation.isError ? (
        <RetryablePaymentError
          busy={busy}
          message={toCustomerApiErrorMessage(paymentMutation.error)}
          onAbandon={() => abandonMutation.mutate()}
          onRetry={() => {
            setAttemptKey(createIdempotencyKey("payment"));
            paymentMutation.reset();
          }}
        />
      ) : null}

      {result?.state === "failed" ? (
        <RetryablePaymentError
          busy={busy}
          message={paymentFailureMessage(result.status)}
          onAbandon={() => abandonMutation.mutate()}
          onRetry={() => {
            setAttemptKey(createIdempotencyKey("payment"));
            paymentMutation.reset();
          }}
        />
      ) : null}

      {abandonMutation.isError ? (
        <Alert title="예약을 포기하지 못했습니다." variant="error">
          {toCustomerApiErrorMessage(abandonMutation.error)}
        </Alert>
      ) : null}
    </section>
  );
}

function PaymentActionState({ result }: { result: PaymentActionResult | undefined }) {
  if (!result) {
    return null;
  }

  if (result.state === "abandoned") {
    return (
      <Alert title="예약을 포기했습니다." variant="warning">
        다시 예약이 필요하면 매장 예약 링크에서 새 예약을 진행해 주세요.
      </Alert>
    );
  }

  if (result.state === "succeeded") {
    return (
      <Alert title="처리가 완료되었습니다." variant="success">
        예약 상세에서 결제 또는 보증 상태를 확인해 주세요.
      </Alert>
    );
  }

  if (result.state === "redirecting") {
    return (
      <Alert title="결제 창으로 이동 중입니다." variant="info">
        새 창이나 결제 화면이 열리지 않으면 다시 시도해 주세요.
      </Alert>
    );
  }

  return null;
}

function RetryablePaymentError({
  busy,
  message,
  onAbandon,
  onRetry,
}: {
  busy: boolean;
  message: string;
  onAbandon: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="grid gap-2">
      <Alert title="결제 처리를 완료하지 못했습니다." variant="error">
        {message}
      </Alert>
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={busy} type="button" variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
        <Button disabled={busy} type="button" variant="danger" onClick={onAbandon}>
          예약 포기
        </Button>
      </div>
    </div>
  );
}

async function handlePaymentStartResponse(
  response: PublicGuaranteeStartResponse | PublicPaymentStartResponse,
): Promise<PaymentActionResult> {
  const action = "paymentAction" in response ? response.paymentAction : response.guaranteeAction;

  if (isFailureStatus(response.status)) {
    return {
      action,
      expiresAt: response.expiresAt,
      paymentId: response.paymentId,
      state: "failed",
      status: response.status,
    };
  }

  if (isSuccessStatus(response.status)) {
    return {
      action,
      expiresAt: response.expiresAt,
      paymentId: response.paymentId,
      state: "succeeded",
      status: response.status,
    };
  }

  if (action) {
    await runReservationPaymentAction(action);

    return {
      action,
      expiresAt: response.expiresAt,
      paymentId: response.paymentId,
      state: "redirecting",
      status: response.status,
    };
  }

  return {
    action,
    expiresAt: response.expiresAt,
    paymentId: response.paymentId,
    state: "failed",
    status: response.status,
  };
}

function isSuccessStatus(status: PublicPaymentStatus) {
  return status === "PAID" || status === "GUARANTEE_REGISTERED" || status === "PAY_ON_SITE";
}

function isFailureStatus(status: PublicPaymentStatus) {
  return status === "FAILED" || status === "CANCELLED" || status === "EXPIRED";
}

function paymentFailureMessage(status: PublicPaymentStatus) {
  if (status === "EXPIRED") {
    return "결제 가능 시간이 만료되었습니다. 다시 시도해 주세요.";
  }

  if (status === "CANCELLED") {
    return "결제가 취소되었습니다. 다시 시도하거나 예약을 포기할 수 있습니다.";
  }

  return "결제 시작 중 문제가 발생했습니다. 다시 시도해 주세요.";
}

function createIdempotencyKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function browserOrigin() {
  if (typeof window === "undefined") {
    return "http://localhost";
  }

  return window.location.origin;
}
