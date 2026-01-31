/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_URL: string;
  readonly VITE_WEBHOOK_URL: string;
  readonly VITE_STRIPE_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
