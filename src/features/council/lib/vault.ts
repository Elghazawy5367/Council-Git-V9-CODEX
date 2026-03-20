// src/features/council/lib/vault.ts
// Encrypted API key storage using Web Crypto API (browser-native, zero dependencies)
// Keys are encrypted with AES-GCM using a password-derived key (PBKDF2)

const VAULT_STORAGE_KEY = 'council_vault_v2';
const PBKDF2_ITERATIONS = 310_000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface VaultParams {
  password: string;
  openRouterKey: string;
  githubApiKey?: string;
}

export interface VaultKeys {
  openRouterKey: string;
  githubApiKey?: string;
}

export interface VaultResult {
  success: boolean;
  error?: string;
}

export interface VaultStatus {
  isCreated: boolean;
  isUnlocked: boolean;
}

interface EncryptedVaultData {
  version: 2;
  salt: string;
  iv: string;
  ciphertext: string;
}

// ── In-memory session cache (cleared on page unload) ──────────────────────────

let _sessionKeys: VaultKeys | null = null;

// ── Utility: encode / decode ──────────────────────────────────────────────────

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

// ── Key derivation ────────────────────────────────────────────────────────────

async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoded = new TextEncoder().encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoded,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Core encrypt / decrypt ────────────────────────────────────────────────────

async function encrypt(
  plaintext: string,
  password: string
): Promise<EncryptedVaultData> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    version: 2,
    salt: toBase64(salt.buffer),
    iv: toBase64(iv.buffer),
    ciphertext: toBase64(cipherBuffer),
  };
}

async function decrypt(
  data: EncryptedVaultData,
  password: string
): Promise<string> {
  const salt = fromBase64(data.salt);
  const iv = fromBase64(data.iv);
  const ciphertext = fromBase64(data.ciphertext);
  const key = await deriveKey(password, salt);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintextBuffer);
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function readStorage(): EncryptedVaultData | null {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EncryptedVaultData;
  } catch {
    return null;
  }
}

function writeStorage(data: EncryptedVaultData): void {
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(data));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check if a vault has been created in localStorage.
 */
export function isVaultCreated(): boolean {
  return readStorage() !== null;
}

/**
 * Get current vault status — whether it exists and whether it's unlocked
 * in the current browser session.
 */
export function getVaultStatus(): VaultStatus {
  return {
    isCreated: isVaultCreated(),
    isUnlocked: _sessionKeys !== null,
  };
}

/**
 * Create a new vault (or overwrite an existing one) with the given
 * password and API keys. Returns the encrypted data to localStorage.
 */
export async function createVault(params: VaultParams): Promise<VaultResult> {
  try {
    if (!params.password || params.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }
    if (!params.openRouterKey || params.openRouterKey.trim().length === 0) {
      return { success: false, error: 'OpenRouter API key is required.' };
    }

    const keys: VaultKeys = {
      openRouterKey: params.openRouterKey.trim(),
      ...(params.githubApiKey?.trim()
        ? { githubApiKey: params.githubApiKey.trim() }
        : {}),
    };

    const plaintext = JSON.stringify(keys);
    const encrypted = await encrypt(plaintext, params.password);
    writeStorage(encrypted);

    // Cache in session so UI doesn't need to re-enter password
    _sessionKeys = keys;

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown encryption error.';
    return { success: false, error: msg };
  }
}

/**
 * Unlock the vault with the given password and return the stored keys.
 * Also caches them in the browser session.
 * Returns null if the password is wrong or the vault doesn't exist.
 */
export async function unlockVault(password: string): Promise<VaultKeys | null> {
  try {
    const stored = readStorage();
    if (!stored) return null;

    const plaintext = await decrypt(stored, password);
    const keys = JSON.parse(plaintext) as VaultKeys;

    _sessionKeys = keys;
    return keys;
  } catch {
    // Wrong password causes AES-GCM to throw — return null
    return null;
  }
}

/**
 * Update API keys in an existing vault. Requires the current password.
 * Re-encrypts with a fresh salt and IV (best practice on every write).
 */
export async function updateVault(
  password: string,
  updates: Partial<VaultKeys>
): Promise<VaultResult> {
  try {
    // Verify password first
    const current = await unlockVault(password);
    if (!current) {
      return { success: false, error: 'Incorrect password.' };
    }

    const merged: VaultKeys = {
      ...current,
      ...Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined && v !== '')
      ),
    };

    const plaintext = JSON.stringify(merged);
    const encrypted = await encrypt(plaintext, password);
    writeStorage(encrypted);

    _sessionKeys = merged;
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error.';
    return { success: false, error: msg };
  }
}

/**
 * Return keys cached in the current browser session without re-entering
 * the password. Returns null if the vault has not been unlocked this session.
 */
export function getSessionKeys(): VaultKeys | null {
  return _sessionKeys;
}

/**
 * Lock the vault — clears the in-memory session cache only.
 * The encrypted data in localStorage is preserved.
 */
export function lockVault(): void {
  _sessionKeys = null;
}

/**
 * Permanently delete the vault from localStorage and clear the session cache.
 * The user will need to re-create the vault and re-enter their API keys.
 */
export function clearVault(): void {
  _sessionKeys = null;
  localStorage.removeItem(VAULT_STORAGE_KEY);
    }
