/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUSINESS_API_BASE_URL: string;
  readonly VITE_BUSINESS_APP_ENV: "local" | "development" | "staging" | "production";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
