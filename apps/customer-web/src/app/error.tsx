"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col justify-center px-5 py-10">
      <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-red-700">화면을 불러오지 못했습니다.</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">잠시 후 다시 시도해 주세요.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          문제가 반복되면 예약 링크를 보낸 매장에 문의해 주세요.
        </p>
        <p className="mt-3 text-xs text-slate-500">{error.digest ?? error.message}</p>
        <button
          className="mt-5 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          type="button"
          onClick={reset}
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
