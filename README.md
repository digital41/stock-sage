# KlyStock - v1.0.0

Application web mobile-first de consultation du stock Sage 100 en temps reel.

## Fonctionnalites v1

- Authentification email/mot de passe avec protection anti-robot (rate limiting)
- Consultation des articles avec stock par depot
- Recherche par reference ou designation
- Filtres : famille, avec stock, Gennevilliers uniquement
- Vue stock bas (articles sous seuil)
- Liste des depots avec stock
- Roles : admin (prix achat/vente/marge) / user (prix vente uniquement)
- Interface responsive mobile-first
- Headers de securite (XSS, clickjacking, HSTS)

## Stack Technique

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- NextAuth.js (JWT)
- TanStack Query
- mssql (SQL Server)

## Installation

```bash
npm install
npm run dev      # Developpement
npm run build    # Build production
npm start        # Demarrer production
```

## Configuration

Creer `.env.local` (dev) ou configurer les variables en production :

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<cle-secrete-256-bits>

# Utilisateurs (format: email:password:nom:role)
USER_1=admin@exemple.com:MotDePasse123!:Admin:admin
USER_2=user@exemple.com:MotDePasse456!:User:user

# Sage 100
SAGE_ENABLED=true
SAGE_HOST=<ip-serveur-sage>
SAGE_PORT=1433
SAGE_DATABASE=<nom-base>
SAGE_USER=<utilisateur-lecture-seule>
SAGE_PASSWORD=<mot-de-passe>
SAGE_CONNECTION_TIMEOUT=5000
SAGE_REQUEST_TIMEOUT=10000
SAGE_CACHE_ENABLED=true
SAGE_CACHE_TTL=30
```

### Exigences mot de passe

- Minimum 8 caracteres
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Au moins 1 caractere special (!@#$%^&*...)

## Deploiement Production

### Avec PM2 (recommande)

```bash
npm install -g pm2
npm run build
pm2 start npm --name "klystock" -- start
pm2 save
pm2 startup
```

### Variables importantes

- `NODE_ENV=production` (automatique avec `npm start`)
- `NEXTAUTH_URL` doit correspondre au domaine de production
- Generer un nouveau `NEXTAUTH_SECRET` pour la production

## Securite

- Rate limiting : 5 tentatives max, blocage 15 minutes
- Delai progressif : +2s par tentative echouee
- Headers securite : X-Frame-Options, X-Content-Type-Options, HSTS, CSP
- Route debug reservee aux admins en production
- Connexion Sage en lecture seule uniquement

## Structure

```
src/
├── app/                    # Pages (App Router)
│   ├── articles/           # Liste et detail articles
│   ├── depots/             # Liste et detail depots
│   ├── stock-bas/          # Articles sous seuil
│   ├── login/              # Connexion
│   ├── profil/             # Profil utilisateur
│   └── api/                # Routes API
├── components/             # Composants React
├── lib/                    # Utilitaires (auth, db, utils)
├── services/               # Services metier
├── hooks/                  # Hooks personnalises
└── types/                  # Types TypeScript
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
2. Menu > "Ajouter a l'ecran d'accueil"

## Roadmap v2

- [ ] Export Excel/PDF
- [ ] Favoris articles
- [ ] Scanner code-barres
- [ ] Mode hors-ligne
- [ ] Dashboard graphiques
- [ ] Alertes stock push
- [ ] Historique stock

---

Application interne KLY Groupe - v1.0.0
