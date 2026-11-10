interface ImportMetaEnv {
  /** OAuth 2.0 Web client id from Google Cloud Console; without it the login page runs in preview mode */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Optional API Gateway base URL (defaults to relative /api via Vite proxy) */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
