// Secure Vault service for API key storage
// Uses AES-256-GCM via Web Crypto API with PBKDF2 key derivation

const VAULT_KEY = 'council_vault_v20';
const OLD_VAULT_KEYS = ['council_vault_v18', 'council_vault_v19'];
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
const PBKDF2_ITERATIONS = 600_000; // OWASP 2023 recommendation

// Module-level session store (not sessionStorage)
const sessionMap = new Map<string, SessionData>();
const SESSION_ID = 'default';

interface SessionData {
  openRouterKey: string;
  serperKey?: string;
  githubApiKey?: string;
  redditApiKey?: string;
  unlockTime: number;
}

export interface VaultStatus {
  hasVault: boolean;
  isLocked: boolean;
}

// Derive encryption key from password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
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
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data with AES-256-GCM
async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  // Bundle: salt(16) + iv(12) + ciphertext
  const bundle = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  bundle.set(salt, 0);
  bundle.set(iv, salt.length);
  bundle.set(new Uint8Array(ciphertext), salt.length + iv.length);
  // Store as hex string (not base64)
  return Array.from(bundle).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Decrypt data with AES-256-GCM
async function decrypt(hexString: string, password: string): Promise<string> {
  const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const ciphertext = bytes.slice(28);
  const key = await deriveKey(password, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plainBuffer);
}

// Clean up old vault versions
function cleanupOldVaults(): void {
  for (const key of OLD_VAULT_KEYS) {
    localStorage.removeItem(key);
  }
  // Also clean old session storage entries
  try {
    sessionStorage.removeItem('council_session_v18');
    sessionStorage.removeItem('council_session_v19');
  } catch (e) {
    console.warn('Failed to clean old session storage entries:', e);
  }
}

// Initialize vault status
export function initializeVault(): VaultStatus {
  cleanupOldVaults();
  const vault = localStorage.getItem(VAULT_KEY);

  if (!vault) {
    return { hasVault: false, isLocked: true };
  }

  const session = sessionMap.get(SESSION_ID);
  if (!session) {
    return { hasVault: true, isLocked: true };
  }

  const now = Date.now();
  if (now - session.unlockTime > SESSION_TIMEOUT) {
    sessionMap.delete(SESSION_ID);
    return { hasVault: true, isLocked: true };
  }

  return { hasVault: true, isLocked: false };
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
    cleanupOldVaults();

    const keysToStore = JSON.stringify({
      openRouterKey: data.openRouterKey,
      serperKey: data.serperKey || '',
      githubApiKey: data.githubApiKey || '',
      redditApiKey: data.redditApiKey || '',
    });

    const encrypted = await encrypt(keysToStore, data.password);
    localStorage.setItem(VAULT_KEY, encrypted);

    // Auto-unlock after creation (stored in module Map, not sessionStorage)
    sessionMap.set(SESSION_ID, {
      openRouterKey: data.openRouterKey,
      serperKey: data.serperKey,
      githubApiKey: data.githubApiKey,
      redditApiKey: data.redditApiKey,
      unlockTime: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to create vault:', error);
    return { success: false, error: 'Failed to create vault' };
  }
}

// Unlock vault
export async function unlockVault(password: string): Promise<{ success: boolean; error?: string; keys?: { openRouterKey: string; serperKey?: string; githubApiKey?: string; redditApiKey?: string } }> {
  try {
    const vaultStr = localStorage.getItem(VAULT_KEY);
    if (!vaultStr) {
      return { success: false, error: 'No vault found' };
    }

    const decrypted = await decrypt(vaultStr, password);
    const keys = JSON.parse(decrypted);

    sessionMap.set(SESSION_ID, {
      openRouterKey: keys.openRouterKey,
      serperKey: keys.serperKey,
      githubApiKey: keys.githubApiKey,
      redditApiKey: keys.redditApiKey,
      unlockTime: Date.now(),
    });

    return {
      success: true,
      keys: {
        openRouterKey: keys.openRouterKey,
        serperKey: keys.serperKey,
        githubApiKey: keys.githubApiKey,
        redditApiKey: keys.redditApiKey,
      },
    };
  } catch (error) {
    console.error('Failed to unlock vault:', error);
    return { success: false, error: 'Invalid password' };
  }
}

// Lock vault
export function lockVault(): void {
  sessionMap.delete(SESSION_ID);
}

// Get session keys
export function getSessionKeys(): { openRouterKey: string; serperKey?: string; githubApiKey?: string; redditApiKey?: string } | null {
  const session = sessionMap.get(SESSION_ID);
  if (!session) return null;

  const now = Date.now();
  if (now - session.unlockTime > SESSION_TIMEOUT) {
    sessionMap.delete(SESSION_ID);
    return null;
  }

  // Refresh session
  session.unlockTime = now;

  return {
    openRouterKey: session.openRouterKey,
    serperKey: session.serperKey,
    githubApiKey: session.githubApiKey,
    redditApiKey: session.redditApiKey,
  };
}

// Delete vault
export function deleteVault(): void {
  localStorage.removeItem(VAULT_KEY);
  sessionMap.delete(SESSION_ID);
  cleanupOldVaults();
}
