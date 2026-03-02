// Vault service for secure API key storage
// Uses AES-256-GCM via Web Crypto API (PBKDF2 key derivation)

const VAULT_KEY = 'council_vault_v19'; // v19 invalidates the old insecure v18 data
const PBKDF2_ITERATIONS = 600_000;     // OWASP 2024 recommendation

export interface VaultStatus {
  hasVault: boolean;
  isLocked: boolean;
}

// In-memory session store — never written to sessionStorage
const sessionKeys = new Map<string, string>();

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const raw = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(password: string, plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const enc  = new TextEncoder();
  const ct   = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  const out  = new Uint8Array(16 + 12 + ct.byteLength);
  out.set(salt, 0); out.set(iv, 16); out.set(new Uint8Array(ct), 28);
  return btoa(String.fromCharCode(...out)); // btoa here = encoding a CIPHERTEXT blob, safe
}

async function decryptData(password: string, blob: string): Promise<string> {
  const buf  = Uint8Array.from(atob(blob), c => c.charCodeAt(0));
  const salt = buf.slice(0, 16);
  const iv   = buf.slice(16, 28);
  const data = buf.slice(28);
  const key  = await deriveKey(password, salt);
  const pt   = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(pt);
}

// ── Public API (same signatures as before) ─────────────────────────────────

// Initialize vault status (synchronous — checks localStorage + in-memory session)
export function initializeVault(): VaultStatus {
  const hasVault = localStorage.getItem(VAULT_KEY) !== null;
  const isLocked = sessionKeys.size === 0;
  return { hasVault, isLocked };
}

// Get vault status
export function getVaultStatus(): VaultStatus {
  return initializeVault();
}

// Create new vault
export async function createVault(data: {
  password: string;
  openRouterKey: string;
  serperKey?: string;
  githubApiKey?: string;
  redditApiKey?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const keys = {
      openRouterKey: data.openRouterKey,
      serperKey: data.serperKey || '',
      githubApiKey: data.githubApiKey || '',
      redditApiKey: data.redditApiKey || '',
    };

    const encrypted = await encryptData(data.password, JSON.stringify(keys));
    localStorage.setItem(VAULT_KEY, encrypted);

    // Remove old insecure vault
    localStorage.removeItem('council_vault_v18');

    // Auto-unlock after creation (store in memory, not sessionStorage)
    sessionKeys.set('openRouterKey', keys.openRouterKey);
    sessionKeys.set('serperKey', keys.serperKey);
    sessionKeys.set('githubApiKey', keys.githubApiKey);
    sessionKeys.set('redditApiKey', keys.redditApiKey);

    return { success: true };
  } catch (error) {
    console.error('Failed to create vault:', error);
    return { success: false, error: 'Failed to create vault' };
  }
}

// Unlock vault
export async function unlockVault(password: string): Promise<{ success: boolean; error?: string; keys?: { openRouterKey: string; serperKey?: string; githubApiKey?: string; redditApiKey?: string } }> {
  try {
    // Remove old insecure vault on first unlock attempt
    localStorage.removeItem('council_vault_v18');

    const blob = localStorage.getItem(VAULT_KEY);
    if (!blob) {
      return { success: false, error: 'No vault found' };
    }

    const decrypted = await decryptData(password, blob); // throws DOMException if wrong password
    const keys = JSON.parse(decrypted) as Record<string, string>;

    // Store in-memory session
    Object.entries(keys).forEach(([k, v]) => sessionKeys.set(k, v));

    return {
      success: true,
      keys: {
        openRouterKey: keys.openRouterKey,
        serperKey: keys.serperKey,
        githubApiKey: keys.githubApiKey,
        redditApiKey: keys.redditApiKey,
      }
    };
  } catch (error) {
    console.error('Failed to unlock vault:', error);
    return { success: false, error: 'Invalid password' };
  }
}

// Lock vault
export function lockVault(): void {
  sessionKeys.clear();
}

// Get session keys
export function getSessionKeys(): { openRouterKey: string; serperKey?: string; githubApiKey?: string; redditApiKey?: string } | null {
  if (sessionKeys.size === 0) return null;

  return {
    openRouterKey: sessionKeys.get('openRouterKey') || '',
    serperKey: sessionKeys.get('serperKey'),
    githubApiKey: sessionKeys.get('githubApiKey'),
    redditApiKey: sessionKeys.get('redditApiKey'),
  };
}

// Delete vault
export function deleteVault(): void {
  localStorage.removeItem(VAULT_KEY);
  localStorage.removeItem('council_vault_v18'); // clean up old version too
  sessionKeys.clear();
}
