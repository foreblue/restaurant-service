import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  RotateCcw,
  Send,
  UploadCloud,
} from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import {
  type FieldErrors,
  type FieldPath,
  type UseFormRegister,
  type UseFormReturn,
  useForm,
} from "react-hook-form";

import { Alert, Button, Field, fieldA11y, Input } from "@/components/ui";
import {
  emptyRestaurantApplicationValues,
  toFormValues,
  toSaveRequest,
} from "@/features/onboarding/restaurantApplicationMapper";
import {
  type RestaurantApplicationFormValues,
  onboardingSteps,
  restaurantApplicationSchema,
} from "@/features/onboarding/restaurantApplicationSchema";
import {
  useCreateRestaurantApplicationMutation,
  useRestaurantApplicationQuery,
  useSubmitRestaurantApplicationMutation,
  useUpdateRestaurantApplicationMutation,
  useUploadBusinessFileMutation,
} from "@/features/onboarding/restaurantApplicationQueries";
import {
  type BusinessFilePurpose,
  type RestaurantApplicationResponse,
} from "@/shared/api/businessApiClient";

type UploadTarget = "businessLicense" | "coverImage";

const lastStepIndex = onboardingSteps.length - 1;

export function RestaurantApplicationPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingPurpose, setUploadingPurpose] = useState<BusinessFilePurpose | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<UploadTarget, string | null>>({
    businessLicense: null,
    coverImage: null,
  });
  const [isEditingRejected, setIsEditingRejected] = useState(false);
  const application = useRestaurantApplicationQuery();
  const createApplication = useCreateRestaurantApplicationMutation();
  const updateApplication = useUpdateRestaurantApplicationMutation();
  const uploadFile = useUploadBusinessFileMutation();
  const submitApplication = useSubmitRestaurantApplicationMutation();
  const currentApplication = application.data ?? createApplication.data ?? null;
  const form = useForm<RestaurantApplicationFormValues>({
    defaultValues: emptyRestaurantApplicationValues,
    resolver: zodResolver(restaurantApplicationSchema),
  });
  const formValues = form.watch();
  const submitRequirements = getSubmitRequirements(formValues);

  useEffect(() => {
    if (currentApplication) {
      form.reset(toFormValues(currentApplication));
    }
  }, [currentApplication, form]);

  useEffect(() => {
    if (currentApplication?.status !== "REJECTED") {
      setIsEditingRejected(false);
    }
  }, [currentApplication?.status]);

  const currentStep = onboardingSteps[stepIndex] ?? onboardingSteps[0];
  const isSaving =
    createApplication.isPending ||
    updateApplication.isPending ||
    uploadFile.isPending ||
    submitApplication.isPending;
  const statusOnly =
    currentApplication &&
    currentApplication.status !== "DRAFT" &&
    !(currentApplication.status === "REJECTED" && isEditingRejected);

  async function handleStart() {
    setShowSaveSuccess(false);
    setSubmitError(null);

    try {
      await createApplication.mutateAsync(toSaveRequest(emptyRestaurantApplicationValues));
    } catch {
      // Mutation state renders the start error.
    }
  }

  async function persistApplication(options: { contactVerified?: boolean } = {}) {
    const request = toSaveRequest(form.getValues(), options);

    if (currentApplication) {
      return updateApplication.mutateAsync({
        applicationId: currentApplication.id,
        request,
      });
    }

    return createApplication.mutateAsync(request);
  }

  async function validateCurrentStep() {
    const isValid = currentStep.fields.length === 0 ? true : await form.trigger(currentStep.fields);

    if (!isValid) {
      return false;
    }

    if (currentStep.id === "documents" && !form.getValues("businessLicenseFileId")) {
      form.setError("businessLicenseFileId", {
        type: "manual",
        message: "사업자등록증을 업로드해 주세요.",
      });
      return false;
    }

    return true;
  }

  async function saveCurrentStep() {
    setShowSaveSuccess(false);
    setSubmitError(null);

    if (!(await validateCurrentStep())) {
      return null;
    }

    try {
      const saved = await persistApplication();
      setShowSaveSuccess(true);
      return saved;
    } catch {
      return null;
    }
  }

  async function handleNext() {
    const saved = await saveCurrentStep();

    if (saved && stepIndex < lastStepIndex) {
      setStepIndex((current) => Math.min(current + 1, lastStepIndex));
    }
  }

  async function handleSubmitApplication() {
    setShowSaveSuccess(false);
    setSubmitError(null);

    const isValid = await form.trigger();
    const missingRequirements = getSubmitRequirements(form.getValues()).filter(
      (requirement) => !requirement.complete,
    );

    if (!isValid) {
      setSubmitError("입력값을 다시 확인해 주세요.");
      return;
    }

    if (missingRequirements.length > 0) {
      setSubmitError(
        `승인 요청 필수 정보가 부족합니다: ${missingRequirements
          .map((requirement) => requirement.label)
          .join(", ")}`,
      );
      return;
    }

    try {
      const saved = await persistApplication({ contactVerified: true });
      await submitApplication.mutateAsync(saved.id);
      setIsEditingRejected(false);
    } catch (error) {
      setSubmitError(errorMessage(error));
    }
  }

  async function handleFileChange(
    purpose: BusinessFilePurpose,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const target = purpose === "business_license" ? "businessLicense" : "coverImage";
    setShowSaveSuccess(false);
    setUploadErrors((current) => ({ ...current, [target]: null }));
    setUploadingPurpose(purpose);

    try {
      const uploaded = await uploadFile.mutateAsync({ purpose, file });

      if (purpose === "business_license") {
        form.setValue("businessLicenseFileId", uploaded.id, {
          shouldDirty: true,
          shouldValidate: true,
        });
        form.setValue("businessLicenseFilename", uploaded.originalFilename, {
          shouldDirty: true,
        });
        form.clearErrors("businessLicenseFileId");
      } else {
        form.setValue("coverImageFileId", uploaded.id, {
          shouldDirty: true,
          shouldValidate: true,
        });
        form.setValue("coverImageFilename", uploaded.originalFilename, {
          shouldDirty: true,
        });
      }
    } catch (error) {
      setUploadErrors((current) => ({ ...current, [target]: errorMessage(error) }));
    } finally {
      setUploadingPurpose(null);
      input.value = "";
    }
  }

  if (application.isPending) {
    return <Panel title="입점 신청" description="작성중 신청을 불러오는 중입니다." />;
  }

  if (application.isError) {
    return <Panel title="입점 신청" description={application.error.message} variant="danger" />;
  }

  if (!currentApplication) {
    return (
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h1 className="text-xl font-semibold tracking-normal">입점 신청 시작</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          매장 기본 정보, 사업자 정보, 담당자 연락처, 제출 서류를 단계별로 저장합니다.
        </p>
        {createApplication.isError ? (
          <div className="mt-4">
            <Alert variant="danger">{createApplication.error.message}</Alert>
          </div>
        ) : null}
        <Button
          className="mt-5"
          type="button"
          isLoading={createApplication.isPending}
          onClick={handleStart}
        >
          <ClipboardCheck aria-hidden className="size-4" />
          신청 작성 시작
        </Button>
      </section>
    );
  }

  if (statusOnly) {
    return (
      <ApplicationStatusView
        application={currentApplication}
        onEditRejected={() => {
          setIsEditingRejected(true);
          setStepIndex(0);
        }}
      />
    );
  }

  return (
    <section className="grid gap-5">
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-normal">입점 신청</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentApplication.status === "REJECTED"
            ? "반려 사유를 반영해 수정하고 재제출합니다."
            : "작성중 상태로 단계별 저장한 뒤 승인 요청을 제출합니다."}
        </p>
      </header>

      {currentApplication.status === "REJECTED" ? (
        <Alert variant="danger" title="반려 사유">
          {currentApplication.rejectionReason ?? "관리자 반려 사유가 등록되지 않았습니다."}
        </Alert>
      ) : null}

      <ol className="grid gap-2 sm:grid-cols-5">
        {onboardingSteps.map((step, index) => (
          <li
            className={`rounded-lg border px-3 py-2 text-sm ${
              index === stepIndex
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card"
            }`}
            key={step.id}
          >
            <span className="font-medium">{index + 1}. </span>
            {step.title}
          </li>
        ))}
      </ol>

      <form className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{currentStep.title}</h2>
        <div className="mt-5 grid gap-4">
          {stepIndex === 0 ? (
            <RestaurantStep register={form.register} errors={form.formState.errors} />
          ) : null}
          {stepIndex === 1 ? (
            <BusinessStep register={form.register} errors={form.formState.errors} />
          ) : null}
          {stepIndex === 2 ? (
            <ManagerStep register={form.register} errors={form.formState.errors} />
          ) : null}
          {stepIndex === 3 ? (
            <DocumentsStep
              form={form}
              errors={form.formState.errors}
              uploadingPurpose={uploadingPurpose}
              uploadErrors={uploadErrors}
              onFileChange={handleFileChange}
            />
          ) : null}
          {stepIndex === 4 ? (
            <ReviewStep
              application={currentApplication}
              values={formValues}
              requirements={submitRequirements}
            />
          ) : null}
        </div>

        {createApplication.isError || updateApplication.isError || submitError ? (
          <div className="mt-4">
            <Alert variant="danger">
              {submitError ??
                createApplication.error?.message ??
                updateApplication.error?.message ??
                "요청을 처리하지 못했습니다."}
            </Alert>
          </div>
        ) : null}
        {showSaveSuccess ? (
          <div className="mt-4">
            <Alert variant="success">작성중 신청이 저장되었습니다.</Alert>
          </div>
        ) : null}

        <div className="mt-6 flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={stepIndex === 0 || isSaving}
            onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
          >
            <ArrowLeft aria-hidden className="size-4" />
            이전
          </Button>
          {stepIndex < lastStepIndex ? (
            <Button type="button" isLoading={isSaving} onClick={handleNext}>
              다음
              <ArrowRight aria-hidden className="size-4" />
            </Button>
          ) : (
            <Button type="button" isLoading={isSaving} onClick={handleSubmitApplication}>
              <Send aria-hidden className="size-4" />
              승인 요청 제출
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}

function RestaurantStep({
  register,
  errors,
}: {
  register: UseFormRegister<RestaurantApplicationFormValues>;
  errors: FieldErrors<RestaurantApplicationFormValues>;
}) {
  return (
    <>
      <TextField name="restaurantName" label="매장명" register={register} errors={errors} />
      <TextField name="restaurantPhone" label="매장 전화번호" register={register} errors={errors} />
      <TextField name="addressLine1" label="주소" register={register} errors={errors} />
      <TextField name="addressLine2" label="상세 주소" register={register} errors={errors} />
      <TextField name="postalCode" label="우편번호" register={register} errors={errors} />
      <TextField
        name="cuisineTypesCsv"
        label="음식 종류"
        description="쉼표로 구분해 입력합니다."
        register={register}
        errors={errors}
      />
      <TextField
        name="restaurantDescription"
        label="매장 소개"
        register={register}
        errors={errors}
      />
    </>
  );
}

function BusinessStep({
  register,
  errors,
}: {
  register: UseFormRegister<RestaurantApplicationFormValues>;
  errors: FieldErrors<RestaurantApplicationFormValues>;
}) {
  return (
    <>
      <TextField
        name="businessRegistrationNo"
        label="사업자등록번호"
        register={register}
        errors={errors}
      />
      <TextField name="businessName" label="상호명" register={register} errors={errors} />
      <TextField name="representativeName" label="대표자명" register={register} errors={errors} />
      <TextField name="businessAddress" label="사업장 주소" register={register} errors={errors} />
    </>
  );
}

function ManagerStep({
  register,
  errors,
}: {
  register: UseFormRegister<RestaurantApplicationFormValues>;
  errors: FieldErrors<RestaurantApplicationFormValues>;
}) {
  return (
    <>
      <TextField name="managerName" label="담당자 이름" register={register} errors={errors} />
      <TextField name="managerPhone" label="담당자 연락처" register={register} errors={errors} />
      <TextField
        name="managerEmail"
        label="담당자 이메일"
        type="email"
        register={register}
        errors={errors}
      />
    </>
  );
}

function DocumentsStep({
  form,
  errors,
  uploadingPurpose,
  uploadErrors,
  onFileChange,
}: {
  form: UseFormReturn<RestaurantApplicationFormValues>;
  errors: FieldErrors<RestaurantApplicationFormValues>;
  uploadingPurpose: BusinessFilePurpose | null;
  uploadErrors: Record<UploadTarget, string | null>;
  onFileChange: (
    purpose: BusinessFilePurpose,
    event: ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
}) {
  const values = form.watch();

  return (
    <>
      <FileUploadField
        id="application-business-license-file"
        label="사업자등록증"
        description="PDF, JPG, PNG 파일을 업로드합니다. 최대 10MB까지 허용됩니다."
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        fileId={values.businessLicenseFileId}
        filename={values.businessLicenseFilename}
        error={errors.businessLicenseFileId?.message ?? uploadErrors.businessLicense}
        isUploading={uploadingPurpose === "business_license"}
        onChange={(event) => onFileChange("business_license", event)}
      />
      <FileUploadField
        id="application-cover-image-file"
        label="대표 이미지"
        description="예약 페이지에 사용할 대표 이미지입니다. JPG, PNG, WEBP 파일을 업로드합니다."
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        fileId={values.coverImageFileId}
        filename={values.coverImageFilename}
        error={uploadErrors.coverImage}
        isUploading={uploadingPurpose === "restaurant_image"}
        onChange={(event) => onFileChange("restaurant_image", event)}
      />
    </>
  );
}

function FileUploadField({
  id,
  label,
  description,
  accept,
  fileId,
  filename,
  error,
  isUploading,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  accept: string;
  fileId?: number | null | undefined;
  filename?: string | undefined;
  error?: string | null | undefined;
  isUploading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Field id={id} label={label} description={description} error={error ?? undefined}>
      <div className="grid gap-2">
        <Input
          id={id}
          type="file"
          accept={accept}
          invalid={Boolean(error)}
          disabled={isUploading}
          onChange={onChange}
        />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {isUploading ? (
            <>
              <UploadCloud aria-hidden className="size-4 animate-pulse" />
              업로드 중
            </>
          ) : fileId ? (
            <>
              <FileCheck2 aria-hidden className="size-4 text-primary" />
              {filename || `파일 ID ${fileId}`} 업로드 완료
            </>
          ) : (
            "아직 업로드된 파일이 없습니다."
          )}
        </p>
      </div>
    </Field>
  );
}

function ReviewStep({
  application,
  values,
  requirements,
}: {
  application: RestaurantApplicationResponse;
  values: RestaurantApplicationFormValues;
  requirements: SubmitRequirement[];
}) {
  return (
    <div className="grid gap-5">
      <Alert>
        승인 요청 후에는 관리자 검토가 끝날 때까지 신청 정보를 수정할 수 없습니다. 반려되면 같은
        화면에서 수정 후 다시 제출할 수 있습니다.
      </Alert>
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryItem label="매장명" value={values.restaurantName} />
        <SummaryItem label="매장 전화번호" value={values.restaurantPhone} />
        <SummaryItem label="주소" value={values.addressLine1} />
        <SummaryItem label="음식 종류" value={values.cuisineTypesCsv} />
        <SummaryItem label="상호명" value={values.businessName} />
        <SummaryItem label="사업자등록번호" value={values.businessRegistrationNo} />
        <SummaryItem label="담당자" value={`${values.managerName} / ${values.managerPhone}`} />
        <SummaryItem label="사업자등록증" value={values.businessLicenseFilename} />
        <SummaryItem label="대표 이미지" value={values.coverImageFilename || "선택 안 함"} />
        <SummaryItem label="신청 상태" value={statusLabel(application.status)} />
      </div>
      <div>
        <h3 className="text-sm font-semibold">제출 준비 상태</h3>
        <ul className="mt-2 grid gap-2 text-sm">
          {requirements.map((requirement) => (
            <li className="flex items-center justify-between gap-3" key={requirement.label}>
              <span>{requirement.label}</span>
              <span className={requirement.complete ? "text-primary" : "text-destructive"}>
                {requirement.complete ? "완료" : "필요"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div className="grid gap-1 border-b border-border pb-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value?.trim() || "-"}</p>
    </div>
  );
}

function ApplicationStatusView({
  application,
  onEditRejected,
}: {
  application: RestaurantApplicationResponse;
  onEditRejected: () => void;
}) {
  return (
    <section className="grid gap-5">
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-normal">입점 신청 상태</h1>
        <p className="mt-1 text-sm text-muted-foreground">{statusDescription(application)}</p>
      </header>
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">현재 상태</p>
            <p className="mt-1 text-xl font-semibold">{statusLabel(application.status)}</p>
          </div>
          <span className="rounded-md border border-border px-3 py-1 text-sm">
            {application.submittedAt ? formatDate(application.submittedAt) : "미제출"}
          </span>
        </div>
        {application.status === "REJECTED" ? (
          <div className="mt-5 grid gap-4">
            <Alert variant="danger" title="반려 사유">
              {application.rejectionReason ?? "관리자 반려 사유가 등록되지 않았습니다."}
            </Alert>
            <Button type="button" onClick={onEditRejected}>
              <RotateCcw aria-hidden className="size-4" />
              수정 후 재제출
            </Button>
          </div>
        ) : null}
        {application.status === "APPROVED" ? (
          <div className="mt-5">
            <Alert variant="success">
              승인이 완료되었습니다. 매장 설정 단계로 이동할 수 있습니다.
            </Alert>
          </div>
        ) : null}
      </div>
    </section>
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
  name: FieldPath<RestaurantApplicationFormValues>;
  label: string;
  description?: string | undefined;
  type?: string | undefined;
  register: UseFormRegister<RestaurantApplicationFormValues>;
  errors: FieldErrors<RestaurantApplicationFormValues>;
}) {
  const id = `application-${name}`;
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

interface SubmitRequirement {
  label: string;
  complete: boolean;
}

function getSubmitRequirements(values: RestaurantApplicationFormValues): SubmitRequirement[] {
  return [
    { label: "매장명", complete: hasText(values.restaurantName) },
    { label: "매장 전화번호", complete: hasText(values.restaurantPhone) },
    { label: "주소", complete: hasText(values.addressLine1) },
    { label: "음식 종류", complete: cuisineTypes(values.cuisineTypesCsv).length > 0 },
    { label: "사업자등록번호", complete: hasText(values.businessRegistrationNo) },
    { label: "상호명", complete: hasText(values.businessName) },
    { label: "대표자명", complete: hasText(values.representativeName) },
    { label: "사업장 주소", complete: hasText(values.businessAddress) },
    { label: "사업자등록증", complete: Boolean(values.businessLicenseFileId) },
    { label: "담당자 이름", complete: hasText(values.managerName) },
    { label: "담당자 연락처", complete: hasText(values.managerPhone) },
    { label: "담당자 이메일", complete: hasText(values.managerEmail) },
  ];
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function cuisineTypes(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function statusLabel(status: RestaurantApplicationResponse["status"]) {
  const label: Record<RestaurantApplicationResponse["status"], string> = {
    DRAFT: "작성중",
    SUBMITTED: "승인 검토 중",
    APPROVED: "승인 완료",
    REJECTED: "반려",
    CANCELLED: "취소",
  };

  return label[status];
}

function statusDescription(application: RestaurantApplicationResponse) {
  if (application.status === "SUBMITTED") {
    return "관리자 검토가 진행 중입니다.";
  }

  if (application.status === "APPROVED") {
    return "입점 신청이 승인되었습니다.";
  }

  if (application.status === "REJECTED") {
    return "반려 사유를 확인한 뒤 수정해서 다시 제출할 수 있습니다.";
  }

  if (application.status === "CANCELLED") {
    return "입점 신청이 취소되었습니다.";
  }

  return "작성중 신청입니다.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
