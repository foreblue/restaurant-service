import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { type FieldPath, type UseFormRegister, type FieldErrors, useForm } from "react-hook-form";

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
  useUpdateRestaurantApplicationMutation,
} from "@/features/onboarding/restaurantApplicationQueries";

type StepIndex = 0 | 1 | 2;

export function RestaurantApplicationPage() {
  const [stepIndex, setStepIndex] = useState<StepIndex>(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const application = useRestaurantApplicationQuery();
  const createApplication = useCreateRestaurantApplicationMutation();
  const updateApplication = useUpdateRestaurantApplicationMutation();
  const currentApplication = application.data ?? createApplication.data ?? null;
  const form = useForm<RestaurantApplicationFormValues>({
    defaultValues: emptyRestaurantApplicationValues,
    resolver: zodResolver(restaurantApplicationSchema),
  });

  useEffect(() => {
    if (currentApplication) {
      form.reset(toFormValues(currentApplication));
    }
  }, [currentApplication, form]);

  const currentStep = onboardingSteps[stepIndex];
  const isSaving = createApplication.isPending || updateApplication.isPending;

  async function handleStart() {
    setShowSaveSuccess(false);
    await createApplication.mutateAsync(toSaveRequest(emptyRestaurantApplicationValues));
  }

  async function saveCurrentStep() {
    setShowSaveSuccess(false);
    const isValid = await form.trigger(currentStep.fields);

    if (!isValid) {
      return false;
    }

    const request = toSaveRequest(form.getValues());

    if (currentApplication) {
      await updateApplication.mutateAsync({
        applicationId: currentApplication.id,
        request,
      });
    } else {
      await createApplication.mutateAsync(request);
    }

    setShowSaveSuccess(true);
    return true;
  }

  async function handleNext() {
    const saved = await saveCurrentStep();

    if (saved && stepIndex < 2) {
      setStepIndex((stepIndex + 1) as StepIndex);
    }
  }

  async function handleSave() {
    await saveCurrentStep();
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
          매장 기본 정보, 사업자 정보, 담당자 연락처를 단계별로 저장합니다.
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

  return (
    <section className="grid gap-5">
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-normal">입점 신청</h1>
        <p className="mt-1 text-sm text-muted-foreground">작성중 상태로 단계별 저장됩니다.</p>
      </header>

      <ol className="grid gap-2 sm:grid-cols-3">
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
        </div>

        {createApplication.isError || updateApplication.isError ? (
          <div className="mt-4">
            <Alert variant="danger">
              {createApplication.error?.message ?? updateApplication.error?.message}
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
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((stepIndex - 1) as StepIndex)}
          >
            <ArrowLeft aria-hidden className="size-4" />
            이전
          </Button>
          {stepIndex < 2 ? (
            <Button type="button" isLoading={isSaving} onClick={handleNext}>
              다음
              <ArrowRight aria-hidden className="size-4" />
            </Button>
          ) : (
            <Button type="button" isLoading={isSaving} onClick={handleSave}>
              저장
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
  description?: string;
  type?: string;
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
