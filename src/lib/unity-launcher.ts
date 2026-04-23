// Unity foi substituído pela experiência 2.5D narrativa web.
// Este arquivo é mantido apenas para compatibilidade de build; não é usado pela aplicação.

export interface UnityLauncherState {
  canLaunch: false;
  reason: string;
}

const DEPRECATED: UnityLauncherState = {
  canLaunch: false,
  reason: "Unity foi removido. Use o mundo 2.5D integrado.",
};

export function getUnityLauncherState(): UnityLauncherState {
  return DEPRECATED;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function launchUnitySession(_input?: any): Promise<UnityLauncherState> {
  return DEPRECATED;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveUnityLauncherState(_input?: any): UnityLauncherState {
  return DEPRECATED;
}
