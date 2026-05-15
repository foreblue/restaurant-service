import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUp, Save } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import {
  type FieldErrors,
  type FieldPath,
  type UseFormRegister,
  useForm,
  useWatch,
} from "react-hook-form";

import { Alert, Button, Field, fieldA11y, Input } from "@/components/ui";
import {
  emptyStoreSettingsValues,
  toStoreSettingsFormValues,
  toStoreSettingsUpdateRequest,
} from "@/features/store/storeSettingsMapper";
import {
  useStoreSettingsQuery,
  useUpdateStoreSettingsMutation,
  useUploadStoreFileMutation,
} from "@/features/store/storeSettingsQueries";
import {
  type StoreSettingsFormValues,
  storeSettingsSchema,
} from "@/features/store/storeSettingsSchema";
import { type RestaurantSettingsResponse } from "@/shared/api/businessApiClient";

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
    </section>
  );
}

function PublicPageNotice({
  restaurant,
  missingRequirements,
}: {
  restaurant: RestaurantSettingsResponse;
  missingRequirements: StoreRequirement[];
}) {
  const page = restaurant.reservationPage;

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
      {page && !page.publishable && page.publishBlockers.length > 0 ? (
        <Alert variant="danger" title="공개 차단 항목">
          {page.publishBlockers.join(", ")}
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
