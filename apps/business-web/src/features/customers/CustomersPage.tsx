import { type ColumnDef } from "@tanstack/react-table";
import { CalendarCheck, Search, ShieldCheck, UserRound } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { useToastStore } from "@/components/feedback/toastStore";
import { DataTable } from "@/components/table/DataTable";
import { Alert, Button, Checkbox, Field, Input, Select } from "@/components/ui";
import {
  useCreateBusinessCustomerNoteMutation,
  useDeleteBusinessCustomerNoteMutation,
  useBusinessCustomerDetailQuery,
  useBusinessCustomerReservationsQuery,
  useBusinessCustomersQuery,
  useRequestBusinessCustomerAnonymizeMutation,
  useUpdateBusinessCustomerFlagsMutation,
  useUpdateBusinessCustomerNoteMutation,
} from "@/features/customers/customerQueries";
import {
  type BusinessCustomerDetailResponse,
  type BusinessCustomerListItemResponse,
  type BusinessCustomerNoteResponse,
  type BusinessCustomerReservationHistoryItemResponse,
  type BusinessCustomerSegment,
} from "@/shared/api/businessApiClient";

const segmentOptions: Array<{ label: string; value: BusinessCustomerSegment }> = [
  { label: "전체 고객", value: "ALL" },
  { label: "방문 이력 있음", value: "HAS_VISIT_HISTORY" },
  { label: "노쇼 이력 있음", value: "HAS_NO_SHOW" },
  { label: "알레르기/기념일 있음", value: "HAS_PREFERENCES" },
];

const emptyCustomers: BusinessCustomerListItemResponse[] = [];

export function CustomersPage() {
  const pushToast = useToastStore((state) => state.pushToast);
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<BusinessCustomerSegment>("ALL");
  const [userSelectedCustomerId, setUserSelectedCustomerId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [anonymizeReason, setAnonymizeReason] = useState("");
  const [anonymizeConfirmOpen, setAnonymizeConfirmOpen] = useState(false);
  const customersQuery = useBusinessCustomersQuery({
    query: query || null,
    segment,
  });
  const customers = customersQuery.data?.items ?? emptyCustomers;
  const selectedCustomerId = customers.some((customer) => customer.id === userSelectedCustomerId)
    ? userSelectedCustomerId
    : (customers[0]?.id ?? null);
  const customerDetailQuery = useBusinessCustomerDetailQuery(selectedCustomerId);
  const reservationHistoryQuery = useBusinessCustomerReservationsQuery(selectedCustomerId);
  const createNote = useCreateBusinessCustomerNoteMutation();
  const updateNote = useUpdateBusinessCustomerNoteMutation();
  const deleteNote = useDeleteBusinessCustomerNoteMutation();
  const updateFlags = useUpdateBusinessCustomerFlagsMutation();
  const requestAnonymize = useRequestBusinessCustomerAnonymizeMutation();
  const selectedCustomer = customerDetailQuery.data ?? null;
  const reservationHistory = reservationHistoryQuery.data?.items ?? [];
  const noteMutationPending = createNote.isPending || updateNote.isPending;

  const resetCustomerCrmDrafts = useCallback(() => {
    setNoteContent("");
    setEditingNoteId(null);
    setAnonymizeReason("");
    setAnonymizeConfirmOpen(false);
  }, []);

  const selectCustomer = useCallback(
    (customerId: number) => {
      if (customerId !== selectedCustomerId) {
        resetCustomerCrmDrafts();
      }
      setUserSelectedCustomerId(customerId);
    },
    [resetCustomerCrmDrafts, selectedCustomerId],
  );

  async function saveCustomerNote() {
    if (!selectedCustomerId) {
      return;
    }

    try {
      if (editingNoteId) {
        await updateNote.mutateAsync({
          noteId: editingNoteId,
          request: { content: noteContent },
        });
        pushToast({ title: "고객 메모가 수정되었습니다.", variant: "success" });
      } else {
        await createNote.mutateAsync({
          customerId: selectedCustomerId,
          request: { content: noteContent },
        });
        pushToast({ title: "고객 메모가 추가되었습니다.", variant: "success" });
      }
      setEditingNoteId(null);
      setNoteContent("");
    } catch (error) {
      pushToast({
        title: "고객 메모를 저장하지 못했습니다.",
        description: errorMessage(error),
        variant: "danger",
      });
    }
  }

  async function removeCustomerNote(noteId: number) {
    try {
      await deleteNote.mutateAsync(noteId);
      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setNoteContent("");
      }
      pushToast({ title: "고객 메모가 삭제되었습니다.", variant: "success" });
    } catch (error) {
      pushToast({
        title: "고객 메모를 삭제하지 못했습니다.",
        description: errorMessage(error),
        variant: "danger",
      });
    }
  }

  async function changeCustomerFlags(request: { vip?: boolean; caution?: boolean }) {
    if (!selectedCustomerId) {
      return;
    }

    try {
      await updateFlags.mutateAsync({ customerId: selectedCustomerId, request });
      pushToast({ title: "고객 표시가 저장되었습니다.", variant: "success" });
    } catch (error) {
      pushToast({
        title: "고객 표시를 저장하지 못했습니다.",
        description: errorMessage(error),
        variant: "danger",
      });
    }
  }

  async function submitAnonymizeRequest() {
    if (!selectedCustomerId) {
      return;
    }

    try {
      const result = await requestAnonymize.mutateAsync({
        customerId: selectedCustomerId,
        request: {
          reason: anonymizeReason,
          confirm: true,
        },
      });
      setAnonymizeConfirmOpen(false);
      setAnonymizeReason("");
      pushToast({
        title: "개인정보 처리 요청이 접수되었습니다.",
        description: result.notice,
        variant: "success",
      });
    } catch (error) {
      setAnonymizeConfirmOpen(false);
      pushToast({
        title: "개인정보 처리 요청에 실패했습니다.",
        description: errorMessage(error),
        variant: "danger",
      });
    }
  }

  const columns = useMemo<Array<ColumnDef<BusinessCustomerListItemResponse>>>(
    () => [
      {
        accessorKey: "name",
        header: "고객",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.phoneMasked}</p>
          </div>
        ),
      },
      {
        accessorKey: "totalReservations",
        header: "예약/방문",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.totalReservations}건</p>
            <p className="text-xs text-muted-foreground">
              방문 {row.original.completedCount} · 노쇼 {row.original.noShowCount}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "lastVisitedAt",
        header: "최근 방문",
        cell: ({ row }) => formatDateTime(row.original.lastVisitedAt),
      },
      {
        accessorKey: "nextReservationAt",
        header: "다음 예약",
        cell: ({ row }) => formatDateTime(row.original.nextReservationAt),
      },
      {
        id: "preferences",
        header: "고객 정보",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            {row.original.allergySummary ? (
              <Flag label={`알레르기 ${row.original.allergySummary}`} />
            ) : null}
            {row.original.anniversarySummary ? (
              <Flag label={`기념일 ${row.original.anniversarySummary}`} />
            ) : null}
            {row.original.noShowCount > 0 ? <Flag label="노쇼 이력" tone="danger" /> : null}
          </div>
        ),
      },
      {
        id: "detail",
        header: "상세",
        cell: ({ row }) => (
          <Button
            type="button"
            variant={row.original.id === selectedCustomerId ? "secondary" : "ghost"}
            size="sm"
            aria-label={`${row.original.name} 고객 상세 보기`}
            onClick={() => selectCustomer(row.original.id)}
          >
            상세
          </Button>
        ),
      },
    ],
    [selectedCustomerId, selectCustomer],
  );

  return (
    <>
      <header className="border-b border-border pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">고객 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              매장 단위 고객 이력과 예약 운영에 필요한 요청사항을 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden className="size-4 text-primary" />
            목록 연락처 마스킹
          </div>
        </div>
      </header>

      <section className="grid gap-3 py-5 md:grid-cols-4" aria-label="고객 요약">
        <Metric
          label="전체 고객"
          value={`${customersQuery.data?.summary.totalCount ?? 0}명`}
          icon={UserRound}
        />
        <Metric
          label="방문 이력"
          value={`${customersQuery.data?.summary.visitedCount ?? 0}명`}
          icon={CalendarCheck}
        />
        <Metric label="노쇼 이력" value={`${customersQuery.data?.summary.noShowCount ?? 0}명`} />
        <Metric
          label="알레르기/기념일"
          value={`${customersQuery.data?.summary.preferenceCount ?? 0}명`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]" aria-label="고객 목록">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <Field id="customer-search" label="고객 검색">
              <div className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="customer-search"
                  className="pl-9"
                  placeholder="고객명, 연락처, 요청사항"
                  value={query}
                  onChange={(event) => {
                    resetCustomerCrmDrafts();
                    setQuery(event.target.value);
                  }}
                />
              </div>
            </Field>
            <Field id="customer-segment" label="필터">
              <Select
                id="customer-segment"
                value={segment}
                options={segmentOptions}
                onChange={(event) => {
                  resetCustomerCrmDrafts();
                  setSegment(event.target.value as BusinessCustomerSegment);
                }}
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetCustomerCrmDrafts();
                  setQuery("");
                  setSegment("ALL");
                }}
              >
                초기화
              </Button>
            </div>
          </div>

          {customersQuery.isError ? (
            <Alert variant="danger">고객 목록을 불러오지 못했습니다.</Alert>
          ) : (
            <DataTable
              columns={columns}
              data={customers}
              emptyMessage={
                customersQuery.isLoading
                  ? "고객 목록을 불러오는 중입니다."
                  : "조건에 맞는 고객이 없습니다."
              }
              getRowId={(row) => String(row.id)}
            />
          )}
        </div>

        <CustomerDetailPanel
          customer={selectedCustomer}
          reservations={reservationHistory}
          isLoading={customerDetailQuery.isLoading || reservationHistoryQuery.isLoading}
          isError={customerDetailQuery.isError || reservationHistoryQuery.isError}
          noteContent={noteContent}
          editingNoteId={editingNoteId}
          isNotePending={noteMutationPending}
          isFlagPending={updateFlags.isPending}
          anonymizeReason={anonymizeReason}
          isAnonymizePending={requestAnonymize.isPending}
          onNoteContentChange={setNoteContent}
          onSaveNote={saveCustomerNote}
          onCancelNoteEdit={() => {
            setEditingNoteId(null);
            setNoteContent("");
          }}
          onEditNote={(note) => {
            setEditingNoteId(note.id);
            setNoteContent(note.content);
          }}
          onDeleteNote={removeCustomerNote}
          onChangeFlags={changeCustomerFlags}
          onAnonymizeReasonChange={setAnonymizeReason}
          onRequestAnonymize={() => setAnonymizeConfirmOpen(true)}
        />
      </section>

      <ConfirmDialog
        open={anonymizeConfirmOpen}
        title="개인정보 삭제/익명화 요청"
        description={
          selectedCustomer
            ? `${selectedCustomer.name} 고객의 개인정보 처리 요청을 접수합니다. 이 작업은 감사 로그에 남고 운영 검토 후 처리됩니다.`
            : "고객 개인정보 처리 요청을 접수합니다."
        }
        confirmLabel="요청 접수"
        intent="danger"
        isPending={requestAnonymize.isPending}
        onCancel={() => setAnonymizeConfirmOpen(false)}
        onConfirm={submitAnonymizeRequest}
      />
    </>
  );
}

function CustomerDetailPanel({
  customer,
  reservations,
  isLoading,
  isError,
  noteContent,
  editingNoteId,
  isNotePending,
  isFlagPending,
  anonymizeReason,
  isAnonymizePending,
  onNoteContentChange,
  onSaveNote,
  onCancelNoteEdit,
  onEditNote,
  onDeleteNote,
  onChangeFlags,
  onAnonymizeReasonChange,
  onRequestAnonymize,
}: {
  customer: BusinessCustomerDetailResponse | null;
  reservations: BusinessCustomerReservationHistoryItemResponse[];
  isLoading: boolean;
  isError: boolean;
  noteContent: string;
  editingNoteId: number | null;
  isNotePending: boolean;
  isFlagPending: boolean;
  anonymizeReason: string;
  isAnonymizePending: boolean;
  onNoteContentChange: (value: string) => void;
  onSaveNote: () => void;
  onCancelNoteEdit: () => void;
  onEditNote: (note: BusinessCustomerNoteResponse) => void;
  onDeleteNote: (noteId: number) => void;
  onChangeFlags: (request: { vip?: boolean; caution?: boolean }) => void;
  onAnonymizeReasonChange: (value: string) => void;
  onRequestAnonymize: () => void;
}) {
  if (isError) {
    return <Alert variant="danger">고객 상세 정보를 불러오지 못했습니다.</Alert>;
  }

  if (isLoading) {
    return (
      <aside className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">고객 상세를 불러오는 중입니다.</p>
      </aside>
    );
  }

  if (!customer) {
    return (
      <aside className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <Alert>고객을 선택하면 상세 이력과 요청사항이 표시됩니다.</Alert>
      </aside>
    );
  }

  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{customer.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{customer.phoneNumber}</p>
          </div>
          <Flag label="상세 개인정보" tone="warning" />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <DetailItem label="예약" value={`${customer.totalReservations}건`} />
          <DetailItem label="방문" value={`${customer.visitCount}회`} />
          <DetailItem label="노쇼" value={`${customer.noShowCount}회`} />
          <DetailItem label="취소" value={`${customer.cancelledCount}회`} />
          <DetailItem label="최근 방문" value={formatDateTime(customer.lastVisitedAt)} />
          <DetailItem label="다음 예약" value={formatDateTime(customer.nextReservationAt)} />
        </dl>

        <div className="mt-4 rounded-md border border-border bg-muted/40 p-3">
          <div className="flex flex-wrap gap-1.5">
            {customer.flagStatus.vip ? <Flag label="VIP" tone="success" /> : null}
            {customer.flagStatus.caution ? <Flag label="주의 고객" tone="danger" /> : null}
            <Flag
              label={customer.flagStatus.blockedScopeLabel ?? "차단 없음"}
              tone={customer.flagStatus.blockedScope === "NONE" ? "info" : "warning"}
            />
          </div>
          <div className="mt-3 grid gap-2">
            <Checkbox
              id={`customer-${customer.id}-vip`}
              label="VIP 표시"
              checked={customer.flagStatus.vip}
              disabled={isFlagPending}
              onChange={(event) => onChangeFlags({ vip: event.target.checked })}
            />
            <Checkbox
              id={`customer-${customer.id}-caution`}
              label="주의 고객 표시"
              checked={customer.flagStatus.caution}
              disabled={isFlagPending}
              onChange={(event) => onChangeFlags({ caution: event.target.checked })}
            />
          </div>
        </div>

        <Alert title="개인정보 표시 기준">{customer.privacyNotice}</Alert>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">요청사항/알레르기/기념일</h3>
        <div className="mt-3 grid gap-3">
          <InfoBlock
            label="최근 요청사항"
            values={customer.recentRequests}
            emptyMessage="등록된 요청사항이 없습니다."
          />
          <InfoBlock
            label="알레르기"
            values={customer.allergies}
            emptyMessage="등록된 알레르기 정보가 없습니다."
          />
          <InfoBlock
            label="기념일"
            values={customer.anniversaries.map(
              (anniversary) => `${anniversary.label} ${anniversary.date}`,
            )}
            emptyMessage="등록된 기념일 정보가 없습니다."
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">고객 메모</h3>
        <div className="mt-3 space-y-3">
          <Alert title="민감정보 입력 주의">
            건강정보, 결제정보, 주민등록번호 등 운영에 불필요한 개인정보는 고객 메모에 입력하지
            마세요.
          </Alert>
          <Alert title="감사 로그 대상">
            고객 메모 변경, VIP/주의 표시 변경, 개인정보 처리 요청은 감사 로그 대상입니다.
          </Alert>

          <Field
            id={`customer-${customer.id}-note`}
            label={editingNoteId ? "메모 수정" : "메모 추가"}
          >
            <textarea
              id={`customer-${customer.id}-note`}
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="방문 선호, 응대 참고사항 등 운영에 필요한 정보만 입력"
              value={noteContent}
              onChange={(event) => onNoteContentChange(event.target.value)}
            />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            {editingNoteId ? (
              <Button type="button" variant="outline" onClick={onCancelNoteEdit}>
                수정 취소
              </Button>
            ) : null}
            <Button type="button" isLoading={isNotePending} onClick={onSaveNote}>
              {editingNoteId ? "메모 수정" : "메모 추가"}
            </Button>
          </div>

          <div className="divide-y divide-border">
            {customer.notes.length > 0 ? (
              customer.notes.map((note) => (
                <CustomerNoteItem
                  key={note.id}
                  note={note}
                  isEditing={editingNoteId === note.id}
                  onEdit={() => onEditNote(note)}
                  onDelete={() => onDeleteNote(note.id)}
                />
              ))
            ) : (
              <p className="py-3 text-sm text-muted-foreground">등록된 고객 메모가 없습니다.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">개인정보 처리 요청</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          삭제/익명화 요청은 즉시 반영하지 않고, 운영 검토와 감사 로그 기록 후 처리합니다.
        </p>
        <Field id={`customer-${customer.id}-anonymize-reason`} label="요청 사유" className="mt-3">
          <textarea
            id={`customer-${customer.id}-anonymize-reason`}
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="고객 요청, 보존 기간 경과 등"
            value={anonymizeReason}
            onChange={(event) => onAnonymizeReasonChange(event.target.value)}
          />
        </Field>
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="danger"
            isLoading={isAnonymizePending}
            onClick={onRequestAnonymize}
          >
            삭제/익명화 요청
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">예약 이력</h3>
        <div className="mt-3 divide-y divide-border">
          {reservations.length > 0 ? (
            reservations.map((reservation) => (
              <ReservationHistoryItem key={reservation.id} reservation={reservation} />
            ))
          ) : (
            <p className="py-3 text-sm text-muted-foreground">예약 이력이 없습니다.</p>
          )}
        </div>
      </section>
    </aside>
  );
}

function ReservationHistoryItem({
  reservation,
}: {
  reservation: BusinessCustomerReservationHistoryItemResponse;
}) {
  return (
    <article className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{reservation.productName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateLabel(reservation.visitDate)} {formatTime(reservation.startTime)} ·{" "}
            {reservation.partySize}명 · {sourceLabel(reservation.source)}
          </p>
        </div>
        <StatusBadge label={reservation.statusLabel} tone={reservation.statusTone} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {reservation.customerRequest ? <Flag label={reservation.customerRequest} /> : null}
        {reservation.allergyNote ? <Flag label={`알레르기 ${reservation.allergyNote}`} /> : null}
        {reservation.anniversaryNote ? (
          <Flag label={`기념일 ${reservation.anniversaryNote}`} />
        ) : null}
      </div>
    </article>
  );
}

function InfoBlock({
  label,
  values,
  emptyMessage,
}: {
  label: string;
  values: string[];
  emptyMessage: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {values.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <Flag key={value} label={value} />
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

function CustomerNoteItem({
  note,
  isEditing,
  onEdit,
  onDelete,
}: {
  note: BusinessCustomerNoteResponse;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="whitespace-pre-wrap text-sm">{note.content}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {note.authorName} · {formatDateTime(note.updatedAt ?? note.createdAt)} ·{" "}
            {note.auditActionLabel}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant={isEditing ? "secondary" : "ghost"}
            size="sm"
            onClick={onEdit}
          >
            수정
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
            삭제
          </Button>
        </div>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof UserRound;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon ? <Icon aria-hidden className="size-4 text-muted-foreground" /> : null}
      </div>
      <strong className="mt-3 block text-2xl font-semibold">{value}</strong>
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function Flag({
  label,
  tone = "info",
}: {
  label: string;
  tone?: "info" | "danger" | "warning" | "success";
}) {
  const toneClassName = {
    info: "bg-muted text-muted-foreground",
    danger: "bg-destructive/10 text-destructive",
    warning: "bg-accent text-accent-foreground",
    success: "bg-primary/10 text-primary",
  }[tone];

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-medium ${toneClassName}`}>{label}</span>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  const toneClassName: Record<string, string> = {
    success: "bg-primary/10 text-primary",
    warning: "bg-accent text-accent-foreground",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`rounded-md px-2 py-1 text-xs font-medium ${toneClassName[tone] ?? toneClassName.info}`}
    >
      {label}
    </span>
  );
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

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function sourceLabel(value: string) {
  const labels: Record<string, string> = {
    ONLINE: "온라인",
    MANUAL_PHONE: "전화",
    MANUAL_WALK_IN: "현장",
  };

  return labels[value] ?? value;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
