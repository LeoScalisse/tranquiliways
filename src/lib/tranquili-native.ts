import { Capacitor, registerPlugin } from "@capacitor/core";

interface TranquiliNativePlugin {
  transcribeOnce(options?: {
    language?: string;
    prompt?: string;
  }): Promise<{
    transcript: string;
  }>;
  openExternalUrl(options: {
    url: string;
  }): Promise<{
    opened: boolean;
    url: string;
  }>;
}

export const TranquiliNative = registerPlugin<TranquiliNativePlugin>("TranquiliNative");

export function isNativeAndroidRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  );
}
