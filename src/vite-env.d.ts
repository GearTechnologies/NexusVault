/// <reference types="vite/client" />

interface Window {
  ethereum?: import('ethers').Eip1193Provider & {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  };
}

interface ImportMetaEnv {
  readonly VITE_LIT_NETWORK?: string;
  readonly VITE_LIT_PKP_PUBLIC_KEY?: string;
  readonly VITE_LIT_PERMITTED_ACTIONS?: string;
  readonly VITE_LIT_PERMITTED_ADDRESSES?: string;
  readonly VITE_STORACHA_EMAIL?: string;
  readonly VITE_STORACHA_APP_NAME?: string;
  readonly VITE_STORACHA_SPACE_NAME?: string;
  readonly VITE_STORACHA_SPACE_DID?: string;
  readonly VITE_STORACHA_AUTO_CREATE_SPACE?: string;
  readonly VITE_STORACHA_GATEWAY_BASE?: string;
  readonly VITE_HEARTBEAT_INTERVAL_DAYS?: string;
  readonly VITE_VINCENT_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
