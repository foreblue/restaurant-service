import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "식당 예약 페이지";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.slice(0, 80) || "식당 예약";
  const description =
    searchParams.get("description")?.slice(0, 120) || "공유받은 링크로 예약을 진행합니다.";

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#f7faf8",
        color: "#14211f",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "2px solid #d8e1dc",
          borderRadius: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          height: "100%",
          justifyContent: "center",
          padding: "64px",
          width: "100%",
        }}
      >
        <div style={{ color: "#0f766e", fontSize: "34px", fontWeight: 700 }}>식당 예약</div>
        <div style={{ fontSize: "78px", fontWeight: 800, lineHeight: 1.12 }}>{name}</div>
        <div style={{ color: "#60706b", fontSize: "34px", lineHeight: 1.35 }}>{description}</div>
      </div>
    </div>,
    size,
  );
}
