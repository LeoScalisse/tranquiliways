import { buildUnitySessionUrl } from "./journey-session.ts";
import { TranquiliNative, isNativeAndroidRuntime } from "./tranquili-native.ts";

interface UnityLauncherPlatformInput {
  isNativePlatform: boolean;
  platform: string;
}

export interface UnityLauncherState {
  canLaunch: boolean;
  reason: string | null;
}

interface LaunchUnitySessionInput {
  id: string;
  launchToken: string;
}

interface LaunchUnitySessionResult extends UnityLauncherState {
  url?: string;
}

const UNITY_ANDROID_ONLY_MESSAGE =
  "Disponivel apenas no Android nesta fase da Primeira Chama.";

export function resolveUnityLauncherState(
  input: UnityLauncherPlatformInput,
): UnityLauncherState {
  if (input.isNativePlatform && input.platform === "android") {
    return {
      canLaunch: true,
      reason: null,
    };
  }

  return {
    canLaunch: false,
    reason: UNITY_ANDROID_ONLY_MESSAGE,
  };
}

export function getUnityLauncherState(): UnityLauncherState {
  return resolveUnityLauncherState({
    isNativePlatform: isNativeAndroidRuntime(),
    platform: isNativeAndroidRuntime() ? "android" : "web",
  });
}

export async function launchUnitySession(
  input: LaunchUnitySessionInput,
): Promise<LaunchUnitySessionResult> {
  const state = getUnityLauncherState();

  if (!state.canLaunch) {
    return state;
  }

  const url = buildUnitySessionUrl(input);

  try {
    if (isNativeAndroidRuntime()) {
      await TranquiliNative.openExternalUrl({ url });
    } else if (typeof window !== "undefined") {
      window.location.assign(url);
    } else {
      return {
        canLaunch: false,
        reason: UNITY_ANDROID_ONLY_MESSAGE,
      };
    }

    return {
      canLaunch: true,
      reason: null,
      url,
    };
  } catch (error) {
    return {
      canLaunch: false,
      reason:
        error instanceof Error
          ? error.message
          : "Nao foi possivel abrir o Unity neste dispositivo.",
      url,
    };
  }
}

