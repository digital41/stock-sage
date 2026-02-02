// ============================================
// CONNEXION SQL SERVER - SAGE 100
// ============================================
// Lecture seule - Utilise WITH (NOLOCK) pour ne pas bloquer SAGE

import sql from 'mssql';

// Configuration
interface SageConfig {
  enabled: boolean;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  connectionTimeout: number;
  requestTimeout: number;
  cacheEnabled: boolean;
  cacheTTLMinutes: number;
}

export const sageConfig: SageConfig = {
  enabled: process.env.SAGE_ENABLED === 'true',
  host: process.env.SAGE_HOST || 'localhost',
  port: parseInt(process.env.SAGE_PORT || '1433', 10),
  database: process.env.SAGE_DATABASE || '',
  user: process.env.SAGE_USER || '',
  password: process.env.SAGE_PASSWORD || '',
  connectionTimeout: parseInt(process.env.SAGE_CONNECTION_TIMEOUT || '5000', 10),
  requestTimeout: parseInt(process.env.SAGE_REQUEST_TIMEOUT || '10000', 10),
  cacheEnabled: process.env.SAGE_CACHE_ENABLED !== 'false',
  cacheTTLMinutes: parseInt(process.env.SAGE_CACHE_TTL || '30', 10),
};

// Tables SAGE 100
export const SAGE_TABLES = {
  ARTICLE: 'F_ARTICLE',
  ARTSTOCK: 'F_ARTSTOCK',
  DEPOT: 'F_DEPOT',
  FAMILLE: 'F_FAMILLE',
} as const;

// Vérification de la configuration
export function isSageConfigValid(): boolean {
  if (!sageConfig.enabled) return false;
  if (!sageConfig.host || !sageConfig.database) return false;
  if (!sageConfig.user || !sageConfig.password) return false;
  return true;
}

// Pool de connexion (singleton)
let pool: sql.ConnectionPool | null = null;

export async function getSqlPool(): Promise<sql.ConnectionPool | null> {
  if (!isSageConfigValid()) {
    console.warn('[SAGE] Configuration invalide ou désactivée');
    return null;
  }

  if (pool) {
    return pool;
  }

  try {
    const config: sql.config = {
      server: sageConfig.host,
      port: sageConfig.port,
      database: sageConfig.database,
      user: sageConfig.user,
      password: sageConfig.password,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: sageConfig.connectionTimeout,
        requestTimeout: sageConfig.requestTimeout,
      },
      pool: {
        max: 5,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    pool = await new sql.ConnectionPool(config).connect();
    console.log('[SAGE] Connexion SQL Server établie');

    pool.on('error', (err) => {
      console.error('[SAGE] Erreur pool:', err.message);
      pool = null;
    });

    return pool;
  } catch (error) {
    console.error('[SAGE] Erreur connexion:', error instanceof Error ? error.message : 'Erreur inconnue');
    return null;
  }
}

// Cache simple en mémoire
const cache = new Map<string, { data: unknown; expires: number }>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  if (!sageConfig.cacheEnabled) return;
  const ttl = sageConfig.cacheTTLMinutes * 60 * 1000;
  cache.set(key, { data, expires: Date.now() + ttl });
}

export function clearCache(): void {
  cache.clear();
  console.log('[SAGE] Cache vidé');
}

export function getCacheStats(): { size: number; enabled: boolean } {
  return {
    size: cache.size,
    enabled: sageConfig.cacheEnabled,
  };
}

// Export sql pour les types
export { sql };
