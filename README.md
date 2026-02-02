# Stock Sage 100

Application web mobile-first de consultation du stock Sage 100.

## Fonctionnalites

- **Recherche d'articles** : Recherche par reference ou designation
- **Stock multi-depots** : Visualisation du stock par depot
- **Indicateurs visuels** : Niveau de stock (rupture, bas, normal, surplus)
- **Prix** : Affichage des prix d'achat et de vente
- **Liste des depots** : Vue synthetique de chaque depot
- **Authentification** : Login / mot de passe simple

## Demarrage rapide

```bash
cd stock-sage
npm install
npm run dev
```

Ouvrir http://localhost:3000

**Compte par defaut** : `admin@stock.local` / `admin123`

## Configuration

### 1. Variables d'environnement

Editer le fichier `.env.local` :

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-secret-32-caracteres

# Utilisateurs (format: email:motdepasse:nom)
USER_1=admin@kly.com:motdepasse123:Admin KLY
USER_2=user@kly.com:user123:Utilisateur
# Ajouter USER_3, USER_4, etc. si besoin

# Sage 100 SQL Server
SAGE_ENABLED=true
SAGE_HOST=serveur-sage
SAGE_PORT=1433
SAGE_DATABASE=SAGE_GESCOM
SAGE_USER=user_lecture
SAGE_PASSWORD=xxx
```

### 2. Utilisateur SQL Server (Sage)

Creer un utilisateur en lecture seule sur la base Sage :

```sql
CREATE LOGIN user_lecture WITH PASSWORD = 'xxx';
USE [SAGE_GESCOM];
CREATE USER user_lecture FOR LOGIN user_lecture;
GRANT SELECT ON F_ARTICLE TO user_lecture;
GRANT SELECT ON F_ARTSTOCK TO user_lecture;
GRANT SELECT ON F_DEPOT TO user_lecture;
GRANT SELECT ON F_FAMILLE TO user_lecture;
```

## Structure

```
src/
├── app/
│   ├── articles/       # Liste et detail articles
│   ├── depots/         # Liste et detail depots
│   ├── login/          # Page de connexion
│   ├── profil/         # Page profil utilisateur
│   └── api/            # Routes API
├── components/
│   ├── articles/       # Composants articles
│   ├── depots/         # Composants depots
│   ├── layout/         # Header, BottomNav
│   └── ui/             # Composants UI reutilisables
├── lib/
│   ├── auth.ts         # Config NextAuth
│   ├── sage-db.ts      # Connexion SQL Server
│   └── utils.ts        # Utilitaires
├── services/
│   └── sage-stock.service.ts  # Service stock Sage
└── types/
    └── index.ts        # Types TypeScript
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/articles | Liste articles avec stock |
| GET /api/articles/[ref] | Detail article |
| GET /api/articles/[ref]/stock | Stock par depot |
| GET /api/depots | Liste depots |
| GET /api/depots/[code]/stock | Stock d'un depot |
| GET /api/familles | Liste familles |

## PWA

L'application peut etre installee sur mobile :
1. Ouvrir dans Chrome/Safari
2. "Ajouter a l'ecran d'accueil"
