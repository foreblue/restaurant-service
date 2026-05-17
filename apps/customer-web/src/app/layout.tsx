import type { Metadata, Viewport } from "next";

import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "식당 예약",
    template: "%s | 식당 예약",
  },
  description: "매장이 공유한 링크로 예약을 진행합니다.",
  applicationName: "Restaurant Reservation",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
