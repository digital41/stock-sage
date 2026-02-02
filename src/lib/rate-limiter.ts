// ============================================
// RATE LIMITER - Protection anti-robot
// ============================================

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil: number;
}

// Stockage en memoire (en production, utiliser Redis)
const loginAttempts = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5; // Nombre max de tentatives
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes de blocage
const PROGRESSIVE_DELAY_MS = 2000; // 2 secondes de delai par tentative

// Nettoyer les entrees expirees toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts.entries()) {
    if (entry.blockedUntil < now && now - entry.lastAttempt > BLOCK_DURATION) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil?: number;
  delayMs: number;
  message?: string;
}

/**
 * Verifie si une tentative de connexion est autorisee
 * @param identifier - Email ou IP de l'utilisateur
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const key = identifier.toLowerCase();
  const entry = loginAttempts.get(key);

  // Premiere tentative
  if (!entry) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      delayMs: 0,
    };
  }

  // Verifier si bloque
  if (entry.blockedUntil > now) {
    const remainingSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: entry.blockedUntil,
      delayMs: 0,
      message: `Trop de tentatives. Reessayez dans ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
    };
  }

  // Calculer le delai progressif
  const delayMs = entry.attempts * PROGRESSIVE_DELAY_MS;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - entry.attempts);

  return {
    allowed: remainingAttempts > 0,
    remainingAttempts,
    delayMs,
    message: remainingAttempts <= 2 ? `Attention: ${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}` : undefined,
  };
}

/**
 * Enregistre une tentative de connexion echouee
 * @param identifier - Email ou IP de l'utilisateur
 */
export function recordFailedAttempt(identifier: string): RateLimitResult {
  const now = Date.now();
  const key = identifier.toLowerCase();
  const entry = loginAttempts.get(key);

  if (!entry) {
    loginAttempts.set(key, {
      attempts: 1,
      lastAttempt: now,
      blockedUntil: 0,
    });
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - 1,
      delayMs: PROGRESSIVE_DELAY_MS,
    };
  }

  entry.attempts += 1;
  entry.lastAttempt = now;

  // Bloquer si trop de tentatives
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION;
    const remainingMinutes = Math.ceil(BLOCK_DURATION / 60000);
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: entry.blockedUntil,
      delayMs: 0,
      message: `Compte bloque pendant ${remainingMinutes} minutes suite a trop de tentatives.`,
    };
  }

  const remainingAttempts = MAX_ATTEMPTS - entry.attempts;
  return {
    allowed: true,
    remainingAttempts,
    delayMs: entry.attempts * PROGRESSIVE_DELAY_MS,
    message: remainingAttempts <= 2 ? `Attention: ${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}` : undefined,
  };
}

/**
 * Reinitialise les tentatives apres une connexion reussie
 * @param identifier - Email ou IP de l'utilisateur
 */
export function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier.toLowerCase());
}

/**
 * Valide la force d'un mot de passe
 * @param password - Mot de passe a valider
 * @returns Message d'erreur ou null si valide
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une majuscule';
  }
  if (!/[a-z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une minuscule';
  }
  if (!/[0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins un chiffre';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Le mot de passe doit contenir au moins un caractere special (!@#$%^&*...)';
  }
  return null;
}
