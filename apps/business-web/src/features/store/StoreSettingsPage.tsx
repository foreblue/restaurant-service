import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, ExternalLink, ImageUp, QrCode, Save } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import {
  type FieldErrors,
  type FieldPath,
  type UseFormRegister,
  useForm,
  useWatch,
} from "react-hook-form";

import { Alert, Button, Checkbox, DateInput, Field, fieldA11y, Input } from "@/components/ui";
import {
  emptyStoreSettingsValues,
  toStoreSettingsFormValues,
  toStoreSettingsUpdateRequest,
} from "@/features/store/storeSettingsMapper";
import {
  useSaveBusinessHoursMutation,
  useSaveHolidayRulesMutation,
  useStoreSettingsQuery,
  useUpdateStoreSettingsMutation,
  useUpdateReservationPageMutation,
  useUploadStoreFileMutation,
} from "@/features/store/storeSettingsQueries";
import {
  type StoreSettingsFormValues,
  storeSettingsSchema,
} from "@/features/store/storeSettingsSchema";
import {
  type BusinessDayOfWeek,
  type BusinessHourSaveItem,
  type HolidayRuleSaveItem,
  type BusinessHourResponse,
  type HolidayRuleResponse,
  type RestaurantSettingsResponse,
} from "@/shared/api/businessApiClient";

export function StoreSettingsPage() {
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const storeSettings = useStoreSettingsQuery();
  const updateStoreSettings = useUpdateStoreSettingsMutation();
  const uploadFile = useUploadStoreFileMutation();
  const form = useForm<StoreSettingsFormValues>({
    defaultValues: emptyStoreSettingsValues,
    resolver: zodResolver(storeSettingsSchema),
  });
  const watchedValues = useWatch({ control: form.control });
  const formValues: StoreSettingsFormValues = {
    ...emptyStoreSettingsValues,
    ...watchedValues,
  };
  const missingRequirements = storeRequirements(formValues).filter(
    (requirement) => !requirement.complete,
  );

  useEffect(() => {
    if (storeSettings.data) {
      form.reset(toStoreSettingsFormValues(storeSettings.data));
    }
  }, [form, storeSettings.data]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  async function handleCoverImageChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setSaved(false);
    setCoverUploadError(null);

    try {
      const uploaded = await uploadFile.mutateAsync({ purpose: "restaurant_image", file });
      form.setValue("coverImageFileId", uploaded.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("coverImageFilename", uploaded.originalFilename, {
        shouldDirty: true,
      });

      if (typeof URL.createObjectURL === "function") {
        setCoverPreviewUrl(URL.createObjectURL(file));
      } else {
        setCoverPreviewUrl(uploaded.publicUrl);
      }
    } catch (error) {
      setCoverUploadError(errorMessage(error));
    } finally {
      input.value = "";
    }
  }

  async function handleSave(values: StoreSettingsFormValues) {
    if (!storeSettings.data) {
      return;
    }

    setSaved(false);

    try {
      await updateStoreSettings.mutateAsync({
        restaurantId: storeSettings.data.id,
        request: toStoreSettingsUpdateRequest(values),
      });
      setSaved(true);
    } catch {
      // Mutation state renders the save error.
    }
  }

  if (storeSettings.isPending) {
    return <Panel title="매장 설정" description="매장 정보를 불러오는 중입니다." />;
  }

  if (storeSettings.isError) {
    return <Panel title="매장 설정" description={storeSettings.error.message} variant="danger" />;
  }

  return (
    <section className="grid gap-5">
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-normal">매장 설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          예약 페이지에 노출될 기본 정보와 대표 이미지를 관리합니다.
        </p>
      </header>

      <PublicPageNotice restaurant={storeSettings.data} missingRequirements={missingRequirements} />

      <form
        className="rounded-lg border border-border bg-card p-5 shadow-sm"
        onChange={() => setSaved(false)}
        onSubmit={form.handleSubmit(handleSave)}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-4">
            <TextField
              name="name"
              label="매장명"
              register={form.register}
              errors={form.formState.errors}
            />
            <TextAreaField
              name="description"
              label="매장 소개"
              description="예약 페이지에 표시되는 소개 문구입니다."
              register={form.register}
              errors={form.formState.errors}
            />
            <TextField
              name="phone"
              label="매장 전화번호"
              register={form.register}
              errors={form.formState.errors}
            />
            <TextField
              name="addressLine1"
              label="주소"
              register={form.register}
              errors={form.formState.errors}
            />
            <TextField
              name="addressLine2"
              label="상세 주소"
              register={form.register}
              errors={form.formState.errors}
            />
            <TextField
              name="postalCode"
              label="우편번호"
              register={form.register}
              errors={form.formState.errors}
            />
            <TextField
              name="cuisineTypesCsv"
              label="음식 종류"
              description="쉼표로 구분해 입력합니다."
              register={form.register}
              errors={form.formState.errors}
            />
          </div>

          <CoverImageField
            fileId={formValues.coverImageFileId}
            filename={formValues.coverImageFilename}
            previewUrl={coverPreviewUrl}
            error={coverUploadError}
            isUploading={uploadFile.isPending}
            onChange={handleCoverImageChange}
          />
        </div>

        {updateStoreSettings.isError ? (
          <div className="mt-4">
            <Alert variant="danger">{updateStoreSettings.error.message}</Alert>
          </div>
        ) : null}
        {saved ? (
          <div className="mt-4">
            <Alert variant="success">매장 정보가 저장되었습니다.</Alert>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button type="submit" isLoading={updateStoreSettings.isPending}>
            <Save aria-hidden className="size-4" />
            저장
          </Button>
        </div>
      </form>

      <StoreScheduleSection restaurant={storeSettings.data} />
      <ReservationPolicySection restaurant={storeSettings.data} />
    </section>
  );
}

interface ReservationPolicyForm {
  openDays: string;
  cutoffHours: string;
  minPartySize: string;
  maxPartySize: string;
}

function ReservationPolicySection({ restaurant }: { restaurant: RestaurantSettingsResponse }) {
  const [policy, setPolicy] = useState<ReservationPolicyForm>({
    openDays: "30",
    cutoffHours: "2",
    minPartySize: "1",
    maxPartySize: "8",
  });
  const [slug, setSlug] = useState(restaurant.reservationPage?.slug ?? restaurant.slug ?? "");
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySaved, setPolicySaved] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const updateReservationPage = useUpdateReservationPageMutation();
  const page = restaurant.reservationPage;
  const previewUrl = page?.publicUrl ?? (slug ? `/r/${slug}` : "");
  const blockerCodes = reservationPageBlockersForRestaurant(restaurant, slug);
  const blockers = reservationPageBlockerLabels(blockerCodes);
  const pageStatus = page ? pageStatusLabel(page.status) : "생성 전";
  const statusText = `현재 상태: ${pageStatus}`;

  function updatePolicy(patch: Partial<ReservationPolicyForm>) {
    setPolicySaved(false);
    setPolicy((current) => ({ ...current, ...patch }));
  }

  function handleSavePolicy() {
    setPolicyError(null);
    setPolicySaved(false);

    const openDays = Number(policy.openDays);
    const cutoffHours = Number(policy.cutoffHours);
    const minPartySize = Number(policy.minPartySize);
    const maxPartySize = Number(policy.maxPartySize);

    if (!Number.isInteger(openDays) || openDays < 1 || openDays > 365) {
      setPolicyError("예약 오픈 기간은 1일부터 365일 사이로 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(cutoffHours) || cutoffHours < 0 || cutoffHours > 168) {
      setPolicyError("예약 마감 시간은 0시간부터 168시간 사이로 입력해 주세요.");
      return;
    }
    if (!Number.isInteger(minPartySize) || !Number.isInteger(maxPartySize) || minPartySize < 1) {
      setPolicyError("예약 인원 제한은 1명 이상 정수로 입력해 주세요.");
      return;
    }
    if (minPartySize > maxPartySize) {
      setPolicyError("최소 예약 인원은 최대 예약 인원보다 클 수 없습니다.");
      return;
    }

    setPolicySaved(true);
  }

  async function handleUpdatePage(status: "PUBLIC" | "PRIVATE") {
    setPageError(null);
    setCopied(false);

    const normalizedSlug = slug.trim();

    if (!normalizedSlug) {
      setPageError("예약 페이지 경로를 입력해 주세요.");
      return;
    }

    if (!reservationPageSlugPattern.test(normalizedSlug)) {
      setPageError("예약 페이지 경로는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.");
      return;
    }

    const currentBlockers = clientReservationPageBlockers(restaurant, normalizedSlug);

    if (status === "PUBLIC" && currentBlockers.length > 0) {
      setPageError(
        `공개 전 필수 항목을 확인해 주세요: ${reservationPageBlockerLabels(currentBlockers).join(
          ", ",
        )}`,
      );
      return;
    }

    try {
      await updateReservationPage.mutateAsync({
        restaurantId: restaurant.id,
        request: { slug: normalizedSlug, status },
      });
      setSlug(normalizedSlug);
    } catch (error) {
      setPageError(errorMessage(error));
    }
  }

  async function handleCopyLink() {
    setCopied(false);

    if (!previewUrl) {
      setPageError("공유할 예약 페이지 경로가 없습니다.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(previewUrl);
      }
      setCopied(true);
    } catch {
      setPageError("공유 링크를 클립보드에 복사하지 못했습니다.");
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">예약 정책과 공개 페이지</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            예약 오픈/마감과 인원 제한을 확인하고 예약 페이지 공개 상태를 관리합니다.
          </p>
        </div>
        <span className="rounded-md border border-border px-3 py-1 text-sm">{statusText}</span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextFieldInline
              id="reservation-open-days"
              label="예약 오픈 기간"
              value={policy.openDays}
              onChange={(value) => updatePolicy({ openDays: value })}
            />
            <TextFieldInline
              id="reservation-cutoff-hours"
              label="예약 마감 시간"
              value={policy.cutoffHours}
              onChange={(value) => updatePolicy({ cutoffHours: value })}
            />
            <TextFieldInline
              id="reservation-min-party"
              label="최소 예약 인원"
              value={policy.minPartySize}
              onChange={(value) => updatePolicy({ minPartySize: value })}
            />
            <TextFieldInline
              id="reservation-max-party"
              label="최대 예약 인원"
              value={policy.maxPartySize}
              onChange={(value) => updatePolicy({ maxPartySize: value })}
            />
          </div>

          <Field id="reservation-page-slug" label="예약 페이지 경로">
            <Input
              id="reservation-page-slug"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setPageError(null);
                setCopied(false);
              }}
            />
          </Field>

          {blockers.length > 0 ? (
            <Alert variant="danger" title="공개 전 필수 누락 항목">
              {blockers.join(", ")}
            </Alert>
          ) : (
            <Alert variant="success">예약 페이지를 공개할 수 있는 상태입니다.</Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleSavePolicy}>
              정책 저장
            </Button>
            <Button
              type="button"
              isLoading={updateReservationPage.isPending}
              onClick={() => handleUpdatePage("PUBLIC")}
            >
              공개 전환
            </Button>
            <Button
              type="button"
              variant="outline"
              isLoading={updateReservationPage.isPending}
              onClick={() => handleUpdatePage("PRIVATE")}
            >
              비공개 전환
            </Button>
            <Button type="button" variant="outline" disabled={!previewUrl} onClick={handleCopyLink}>
              <Copy aria-hidden className="size-4" />
              공유 링크 복사
            </Button>
            {previewUrl ? (
              <a
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink aria-hidden className="size-4" />
                미리보기
              </a>
            ) : (
              <Button type="button" variant="outline" disabled>
                <ExternalLink aria-hidden className="size-4" />
                미리보기
              </Button>
            )}
          </div>

          {policyError ? <Alert variant="danger">{policyError}</Alert> : null}
          {pageError ? <Alert variant="danger">{pageError}</Alert> : null}
          {policySaved ? (
            <Alert variant="success">
              예약 정책이 화면에 저장되었습니다. 실제 API 연동은 후속 계약에서 연결합니다.
            </Alert>
          ) : null}
          {copied ? <Alert variant="success">공유 링크를 복사했습니다.</Alert> : null}
        </div>

        <div className="grid content-start gap-3">
          <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-md border border-border bg-muted p-4 text-center text-sm text-muted-foreground">
            <QrCode aria-hidden className="size-12" />
            QR 생성 연동 준비
          </div>
          <p className="break-all text-sm text-muted-foreground">
            공유 링크: {previewUrl || "예약 페이지 경로를 입력해 주세요."}
          </p>
        </div>
      </div>
    </section>
  );
}

const weekDays: Array<{ value: BusinessDayOfWeek; label: string }> = [
  { value: "MONDAY", label: "월요일" },
  { value: "TUESDAY", label: "화요일" },
  { value: "WEDNESDAY", label: "수요일" },
  { value: "THURSDAY", label: "목요일" },
  { value: "FRIDAY", label: "금요일" },
  { value: "SATURDAY", label: "토요일" },
  { value: "SUNDAY", label: "일요일" },
];

interface DaySchedule {
  dayOfWeek: BusinessDayOfWeek;
  closed: boolean;
  opensAt: string;
  closesAt: string;
  breakStart: string;
  breakEnd: string;
}

interface TemporaryHolidayForm {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

function StoreScheduleSection({ restaurant }: { restaurant: RestaurantSettingsResponse }) {
  const [schedule, setSchedule] = useState(() =>
    scheduleFromBusinessHours(restaurant.businessHours),
  );
  const [weeklyHolidayDays, setWeeklyHolidayDays] = useState<BusinessDayOfWeek[]>(() =>
    restaurant.holidayRules
      .filter((rule) => rule.type === "WEEKLY" && rule.dayOfWeek)
      .map((rule) => rule.dayOfWeek as BusinessDayOfWeek),
  );
  const [temporaryHoliday, setTemporaryHoliday] = useState<TemporaryHolidayForm>(() =>
    temporaryHolidayFromRules(restaurant.holidayRules),
  );
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const saveBusinessHours = useSaveBusinessHoursMutation();
  const saveHolidayRules = useSaveHolidayRulesMutation();
  const isSaving = saveBusinessHours.isPending || saveHolidayRules.isPending;

  function updateSchedule(dayOfWeek: BusinessDayOfWeek, patch: Partial<DaySchedule>) {
    setSaved(false);
    setSchedule((current) =>
      current.map((item) => (item.dayOfWeek === dayOfWeek ? { ...item, ...patch } : item)),
    );
  }

  function toggleWeeklyHoliday(dayOfWeek: BusinessDayOfWeek, checked: boolean) {
    setSaved(false);
    setWeeklyHolidayDays((current) =>
      checked ? [...current, dayOfWeek] : current.filter((item) => item !== dayOfWeek),
    );
  }

  async function handleSaveSchedule() {
    setSaved(false);
    setScheduleError(null);

    const validationError = validateSchedule(schedule, weeklyHolidayDays, temporaryHoliday);

    if (validationError) {
      setScheduleError(validationError);
      return;
    }

    try {
      await saveBusinessHours.mutateAsync({
        restaurantId: restaurant.id,
        request: { hours: toBusinessHourSaveItems(schedule) },
      });
      await saveHolidayRules.mutateAsync({
        restaurantId: restaurant.id,
        request: { rules: toHolidayRuleSaveItems(weeklyHolidayDays, temporaryHoliday) },
      });
      setSaved(true);
    } catch (error) {
      setScheduleError(errorMessage(error));
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">영업시간과 휴무</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            저장된 설정은 예약 가능 시간 계산에 사용할 요일별 구간과 휴무 규칙으로 전달됩니다.
          </p>
        </div>
        <Button type="button" isLoading={isSaving} onClick={handleSaveSchedule}>
          <Save aria-hidden className="size-4" />
          영업시간/휴무 저장
        </Button>
      </div>

      <div className="mt-5 grid gap-3">
        {schedule.map((day) => (
          <div
            className="grid gap-3 border-b border-border pb-3 lg:grid-cols-[96px_1fr]"
            key={day.dayOfWeek}
          >
            <div className="text-sm font-medium">{dayLabel(day.dayOfWeek)}</div>
            <div className="grid gap-3 md:grid-cols-5">
              <Checkbox
                checked={day.closed}
                id={`closed-${day.dayOfWeek}`}
                label={`${dayLabel(day.dayOfWeek)} 전체 휴무`}
                onChange={(event) =>
                  updateSchedule(day.dayOfWeek, { closed: event.target.checked })
                }
              />
              <TimeInput
                disabled={day.closed}
                id={`opens-${day.dayOfWeek}`}
                label={`${dayLabel(day.dayOfWeek)} 영업 시작`}
                value={day.opensAt}
                onChange={(value) => updateSchedule(day.dayOfWeek, { opensAt: value })}
              />
              <TimeInput
                disabled={day.closed}
                id={`closes-${day.dayOfWeek}`}
                label={`${dayLabel(day.dayOfWeek)} 영업 종료`}
                value={day.closesAt}
                onChange={(value) => updateSchedule(day.dayOfWeek, { closesAt: value })}
              />
              <TimeInput
                disabled={day.closed}
                id={`break-start-${day.dayOfWeek}`}
                label={`${dayLabel(day.dayOfWeek)} 브레이크 시작`}
                value={day.breakStart}
                onChange={(value) => updateSchedule(day.dayOfWeek, { breakStart: value })}
              />
              <TimeInput
                disabled={day.closed}
                id={`break-end-${day.dayOfWeek}`}
                label={`${dayLabel(day.dayOfWeek)} 브레이크 종료`}
                value={day.breakEnd}
                onChange={(value) => updateSchedule(day.dayOfWeek, { breakEnd: value })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">정기 휴무</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {weekDays.map((day) => (
              <Checkbox
                checked={weeklyHolidayDays.includes(day.value)}
                id={`weekly-holiday-${day.value}`}
                key={day.value}
                label={`${day.label} 정기 휴무`}
                onChange={(event) => toggleWeeklyHoliday(day.value, event.target.checked)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">임시 휴무</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field id="temporary-holiday-date" label="임시 휴무 날짜">
              <DateInput
                id="temporary-holiday-date"
                value={temporaryHoliday.date}
                onChange={(event) =>
                  setTemporaryHoliday((current) => ({ ...current, date: event.target.value }))
                }
              />
            </Field>
            <TextFieldInline
              id="temporary-holiday-reason"
              label="휴무 사유"
              value={temporaryHoliday.reason}
              onChange={(value) =>
                setTemporaryHoliday((current) => ({ ...current, reason: value }))
              }
            />
            <TimeInput
              id="temporary-holiday-start"
              label="임시 휴무 시작"
              value={temporaryHoliday.startTime}
              onChange={(value) =>
                setTemporaryHoliday((current) => ({ ...current, startTime: value }))
              }
            />
            <TimeInput
              id="temporary-holiday-end"
              label="임시 휴무 종료"
              value={temporaryHoliday.endTime}
              onChange={(value) =>
                setTemporaryHoliday((current) => ({ ...current, endTime: value }))
              }
            />
          </div>
        </div>
      </div>

      <ScheduleSummary
        schedule={schedule}
        weeklyHolidayDays={weeklyHolidayDays}
        temporaryHoliday={temporaryHoliday}
      />

      {scheduleError ? (
        <div className="mt-4">
          <Alert variant="danger">{scheduleError}</Alert>
        </div>
      ) : null}
      {saved ? (
        <div className="mt-4">
          <Alert variant="success">영업시간과 휴무가 저장되었습니다.</Alert>
        </div>
      ) : null}
    </section>
  );
}

function TimeInput({
  id,
  label,
  value,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label}>
      <Input
        disabled={disabled}
        id={id}
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
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

function ScheduleSummary({
  schedule,
  weeklyHolidayDays,
  temporaryHoliday,
}: {
  schedule: DaySchedule[];
  weeklyHolidayDays: BusinessDayOfWeek[];
  temporaryHoliday: TemporaryHolidayForm;
}) {
  const openDays = schedule.filter((day) => !day.closed).length;
  const closedDays = schedule.filter((day) => day.closed).length;

  return (
    <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
      <p>
        영업 요일 {openDays}일, 전체 휴무 {closedDays}일, 정기 휴무 {weeklyHolidayDays.length}
        개가 설정되어 있습니다.
      </p>
      {temporaryHoliday.date ? (
        <p>
          임시 휴무: {temporaryHoliday.date}
          {temporaryHoliday.startTime && temporaryHoliday.endTime
            ? ` ${temporaryHoliday.startTime}-${temporaryHoliday.endTime}`
            : " 종일"}
          {temporaryHoliday.reason ? `, ${temporaryHoliday.reason}` : ""}
        </p>
      ) : null}
    </div>
  );
}

function scheduleFromBusinessHours(businessHours: BusinessHourResponse[]): DaySchedule[] {
  return weekDays.map((day) => {
    const dayHours = businessHours
      .filter((item) => item.dayOfWeek === day.value)
      .sort((a, b) => a.sequence - b.sequence);
    const closed = dayHours.some((item) => item.closed);
    const first = dayHours[0];
    const second = dayHours[1];

    return {
      dayOfWeek: day.value,
      closed,
      opensAt: closed ? "" : (first?.opensAt ?? "10:00"),
      closesAt: closed ? "" : (second?.closesAt ?? first?.closesAt ?? "22:00"),
      breakStart: closed ? "" : second ? (first?.closesAt ?? "") : "",
      breakEnd: closed ? "" : (second?.opensAt ?? ""),
    };
  });
}

function temporaryHolidayFromRules(holidayRules: HolidayRuleResponse[]): TemporaryHolidayForm {
  const temporary = holidayRules.find(
    (rule) => rule.type === "TEMPORARY_DATE" || rule.type === "TEMPORARY_TIME",
  );

  return {
    date: temporary?.date ?? "",
    startTime: temporary?.startTime ?? "",
    endTime: temporary?.endTime ?? "",
    reason: temporary?.reason ?? "",
  };
}

function validateSchedule(
  schedule: DaySchedule[],
  weeklyHolidayDays: BusinessDayOfWeek[],
  temporaryHoliday: TemporaryHolidayForm,
) {
  for (const day of schedule) {
    if (weeklyHolidayDays.includes(day.dayOfWeek) && !day.closed) {
      return `${dayLabel(day.dayOfWeek)} 정기 휴무는 전체 휴무로 설정해 주세요.`;
    }

    if (day.closed) {
      continue;
    }

    if (!day.opensAt || !day.closesAt) {
      return `${dayLabel(day.dayOfWeek)} 영업 시작/종료 시간을 입력해 주세요.`;
    }

    if (!isBefore(day.opensAt, day.closesAt)) {
      return `${dayLabel(day.dayOfWeek)} 영업 시작은 종료보다 빨라야 합니다.`;
    }

    const hasBreakStart = Boolean(day.breakStart);
    const hasBreakEnd = Boolean(day.breakEnd);

    if (hasBreakStart !== hasBreakEnd) {
      return `${dayLabel(day.dayOfWeek)} 브레이크타임 시작/종료를 모두 입력해 주세요.`;
    }

    if (hasBreakStart && hasBreakEnd) {
      if (!isBefore(day.breakStart, day.breakEnd)) {
        return `${dayLabel(day.dayOfWeek)} 브레이크 시작은 종료보다 빨라야 합니다.`;
      }
      if (!isBefore(day.opensAt, day.breakStart) || !isBefore(day.breakEnd, day.closesAt)) {
        return `${dayLabel(day.dayOfWeek)} 브레이크타임은 영업시간 안에 있어야 합니다.`;
      }
    }
  }

  if ((temporaryHoliday.startTime || temporaryHoliday.endTime) && !temporaryHoliday.date) {
    return "임시 휴무 시간을 입력하려면 날짜를 먼저 선택해 주세요.";
  }

  if (
    temporaryHoliday.date &&
    Boolean(temporaryHoliday.startTime) !== Boolean(temporaryHoliday.endTime)
  ) {
    return "임시 휴무 시작/종료 시간을 모두 입력해 주세요.";
  }

  if (
    temporaryHoliday.date &&
    temporaryHoliday.startTime &&
    temporaryHoliday.endTime &&
    !isBefore(temporaryHoliday.startTime, temporaryHoliday.endTime)
  ) {
    return "임시 휴무 시작 시간은 종료 시간보다 빨라야 합니다.";
  }

  return null;
}

function toBusinessHourSaveItems(schedule: DaySchedule[]): BusinessHourSaveItem[] {
  const items: BusinessHourSaveItem[] = [];

  schedule.forEach((day) => {
    if (day.closed) {
      items.push({ dayOfWeek: day.dayOfWeek, closed: true });
      return;
    }

    if (day.breakStart && day.breakEnd) {
      items.push(
        { dayOfWeek: day.dayOfWeek, opensAt: day.opensAt, closesAt: day.breakStart },
        { dayOfWeek: day.dayOfWeek, opensAt: day.breakEnd, closesAt: day.closesAt },
      );
      return;
    }

    items.push({ dayOfWeek: day.dayOfWeek, opensAt: day.opensAt, closesAt: day.closesAt });
  });

  return items;
}

function toHolidayRuleSaveItems(
  weeklyHolidayDays: BusinessDayOfWeek[],
  temporaryHoliday: TemporaryHolidayForm,
): HolidayRuleSaveItem[] {
  const rules: HolidayRuleSaveItem[] = weeklyHolidayDays.map((dayOfWeek) => ({
    type: "WEEKLY" as const,
    dayOfWeek,
  }));

  if (temporaryHoliday.date) {
    rules.push({
      type:
        temporaryHoliday.startTime && temporaryHoliday.endTime
          ? "TEMPORARY_TIME"
          : "TEMPORARY_DATE",
      dayOfWeek: null,
      date: temporaryHoliday.date,
      startTime: temporaryHoliday.startTime || null,
      endTime: temporaryHoliday.endTime || null,
      reason: temporaryHoliday.reason.trim() || null,
    });
  }

  return rules;
}

function isBefore(start: string, end: string) {
  return start < end;
}

function dayLabel(dayOfWeek: BusinessDayOfWeek) {
  return weekDays.find((day) => day.value === dayOfWeek)?.label ?? dayOfWeek;
}

function PublicPageNotice({
  restaurant,
  missingRequirements,
}: {
  restaurant: RestaurantSettingsResponse;
  missingRequirements: StoreRequirement[];
}) {
  const page = restaurant.reservationPage;
  const pageBlockers = reservationPageBlockersForRestaurant(
    restaurant,
    page?.slug ?? restaurant.slug ?? "",
  );

  return (
    <section className="grid gap-3">
      {missingRequirements.length > 0 ? (
        <Alert variant="danger" title="공개 페이지 필수 정보">
          부족한 항목: {missingRequirements.map((requirement) => requirement.label).join(", ")}
        </Alert>
      ) : (
        <Alert variant="success">공개 페이지 기본 정보가 준비되어 있습니다.</Alert>
      )}
      <Alert title="공개 페이지 반영 안내">
        저장한 매장 기본 정보와 대표 이미지는 예약 페이지 설정이 공개 상태일 때 고객 화면에
        반영됩니다. 현재 예약 페이지 상태는 {page ? pageStatusLabel(page.status) : "생성 전"}입니다.
        {page?.publicUrl ? ` 공개 경로: ${page.publicUrl}` : ""}
      </Alert>
      {pageBlockers.length > 0 ? (
        <Alert variant="danger" title="공개 차단 항목">
          {reservationPageBlockerLabels(pageBlockers).join(", ")}
        </Alert>
      ) : null}
    </section>
  );
}

function CoverImageField({
  fileId,
  filename,
  previewUrl,
  error,
  isUploading,
  onChange,
}: {
  fileId?: number | null | undefined;
  filename?: string | undefined;
  previewUrl: string | null;
  error: string | null;
  isUploading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const previewImage = previewUrl && renderableImageUrl(previewUrl) ? previewUrl : null;

  return (
    <div className="grid content-start gap-3">
      <div className="aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
        {previewImage ? (
          <img alt="대표 이미지 미리보기" className="size-full object-cover" src={previewImage} />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
            <ImageUp aria-hidden className="size-8" />
            {fileId ? filename || `대표 이미지 파일 ID ${fileId}` : "대표 이미지 미리보기"}
          </div>
        )}
      </div>
      <Field
        id="store-cover-image"
        label="대표 이미지"
        description="JPG, PNG, WEBP 파일을 업로드합니다."
        error={error ?? undefined}
      >
        <Input
          id="store-cover-image"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          disabled={isUploading}
          invalid={Boolean(error)}
          onChange={onChange}
        />
      </Field>
      {isUploading ? <p className="text-sm text-muted-foreground">업로드 중</p> : null}
      {fileId ? (
        <p className="text-sm text-muted-foreground">
          현재 대표 이미지: {filename || `파일 ID ${fileId}`}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  name,
  label,
  description,
  type = "text",
  register,
  errors,
}: {
  name: FieldPath<StoreSettingsFormValues>;
  label: string;
  description?: string | undefined;
  type?: string | undefined;
  register: UseFormRegister<StoreSettingsFormValues>;
  errors: FieldErrors<StoreSettingsFormValues>;
}) {
  const id = `store-${name}`;
  const error = errors[name]?.message;

  return (
    <Field id={id} label={label} description={description} error={error}>
      <Input
        id={id}
        type={type}
        invalid={Boolean(error)}
        {...fieldA11y(id, { error, hasDescription: Boolean(description) })}
        {...register(name)}
      />
    </Field>
  );
}

function TextAreaField({
  name,
  label,
  description,
  register,
  errors,
}: {
  name: FieldPath<StoreSettingsFormValues>;
  label: string;
  description?: string | undefined;
  register: UseFormRegister<StoreSettingsFormValues>;
  errors: FieldErrors<StoreSettingsFormValues>;
}) {
  const id = `store-${name}`;
  const error = errors[name]?.message;

  return (
    <Field id={id} label={label} description={description} error={error}>
      <textarea
        className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
        id={id}
        {...fieldA11y(id, { error, hasDescription: Boolean(description) })}
        {...register(name)}
      />
    </Field>
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

interface StoreRequirement {
  label: string;
  complete: boolean;
}

function storeRequirements(values: StoreSettingsFormValues): StoreRequirement[] {
  return [
    { label: "매장명", complete: Boolean(values.name?.trim()) },
    { label: "매장 전화번호", complete: Boolean(values.phone?.trim()) },
    { label: "주소", complete: Boolean(values.addressLine1?.trim()) },
    {
      label: "음식 종류",
      complete:
        (values.cuisineTypesCsv ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean).length > 0,
    },
  ];
}

const reservationPageSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const reservationPageBlockerLabelsByCode: Record<string, string> = {
  restaurantStatus: "매장 승인 상태",
  name: "매장명",
  phone: "매장 전화번호",
  addressLine1: "주소",
  cuisineTypes: "음식 종류",
  slug: "예약 페이지 경로",
  businessHours: "영업시간",
};

function clientReservationPageBlockers(restaurant: RestaurantSettingsResponse, slug: string) {
  const blockers: string[] = [];

  if (restaurant.status !== "APPROVED") blockers.push("restaurantStatus");
  if (!restaurant.name?.trim()) blockers.push("name");
  if (!restaurant.phone?.trim()) blockers.push("phone");
  if (!restaurant.addressLine1?.trim()) blockers.push("addressLine1");
  if (restaurant.cuisineTypes.length === 0) blockers.push("cuisineTypes");
  if (!slug.trim()) blockers.push("slug");
  if (restaurant.businessHours.length === 0) blockers.push("businessHours");

  return blockers;
}

function reservationPageBlockersForRestaurant(
  restaurant: RestaurantSettingsResponse,
  slug: string,
) {
  const clientBlockers = clientReservationPageBlockers(restaurant, slug);
  const knownBlockers = new Set(Object.keys(reservationPageBlockerLabelsByCode));
  const unknownServerBlockers =
    restaurant.reservationPage?.publishBlockers.filter((blocker) => !knownBlockers.has(blocker)) ??
    [];

  return unique([...clientBlockers, ...unknownServerBlockers]);
}

function reservationPageBlockerLabels(blockers: string[]) {
  return blockers.map((blocker) => reservationPageBlockerLabelsByCode[blocker] ?? blocker);
}

function pageStatusLabel(
  status: NonNullable<RestaurantSettingsResponse["reservationPage"]>["status"],
) {
  const label: Record<
    NonNullable<RestaurantSettingsResponse["reservationPage"]>["status"],
    string
  > = {
    DRAFT: "작성중",
    PRIVATE: "비공개",
    PUBLIC: "공개",
    DISABLED: "비활성",
  };

  return label[status];
}

function renderableImageUrl(url: string) {
  return url.startsWith("blob:") || url.startsWith("http") || url.startsWith("/");
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
