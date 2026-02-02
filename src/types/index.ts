// ============================================
// TYPES - Application Stock Sage 100
// ============================================

// Niveau de stock
export type StockLevel = 'rupture' | 'bas' | 'normal' | 'surplus';

// ============================================
// ARTICLES
// ============================================

export interface Article {
  reference: string;        // AR_Ref
  designation: string;      // AR_Design
  famille: string;          // FA_CodeFamille
  familleIntitule?: string; // FA_Intitule
  prixAchat: number;        // AR_PrixAch
  prixVente: number;        // AR_PrixVen
  unite: string;            // AR_UniteVen
  codeBarres?: string;      // AR_CodeBarre
  poids?: number;           // AR_PoidsNet
  seuilAlerte?: number;     // AR_SeuilReappro
  actif: boolean;           // AR_Sommeil = 0
}

export interface ArticleWithStock extends Article {
  stockTotal: number;
  stockReserve: number;
  stockDisponible: number;
  niveauStock: StockLevel;
  seuilMini?: number; // AS_QteMini de KLY Gennevilliers (pour stock bas)
}

export interface ArticleDetail extends ArticleWithStock {
  stockParDepot: StockDepot[];
}

// ============================================
// DEPOTS
// ============================================

export interface Depot {
  code: number;             // DE_No
  intitule: string;         // DE_Intitule
  adresse?: string;         // DE_Adresse
  codePostal?: string;      // DE_CodePostal
  ville?: string;           // DE_Ville
  principal: boolean;       // DE_Principal
}

export interface DepotWithStats extends Depot {
  nombreArticles: number;
  valeurStock: number;
}

// ============================================
// STOCK
// ============================================

export interface StockDepot {
  depotCode: number;
  depotIntitule: string;
  quantite: number;         // AS_QteSto
  quantiteReservee: number; // AS_QtePrepa (Préparé)
  disponible: number;       // calculé
  stockMini: number;        // AS_QteMini (seuil stock bas)
}

export interface DepotStockItem {
  article: {
    reference: string;
    designation: string;
    famille: string;
  };
  quantite: number;
  quantiteReservee: number;
  disponible: number;
  prixVente: number;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  statusCode: number;
}

// ============================================
// FILTRES
// ============================================

export interface ArticleFilters {
  search?: string;
  famille?: string;
  hasStock?: boolean;
  gennevilliersOnly?: boolean;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface DepotStockFilters {
  search?: string;
  hasStock?: boolean;
  page?: number;
  limit?: number;
}
