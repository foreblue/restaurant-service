import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col justify-center px-5 py-10">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-teal-700">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          예약 페이지를 찾을 수 없습니다.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          링크가 변경되었거나 아직 공개되지 않은 예약 페이지입니다.
        </p>
        <Link
          className="mt-5 inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          href="/"
        >
          처음 화면으로
        </Link>
      </div>
    </main>
  );
}
