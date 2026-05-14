import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
      <section className="w-full max-w-[360px] rounded-lg border border-border bg-card p-5 text-center shadow-sm">
        <h1 className="text-lg font-semibold">페이지를 찾을 수 없습니다</h1>
        <Link
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          to="/"
        >
          대시보드
        </Link>
      </section>
    </main>
  );
}
