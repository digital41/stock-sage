// ============================================
// SERVICE STOCK SAGE 100 - LECTURE SEULE
// ============================================

import {
  getSqlPool,
  sql,
  SAGE_TABLES,
  getCached,
  setCache,
  clearCache,
  getCacheStats,
  isSageConfigValid
} from '@/lib/sage-db';
import {
  ArticleWithStock,
  ArticleDetail,
  Depot,
  DepotWithStats,
  StockDepot,
  DepotStockItem,
  PaginatedResponse,
  ArticleFilters,
  DepotStockFilters,
} from '@/types';

// Familles à exclure de l'affichage par intitulé (KLY GROUPE)
const EXCLUDED_FAMILLES_INTITULE = [
  'Bazar',
  'Confiserie bonbon TVA 20%',
  'Confiserie Choc TVA 5,50%',
  'Conserves',
  'Divers',
  'Éco-participations',
  'Épices',
  'Féculents',
  'Fruits secs',
  'GTB',
  'Liquide',
  'Parfumerie',
  'Prestations diverses',
  'Produits médicaux',
  'Sucres',
  'Textile',
  'Thés',
  'TVA',
];

// Familles à exclure par code (KLY GROUPE)
const EXCLUDED_FAMILLES_CODE = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '10', '11', '12', '13', '14', '16',
  '26', '27',
  'ZZ',
];

// Génère la clause SQL pour exclure les familles (par intitulé ET par code)
function getExcludedFamillesClause(tableAlias: string = 'F'): string {
  const intituleConditions = EXCLUDED_FAMILLES_INTITULE.map(f => `${tableAlias}.FA_Intitule != '${f.replace(/'/g, "''")}'`);
  const codeConditions = EXCLUDED_FAMILLES_CODE.map(c => `${tableAlias}.FA_CodeFamille != '${c}'`);
  return [...intituleConditions, ...codeConditions].join(' AND ');
}

// Dépôts à exclure de l'affichage (KLY GROUPE)
const EXCLUDED_DEPOTS = [
  'A jeter',
  'BG GROUPE',
  'CGL TRANSPORT',
  'DEPOT DE RETOUR',
  'ERLEC ENERGIE',
  'FM CMGT/ SAGATRANS',
  'GEODIS',
  'HEPPNER_VATINEL',
  'KLY ANCIEN',
  'KLY ATTENTE CONDITIONNEMENT',
  'KLY CONTROLE SANITAIRE',
  'KLY GROUPE SECONDAIRE',
  'KLY HORS WMS',
  'KLY KLYTOON',
  'LIVRAISON DIRECT',
  'MRBA TRANSPORT',
  'NE PAS UTILISER',
  'PLD EUROPE',
  'SAV',
  'TCL',
  'TCL GD',
  'TRANSIT PHOCEEN',
];

// Génère la clause SQL pour exclure les dépôts
function getExcludedDepotsClause(tableAlias: string = 'D'): string {
  const conditions = EXCLUDED_DEPOTS.map(d => `${tableAlias}.DE_Intitule != '${d.replace(/'/g, "''")}'`);
  return conditions.join(' AND ');
}

export const SageStockService = {
  // ============================================
  // DISPONIBILITE
  // ============================================

  async isAvailable(): Promise<boolean> {
    if (!isSageConfigValid()) return false;
    try {
      const pool = await getSqlPool();
      return pool !== null;
    } catch {
      return false;
    }
  },

  getCacheStats,
  clearCache,

  // ============================================
  // DEPOTS
  // ============================================

  async getDepots(): Promise<Depot[]> {
    const cacheKey = 'depots:all';
    const cached = getCached<Depot[]>(cacheKey);
    if (cached) return cached;

    try {
      const pool = await getSqlPool();
      if (!pool) return [];

      const result = await pool.request().query(`
        SELECT
          DE_No as code,
          DE_Intitule as intitule,
          DE_Adresse as adresse,
          DE_CodePostal as codePostal,
          DE_Ville as ville,
          CASE WHEN DE_Principal = 1 THEN 1 ELSE 0 END as principal
        FROM ${SAGE_TABLES.DEPOT} D WITH (NOLOCK)
        WHERE DE_No > 0 AND ${getExcludedDepotsClause('D')}
        ORDER BY DE_Principal DESC, DE_Intitule
      `);

      const depots: Depot[] = result.recordset.map((row) => ({
        code: row.code,
        intitule: row.intitule ? String(row.intitule).trim() : `Dépôt ${row.code}`,
        adresse: row.adresse ? String(row.adresse).trim() : undefined,
        codePostal: row.codePostal ? String(row.codePostal).trim() : undefined,
        ville: row.ville ? String(row.ville).trim() : undefined,
        principal: row.principal === 1,
      }));

      setCache(cacheKey, depots);
      return depots;
    } catch (error) {
      console.error('[SAGE] Erreur getDepots:', error instanceof Error ? error.message : 'Erreur');
      return [];
    }
  },

  async getDepotsWithStats(): Promise<DepotWithStats[]> {
    const cacheKey = 'depots:stats';
    const cached = getCached<DepotWithStats[]>(cacheKey);
    if (cached) return cached;

    try {
      const pool = await getSqlPool();
      if (!pool) return [];

      // Sous-requête pour compter les articles actifs avec stock > 0 et hors familles exclues
      const result = await pool.request().query(`
        SELECT
          D.DE_No as code,
          D.DE_Intitule as intitule,
          D.DE_Adresse as adresse,
          D.DE_CodePostal as codePostal,
          D.DE_Ville as ville,
          CASE WHEN D.DE_Principal = 1 THEN 1 ELSE 0 END as principal,
          COALESCE(Stats.nombreArticles, 0) as nombreArticles,
          COALESCE(Stats.valeurStock, 0) as valeurStock
        FROM ${SAGE_TABLES.DEPOT} D WITH (NOLOCK)
        LEFT JOIN (
          SELECT
            S.DE_No,
            COUNT(DISTINCT S.AR_Ref) as nombreArticles,
            SUM(S.AS_QteSto * A.AR_PrixVen) as valeurStock
          FROM ${SAGE_TABLES.ARTSTOCK} S WITH (NOLOCK)
          INNER JOIN ${SAGE_TABLES.ARTICLE} A WITH (NOLOCK) ON S.AR_Ref = A.AR_Ref
          LEFT JOIN ${SAGE_TABLES.FAMILLE} F WITH (NOLOCK) ON A.FA_CodeFamille = F.FA_CodeFamille
          WHERE A.AR_Sommeil = 0 AND S.AS_QteSto > 0 AND ${getExcludedFamillesClause('F')}
          GROUP BY S.DE_No
        ) Stats ON D.DE_No = Stats.DE_No
        WHERE D.DE_No > 0 AND ${getExcludedDepotsClause('D')}
        ORDER BY D.DE_Principal DESC, D.DE_Intitule
      `);

      const depots: DepotWithStats[] = result.recordset.map((row) => ({
        code: row.code,
        intitule: row.intitule ? String(row.intitule).trim() : `Dépôt ${row.code}`,
        adresse: row.adresse ? String(row.adresse).trim() : undefined,
        codePostal: row.codePostal ? String(row.codePostal).trim() : undefined,
        ville: row.ville ? String(row.ville).trim() : undefined,
        principal: row.principal === 1,
        nombreArticles: row.nombreArticles || 0,
        valeurStock: row.valeurStock || 0,
      }));

      setCache(cacheKey, depots);
      return depots;
    } catch (error) {
      console.error('[SAGE] Erreur getDepotsWithStats:', error instanceof Error ? error.message : 'Erreur');
      return [];
    }
  },

  async getDepotByCode(code: number): Promise<Depot | null> {
    const depots = await this.getDepots();
    return depots.find(d => d.code === code) || null;
  },

  // ============================================
  // ARTICLES AVEC STOCK
  // ============================================

  async getArticlesWithStock(filters: ArticleFilters = {}): Promise<PaginatedResponse<ArticleWithStock>> {
    const { search = '', famille, hasStock, gennevilliersOnly, lowStockOnly, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const cacheKey = `articles:${search}:${famille || ''}:${hasStock}:${gennevilliersOnly}:${lowStockOnly}:${page}:${limit}`;
    const cached = getCached<PaginatedResponse<ArticleWithStock>>(cacheKey);
    if (cached) return cached;

    try {
      const pool = await getSqlPool();
      if (!pool) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }

      // Subquery pour le stock - filtré par dépôt si gennevilliersOnly
      // Inclut AS_QteMini pour détecter le stock bas (toujours basé sur KLY Gennevilliers)
      const stockSubquery = gennevilliersOnly
        ? `SELECT S.AR_Ref,
             SUM(S.AS_QteSto) as StockTotal,
             SUM(S.AS_QtePrepa) as StockPrepare,
             SUM(S.AS_QteMini) as StockMiniTotal,
             MAX(S.AS_QteMini) as SeuilMiniGennevilliers,
             MAX(CASE WHEN S.AS_QteMini > 0 AND S.AS_QteSto > 0 AND S.AS_QteSto <= S.AS_QteMini THEN 1 ELSE 0 END) as HasLowStock
           FROM ${SAGE_TABLES.ARTSTOCK} S WITH (NOLOCK)
           INNER JOIN ${SAGE_TABLES.DEPOT} D WITH (NOLOCK) ON S.DE_No = D.DE_No
           WHERE UPPER(D.DE_Intitule) LIKE '%KLY GENNEVILLIERS%'
           GROUP BY S.AR_Ref`
        : `SELECT S.AR_Ref,
             SUM(S.AS_QteSto) as StockTotal,
             SUM(S.AS_QtePrepa) as StockPrepare,
             SUM(S.AS_QteMini) as StockMiniTotal,
             G.SeuilMiniGennevilliers,
             G.HasLowStock
           FROM ${SAGE_TABLES.ARTSTOCK} S WITH (NOLOCK)
           INNER JOIN ${SAGE_TABLES.DEPOT} D WITH (NOLOCK) ON S.DE_No = D.DE_No
           LEFT JOIN (
             SELECT S2.AR_Ref,
               MAX(S2.AS_QteMini) as SeuilMiniGennevilliers,
               MAX(CASE WHEN S2.AS_QteMini > 0 AND S2.AS_QteSto > 0 AND S2.AS_QteSto <= S2.AS_QteMini THEN 1 ELSE 0 END) as HasLowStock
             FROM ${SAGE_TABLES.ARTSTOCK} S2 WITH (NOLOCK)
             INNER JOIN ${SAGE_TABLES.DEPOT} D2 WITH (NOLOCK) ON S2.DE_No = D2.DE_No
             WHERE UPPER(D2.DE_Intitule) LIKE '%KLY GENNEVILLIERS%'
             GROUP BY S2.AR_Ref
           ) G ON S.AR_Ref = G.AR_Ref
           WHERE ${getExcludedDepotsClause('D')}
           GROUP BY S.AR_Ref, G.SeuilMiniGennevilliers, G.HasLowStock`;

      // Subquery pour le count - stock bas toujours basé sur KLY Gennevilliers
      const stockCountSubquery = gennevilliersOnly
        ? `SELECT S.AR_Ref,
             SUM(S.AS_QteSto) as StockTotal,
             MAX(CASE WHEN S.AS_QteMini > 0 AND S.AS_QteSto > 0 AND S.AS_QteSto <= S.AS_QteMini THEN 1 ELSE 0 END) as HasLowStock
           FROM ${SAGE_TABLES.ARTSTOCK} S WITH (NOLOCK)
           INNER JOIN ${SAGE_TABLES.DEPOT} D WITH (NOLOCK) ON S.DE_No = D.DE_No
           WHERE UPPER(D.DE_Intitule) LIKE '%KLY GENNEVILLIERS%'
           GROUP BY S.AR_Ref`
        : `SELECT S.AR_Ref,
             SUM(S.AS_QteSto) as StockTotal,
             G.HasLowStock
           FROM ${SAGE_TABLES.ARTSTOCK} S WITH (NOLOCK)
           INNER JOIN ${SAGE_TABLES.DEPOT} D WITH (NOLOCK) ON S.DE_No = D.DE_No
           LEFT JOIN (
             SELECT S2.AR_Ref,
               MAX(CASE WHEN S2.AS_QteMini > 0 AND S2.AS_QteSto > 0 AND S2.AS_QteSto <= S2.AS_QteMini THEN 1 ELSE 0 END) as HasLowStock
             FROM ${SAGE_TABLES.ARTSTOCK} S2 WITH (NOLOCK)
             INNER JOIN ${SAGE_TABLES.DEPOT} D2 WITH (NOLOCK) ON S2.DE_No = D2.DE_No
             WHERE UPPER(D2.DE_Intitule) LIKE '%KLY GENNEVILLIERS%'
             GROUP BY S2.AR_Ref
           ) G ON S.AR_Ref = G.AR_Ref
           WHERE ${getExcludedDepotsClause('D')}
           GROUP BY S.AR_Ref, G.HasLowStock`;

      // Construction WHERE (avec exclusion des familles non désirées)
      let whereClause = `WHERE A.AR_Sommeil = 0 AND ${getExcludedFamillesClause('F')}`;
      const request = pool.request();

      if (search) {
        whereClause += ` AND (A.AR_Ref LIKE @search OR A.AR_Design LIKE @search)`;
        request.input('search', sql.NVarChar, `%${search}%`);
      }

      if (famille) {
        whereClause += ' AND A.FA_CodeFamille = @famille';
        request.input('famille', sql.NVarChar, famille);
      }

      if (hasStock || gennevilliersOnly) {
        whereClause += ' AND COALESCE(StockTotal, 0) > 0';
      }

      // Filtre stock bas: articles avec au moins un dépôt en stock bas
      if (lowStockOnly) {
        whereClause += ' AND COALESCE(HasLowStock, 0) = 1';
      }

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${SAGE_TABLES.ARTICLE} A WITH (NOLOCK)
        LEFT JOIN ${SAGE_TABLES.FAMILLE} F WITH (NOLOCK) ON A.FA_CodeFamille = F.FA_CodeFamille
        LEFT JOIN (${stockCountSubquery}) S ON A.AR_Ref = S.AR_Ref
        ${whereClause}
      `;

      const countResult = await request.query(countQuery);
      const total = countResult.recordset[0]?.total || 0;

      if (total === 0) {
        const emptyResult = { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
        setCache(cacheKey, emptyResult);
        return emptyResult;
      }

      // Get articles
      const request2 = pool.request();
      if (search) request2.input('search', sql.NVarChar, `%${search}%`);
      if (famille) request2.input('famille', sql.NVarChar, famille);
      request2.input('offset', sql.Int, offset);
      request2.input('limit', sql.Int, limit);

      const articlesQuery = `
        SELECT
          A.AR_Ref as reference,
          A.AR_Design as designation,
          A.FA_CodeFamille as famille,
          A.AR_PrixAch as prixAchat,
          A.AR_PrixVen as prixVente,
          A.AR_UniteVen as unite,
          COALESCE(S.StockTotal, 0) as stockTotal,
          COALESCE(S.StockPrepare, 0) as stockPrepare,
          COALESCE(S.StockMiniTotal, 0) as stockMiniTotal,
          COALESCE(S.SeuilMiniGennevilliers, 0) as seuilMiniGennevilliers,
          COALESCE(S.HasLowStock, 0) as hasLowStock
        FROM ${SAGE_TABLES.ARTICLE} A WITH (NOLOCK)
        LEFT JOIN ${SAGE_TABLES.FAMILLE} F WITH (NOLOCK) ON A.FA_CodeFamille = F.FA_CodeFamille
        LEFT JOIN (${stockSubquery}) S ON A.AR_Ref = S.AR_Ref
        ${whereClause}
        ORDER BY A.cbCreation DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;

      const articlesResult = await request2.query(articlesQuery);

      const articles: ArticleWithStock[] = articlesResult.recordset.map((row) => {
        const stockTotal = row.stockTotal || 0;
        const stockPrepare = row.stockPrepare || 0;
        const stockMiniTotal = row.stockMiniTotal || 0;
        const seuilMiniGennevilliers = row.seuilMiniGennevilliers || 0;
        const hasLowStock = row.hasLowStock === 1;

        // Calcul du niveau de stock basé sur AS_QteMini
        let niveauStock: import('@/types').StockLevel;
        if (stockTotal === 0) {
          niveauStock = 'rupture';
        } else if (hasLowStock) {
          niveauStock = 'bas';
        } else if (stockMiniTotal > 0 && stockTotal > stockMiniTotal * 3) {
          niveauStock = 'surplus';
        } else {
          niveauStock = 'normal';
        }

        return {
          reference: String(row.reference || '').trim(),
          designation: String(row.designation || '').trim(),
          famille: String(row.famille || '').trim(),
          prixAchat: row.prixAchat || 0,
          prixVente: row.prixVente || 0,
          unite: String(row.unite || 'PCE').trim(),
          actif: true,
          stockTotal,
          stockReserve: stockPrepare,
          stockDisponible: stockTotal - stockPrepare,
          niveauStock,
          seuilMini: seuilMiniGennevilliers > 0 ? seuilMiniGennevilliers : undefined,
        };
      });

      const result: PaginatedResponse<ArticleWithStock> = {
        data: articles,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[SAGE] Erreur getArticlesWithStock:', error instanceof Error ? error.message : 'Erreur');
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  },

  // ============================================
  // DETAIL ARTICLE
  // ============================================

  async getArticleDetail(reference: string): Promise<ArticleDetail | null> {
    if (!reference) return null;

    const cacheKey = `article:detail:${reference}`;
    const cached = getCached<ArticleDetail>(cacheKey);
    if (cached) return cached;

    try {
      const pool = await getSqlPool();
      if (!pool) return null;

      // Article de base
      const articleResult = await pool
        .request()
        .input('ref', sql.NVarChar, reference)
        .query(`
          SELECT
            A.AR_Ref as reference,
            A.AR_Design as designation,
            A.FA_CodeFamille as famille,
            F.FA_Intitule as familleIntitule,
            A.AR_PrixAch as prixAchat,
            A.AR_PrixVen as prixVente,
            A.AR_UniteVen as unite,
            CASE WHEN A.AR_Sommeil = 0 THEN 1 ELSE 0 END as actif
          FROM ${SAGE_TABLES.ARTICLE} A WITH (NOLOCK)
          LEFT JOIN ${SAGE_TABLES.FAMILLE} F WITH (NOLOCK) ON A.FA_CodeFamille = F.FA_CodeFamille
          WHERE A.AR_Ref = @ref
        `);

      if (articleResult.recordset.length === 0) return null;

      const row = articleResult.recordset[0];

      // Dernier prix d'achat depuis les documents d'achat (DO_Type 12, 13, 14, 17, 23)
      // 12=Commande fournisseur, 13=Bon de livraison fournisseur, 14=Bon de retour fournisseur
      // 17=Facture fournisseur, 23=Bon de réception
      const dernierPrixResult = await pool
        .request()
        .input('ref', sql.NVarChar, reference)
        .query(`
          SELECT TOP 1 DL_PrixUnitaire as dernierPrixAchat
          FROM F_DOCLIGNE WITH (NOLOCK)
          WHERE AR_Ref = @ref AND DO_Type IN (12, 13, 14, 17, 23) AND DL_PrixUnitaire > 0
          ORDER BY DL_DateBL DESC
        `);

      const dernierPrixAchat = dernierPrixResult.recordset.length > 0
        ? dernierPrixResult.recordset[0].dernierPrixAchat
        : null;

      // Stock par dépôt
      const stockResult = await pool
        .request()
        .input('ref', sql.NVarChar, reference)
        .query(`
          SELECT
            S.DE_No as depotCode,
            D.DE_Intitule as depotIntitule,
            COALESCE(S.AS_QteSto, 0) as quantite,
            COALESCE(S.AS_QtePrepa, 0) as quantitePreparee,
            COALESCE(S.AS_QteMini, 0) as stockMini
          FROM ${SAGE_TABLES.ARTSTOCK} S WITH (NOLOCK)
          INNER JOIN ${SAGE_TABLES.DEPOT} D WITH (NOLOCK) ON S.DE_No = D.DE_No
          WHERE S.AR_Ref = @ref AND D.DE_No > 0 AND ${getExcludedDepotsClause('D')}
          ORDER BY D.DE_Principal DESC, D.DE_Intitule
        `);

      const stockParDepot: StockDepot[] = stockResult.recordset.map((s) => ({
        depotCode: s.depotCode,
        depotIntitule: s.depotIntitule ? String(s.depotIntitule).trim() : `Dépôt ${s.depotCode}`,
        quantite: s.quantite || 0,
        quantiteReservee: s.quantitePreparee || 0,
        disponible: (s.quantite || 0) - (s.quantitePreparee || 0),
        stockMini: s.stockMini || 0,
      }));

      const stockTotal = stockParDepot.reduce((sum, s) => sum + s.quantite, 0);
      const stockReserve = stockParDepot.reduce((sum, s) => sum + s.quantiteReservee, 0);

      // Stock bas basé uniquement sur KLY Gennevilliers
      const klyGennevilliers = stockParDepot.find(s => s.depotIntitule.toUpperCase().includes('KLY GENNEVILLIERS'));
      const hasLowStock = klyGennevilliers
        ? klyGennevilliers.stockMini > 0 && klyGennevilliers.quantite > 0 && klyGennevilliers.quantite <= klyGennevilliers.stockMini
        : false;

      // Calcul du niveau de stock basé sur AS_QteMini de KLY Gennevilliers
      let niveauStock: import('@/types').StockLevel;
      if (stockTotal === 0) {
        niveauStock = 'rupture';
      } else if (hasLowStock) {
        niveauStock = 'bas';
      } else if (klyGennevilliers && klyGennevilliers.stockMini > 0 && klyGennevilliers.quantite > klyGennevilliers.stockMini * 3) {
        niveauStock = 'surplus';
      } else {
        niveauStock = 'normal';
      }

      const article: ArticleDetail = {
        reference: String(row.reference || '').trim(),
        designation: String(row.designation || '').trim(),
        famille: String(row.famille || '').trim(),
        familleIntitule: row.familleIntitule ? String(row.familleIntitule).trim() : undefined,
        prixAchat: dernierPrixAchat && dernierPrixAchat > 0 ? dernierPrixAchat : (row.prixAchat || 0),
        prixVente: row.prixVente || 0,
        unite: String(row.unite || 'PCE').trim(),
        actif: row.actif === 1,
        stockTotal,
        stockReserve,
        stockDisponible: stockTotal - stockReserve,
        niveauStock,
        stockParDepot,
      };

      setCache(cacheKey, article);
      return article;
    } catch (error) {
      console.error('[SAGE] Erreur getArticleDetail:', error instanceof Error ? error.message : 'Erreur');
      return null;
    }
  },

  // ============================================
  // STOCK PAR DEPOT
  // ============================================

  async getDepotStock(depotCode: number, filters: DepotStockFilters = {}): Promise<PaginatedResponse<DepotStockItem>> {
    const { search = '', hasStock = true, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const cacheKey = `depot:${depotCode}:stock:${search}:${hasStock}:${page}:${limit}`;
    const cached = getCached<PaginatedResponse<DepotStockItem>>(cacheKey);
    if (cached) return cached;

    try {
      const pool = await getSqlPool();
      if (!pool) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }

      let whereClause = `WHERE S.DE_No = @depotCode AND A.AR_Sommeil = 0 AND ${getExcludedFamillesClause('F')}`;
      const request = pool.request();
      request.input('depotCode', sql.Int, depotCode);

      if (search) {
        whereClause += ` AND (A.AR_Ref LIKE @search OR A.AR_Design LIKE @search)`;
        request.input('search', sql.NVarChar, `%${search}%`);
      }

      if (hasStock) {
        whereClause += ' AND S.AS_QteSto > 0';
      }

      // Count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${SAGE_TABLES.ARTSTOCK} S WITH (NOLOCK)
        INNER JOIN ${SAGE_TABLES.ARTICLE} A WITH (NOLOCK) ON S.AR_Ref = A.AR_Ref
        LEFT JOIN ${SAGE_TABLES.FAMILLE} F WITH (NOLOCK) ON A.FA_CodeFamille = F.FA_CodeFamille
        ${whereClause}
      `;

      const countResult = await request.query(countQuery);
      const total = countResult.recordset[0]?.total || 0;

      if (total === 0) {
        const emptyResult = { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
        setCache(cacheKey, emptyResult);
        return emptyResult;
      }

      // Get stock items
      const request2 = pool.request();
      request2.input('depotCode', sql.Int, depotCode);
      if (search) request2.input('search', sql.NVarChar, `%${search}%`);
      request2.input('offset', sql.Int, offset);
      request2.input('limit', sql.Int, limit);

      const stockQuery = `
        SELECT
          A.AR_Ref as reference,
          A.AR_Design as designation,
          A.FA_CodeFamille as famille,
          A.AR_PrixVen as prixVente,
          S.AS_QteSto as quantite,
          COALESCE(S.AS_QtePrepa, 0) as quantitePreparee
        FROM ${SAGE_TABLES.ARTSTOCK} S WITH (NOLOCK)
        INNER JOIN ${SAGE_TABLES.ARTICLE} A WITH (NOLOCK) ON S.AR_Ref = A.AR_Ref
        LEFT JOIN ${SAGE_TABLES.FAMILLE} F WITH (NOLOCK) ON A.FA_CodeFamille = F.FA_CodeFamille
        ${whereClause}
        ORDER BY A.AR_Ref
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;

      const stockResult = await request2.query(stockQuery);

      const items: DepotStockItem[] = stockResult.recordset.map((row) => ({
        article: {
          reference: String(row.reference || '').trim(),
          designation: String(row.designation || '').trim(),
          famille: String(row.famille || '').trim(),
        },
        quantite: row.quantite || 0,
        quantiteReservee: row.quantitePreparee || 0,
        disponible: (row.quantite || 0) - (row.quantitePreparee || 0),
        prixVente: row.prixVente || 0,
      }));

      const result: PaginatedResponse<DepotStockItem> = {
        data: items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[SAGE] Erreur getDepotStock:', error instanceof Error ? error.message : 'Erreur');
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  },

  // ============================================
  // FAMILLES
  // ============================================

  async getFamilles(): Promise<Array<{ code: string; intitule: string }>> {
    const cacheKey = 'familles:all';
    const cached = getCached<Array<{ code: string; intitule: string }>>(cacheKey);
    if (cached) return cached;

    try {
      const pool = await getSqlPool();
      if (!pool) return [];

      const result = await pool.request().query(`
        SELECT DISTINCT
          FA_CodeFamille as code,
          FA_Intitule as intitule
        FROM ${SAGE_TABLES.FAMILLE} F WITH (NOLOCK)
        WHERE FA_CodeFamille IS NOT NULL
          AND FA_CodeFamille != ''
          AND ${getExcludedFamillesClause('F')}
        ORDER BY FA_Intitule
      `);

      const familles = result.recordset.map((row) => ({
        code: String(row.code || '').trim(),
        intitule: row.intitule ? String(row.intitule).trim() : String(row.code || '').trim(),
      }));

      setCache(cacheKey, familles);
      return familles;
    } catch (error) {
      console.error('[SAGE] Erreur getFamilles:', error instanceof Error ? error.message : 'Erreur');
      return [];
    }
  },
};

export default SageStockService;
