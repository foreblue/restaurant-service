import { customerWebEnv } from "@/config/env";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const upstreamUrl = new URL(
    `/api/public/files/${encodeURIComponent(fileId)}`,
    `${customerWebEnv.apiBaseUrl}/`,
  );
  const upstream = await fetch(upstreamUrl, { cache: "no-store" });

  if (!upstream.ok) {
    return new Response(null, { status: upstream.status });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  const contentLength = upstream.headers.get("content-length");
  const cacheControl = upstream.headers.get("cache-control") ?? "public, max-age=2592000";

  if (contentType) headers.set("content-type", contentType);
  if (contentLength) headers.set("content-length", contentLength);
  headers.set("cache-control", cacheControl);

  return new Response(upstream.body, {
    headers,
    status: upstream.status,
  });
}
