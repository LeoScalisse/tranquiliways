import type { DilemmaWorld } from "./interpret-dilemma";

export type JourneyInputMode = "text" | "voice";
export type JourneySessionStatus = "ready" | "error";

export interface JourneySession {
  id: string;
  launchToken: string;
  createdAt: string;
  rawInput: string;
  inputMode: JourneyInputMode;
  status: JourneySessionStatus;
  world: DilemmaWorld;
}

interface IssueJourneySessionInput {
  rawInput: string;
  inputMode: JourneyInputMode;
  world: DilemmaWorld;
}

interface IssueJourneySessionOptions {
  secret?: string;
  id?: string;
  now?: string;
}

interface VerifyJourneySessionOptions {
  id: string;
  token: string;
  secret?: string;
}

const DEFAULT_SESSION_SECRET = "tranquiliways-phase-1-dev-secret";
const AES_GCM_IV_LENGTH = 12;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function issueJourneySession(
  input: IssueJourneySessionInput,
  options: IssueJourneySessionOptions = {},
): Promise<JourneySession> {
  const session: Omit<JourneySession, "launchToken"> = {
    id: options.id ?? crypto.randomUUID(),
    createdAt: options.now ?? new Date().toISOString(),
    rawInput: input.rawInput.trim(),
    inputMode: input.inputMode,
    status: "ready",
    world: input.world,
  };

  const launchToken = await sealJourneySessionPayload(session, options.secret);

  return {
    ...session,
    launchToken,
  };
}

export async function verifyJourneySessionToken(
  options: VerifyJourneySessionOptions,
): Promise<JourneySession | null> {
  const [ivPart, cipherPart] = options.token.split(".");

  if (!ivPart || !cipherPart) {
    return null;
  }

  try {
    const iv = decodeBase64Url(ivPart);
    const cipherBytes = decodeBase64Url(cipherPart);
    const key = await createEncryptionKey(resolveJourneySessionSecret(options.secret));
    const payloadBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(cipherBytes),
    );
    const payload = JSON.parse(decoder.decode(payloadBuffer)) as Partial<JourneySession>;

    if (!isJourneySessionPayload(payload) || payload.id !== options.id) {
      return null;
    }

    return {
      ...payload,
      launchToken: options.token,
    };
  } catch {
    return null;
  }
}

async function sealJourneySessionPayload(
  session: Omit<JourneySession, "launchToken">,
  secret?: string,
): Promise<string> {
  const payloadBytes = encoder.encode(JSON.stringify(session));
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
  const key = await createEncryptionKey(resolveJourneySessionSecret(secret));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    payloadBytes,
  );
  const cipherBytes = new Uint8Array(cipherBuffer);

  return `${encodeBase64Url(iv)}.${encodeBase64Url(cipherBytes)}`;
}

async function createEncryptionKey(secret: string): Promise<CryptoKey> {
  const secretDigest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", secretDigest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function resolveJourneySessionSecret(secret?: string): string {
  if (secret) return secret;
  const processSecret = (
    globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.TRANQUILIWAYS_SESSION_SECRET;
  return processSecret || DEFAULT_SESSION_SECRET;
}

function isJourneySessionPayload(
  payload: Partial<JourneySession>,
): payload is Omit<JourneySession, "launchToken"> {
  return (
    typeof payload.id === "string" &&
    typeof payload.createdAt === "string" &&
    typeof payload.rawInput === "string" &&
    (payload.inputMode === "text" || payload.inputMode === "voice") &&
    (payload.status === "ready" || payload.status === "error") &&
    payload.world !== null &&
    typeof payload.world === "object"
  );
}

function encodeBase64Url(bytes: Uint8Array): string {
  return encodeBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  return decodeBase64(`${base64}${padding}`);
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }
  return output;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
