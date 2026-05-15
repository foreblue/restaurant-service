import { createBrowserRouter, Navigate } from "react-router-dom";

import { LoginPage } from "@/features/auth/LoginPage";
import { PasswordResetRequestPage } from "@/features/auth/PasswordResetRequestPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { RestaurantApplicationPage } from "@/features/onboarding/RestaurantApplicationPage";
import { ReservationProductsPage } from "@/features/products/ReservationProductsPage";
import { ReservationOperationsPage } from "@/features/reservations/ReservationOperationsPage";
import { StoreSettingsPage } from "@/features/store/StoreSettingsPage";
import { AppShell } from "@/layout/AppShell";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

export function createBusinessRouter() {
  return createBrowserRouter([
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/password-reset",
      element: <PasswordResetRequestPage />,
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <AppShell />,
          children: [
            {
              index: true,
              element: <DashboardPage />,
            },
            {
              path: "dashboard",
              element: <Navigate to="/" replace />,
            },
            {
              path: "onboarding",
              element: <RestaurantApplicationPage />,
            },
            {
              path: "reservations",
              element: <ReservationOperationsPage />,
            },
            {
              path: "products",
              element: <ReservationProductsPage />,
            },
            {
              path: "store",
              element: <StoreSettingsPage />,
            },
            {
              path: "customers",
              element: <PlaceholderPage title="고객 관리" status="방문 이력과 메모" />,
            },
          ],
        },
      ],
    },
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ]);
}
