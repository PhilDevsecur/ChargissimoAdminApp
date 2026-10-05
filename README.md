# Chargissimo Admin — app mobile admin de Chargissimo

App Expo **réservée aux admins Chargissimo**, distribuée **hors stores** (APK Android +
iOS ad hoc via EAS), copiée de « Batsecur Admin » (`D:\Dev\Projets BATSECUR\Site et Logiciel
Batsecur\BatsecurAdminApp`), elle-même modèle de « GC Team » du Grand Comptoir. Nom affiché :
**Chargissimo Admin**, identifiant `com.chargissimo.admin` (iOS et Android).

⚠️ **Pas de base de dev** : le backend local (`../ChargissimoNodeJS`) attaque la base de
**production**. L'app v1 ne fait **aucune écriture** (lecture seule).

⚠️ **Chargissimo est une marque de Batsecur** : il n'y a **jamais de login sur Chargissimo**
(sa base n'a aucun compte admin). On se connecte avec les **identifiants Batsecur** — ceux de
« Batsecur Admin » et du logiciel Windows —, vérifiés par le **serveur Batsecur**. Les données
(commandes, clients) viennent, elles, du serveur Chargissimo.

## Ce que fait l'app (v1.0)

| Onglet | Contenu | Écritures |
|---|---|---|
| Commandes | une ligne par facture/BL (même tableau que l'admin web), recherche serveur, fiche avec lignes, factures/BL, suivi Chronopost, PDF (bon de commande, BL, facture) | aucune |
| Clients | recherche serveur (n°, nom, société, email, ville, CP, téléphone), fiche avec contacts cliquables (appel, email), adresses, notes | aucune |
| Compte | identifiant, serveur, version, mise à jour EAS, déconnexion | — |

**Notifications push** (tous les téléphones admin connectés, 24h/24, sans réglage) : nouvelle
commande passée par un client (site, app iOS/Android). Toucher la notification ouvre la fiche.

Chargissimo est **B2C** (`isB2B: false`) : pas de devis ni de demandes d'ouverture de compte
(onglets de Batsecur Admin retirés), pas de CA par année.

## Architecture

**Aucune règle métier dans l'app.** Elle appelle `/api/mobile-admin` (backend :
`ChargissimoNodeJS/src/routes/api/mobileAdminRoute.js`), dont les routes sont des enveloppes
minces autour des MÊMES méthodes de modèle que l'admin web (`Orders.getOrdersForTable`,
`Orders.findOrder`, `Customers.getCustomer`…). Les libellés de statut viennent du serveur.

```
app/
  _layout.tsx                 AuthGate : sans session → /login
  login.tsx                   identifiant admin (colonne `login`, PAS l'email)
  (tabs)/index.tsx            Commandes
  (tabs)/customers.tsx        Clients
  (tabs)/account.tsx          Compte / mise à jour / déconnexion
  order/[id].tsx              Fiche commande + PDF
  customer/[id].tsx           Fiche client
src/
  api/client.ts               axios + refresh automatique (file d'attente) + déballage { error:false, data }
  api/index.ts                appels typés
  components/PagedList.tsx    liste paginée par curseur + recherche serveur + temps réel
  realtime/                   Pusher (canaux publics orders/customers, clé servie par /config)
  notifications/              jeton Expo, enregistrement, ouverture de la fiche au toucher
  stores/authStore.ts         session (zustand)
  utils/secureStorage.ts      jetons en Keychain/Keystore (jamais AsyncStorage)
  utils/openPdf.ts            PDF téléchargé puis ouvert par la visionneuse du système
  utils/html.ts               HTML/RTF des désignations et notes → texte (jamais injecté)
```

## Authentification

L'app parle à UN seul serveur (chargissimo.com), qui **délègue** l'authentification à Batsecur :

```
app ──login──▶ chargissimo.com /api/mobile-admin/auth/login
                   └──▶ batsecur.com /api/mobile-admin/auth/login   (vérifie le mot de passe)
               ◀── jetons émis et signés par CHARGISSIMO (access 30 min + refresh 90 j)
```

- Le refresh est **revérifié chez Batsecur** : un compte retiré des admins Batsecur perd
  l'accès au plus tard à l'expiration du jeton d'accès (30 min).
- **Aucun secret partagé** entre les deux serveurs : chacun a son `MOBILE_ADMIN_JWT_SECRET`
  (différent en dev et en prod, sans repli sur `JWT_SECRET`). Un jeton Batsecur brut est refusé
  par Chargissimo (audience différente).
- Batsecur injoignable → 502 « Serveur Batsecur injoignable » ; l'app ne déconnecte que sur 401.
- Le serveur Chargissimo lit `BATSECUR_API_URL` (défaut `https://batsecur.com`).
- **Aucune clé d'API n'est embarquée dans l'app.**

## Pièges (hérités de Batsecur Admin)

- **Jamais de liste complète** : tout passe par `PagedList` (pages de 50, curseur, recherche
  côté serveur).
- **Réponses concurrentes** : `PagedList` n'accepte que la réponse de la DERNIÈRE recherche.
- **Pas de polling** : temps réel par Pusher + rechargement au retour sur l'écran.
- **HTML d'éditeur riche** dans les désignations de lignes et les notes client : toujours
  `htmlToText`.
- **Enum `platform`** : se fier à `Orders.platformTypeNumber` (1-3 site, 4 Android, 5 iOS) — le
  commentaire du champ dans `fw_Orders.js` est faux. Le libellé est calculé par le serveur.
- **PDF** : régénérés par le serveur à chaque appel, envoyés en binaire, ouverts avec la
  visionneuse du système (`expo-sharing`). Sur le web de dev : nouvel onglet (`openPdf.web.ts`).
- **Clavier** : tout écran avec un champ passe par `FormScroll`.
- `Alert.alert` ne marche pas sur le web de dev : confirmations via `ConfirmDialog`.
- Modules natifs absents du web de dev : variantes `.web.ts(x)`. Après ajout d'un fichier
  `.web`, relancer Metro avec `--clear`.

## Développement

```bash
npm install
npm run web        # Metro sur 8087 (Batsecur Admin : 8086, GC Team : 8085)
npm run typecheck
```

Backend local : serveur de test de Claude sur **8070** (8080 est réservé au développeur), avec
un `MOBILE_ADMIN_JWT_SECRET` de DEV : depuis `ChargissimoNodeJS`,
`APP_PORT=8070 APP_PORT_DEV=8070 MOBILE_ADMIN_JWT_SECRET=<secret de dev> node entry.cjs`.
`.env` de l'app : `EXPO_PUBLIC_API_URL=http://localhost:8070` (émulateur Android :
`10.0.2.2:8070`).

## Distribution (interne)

eas-cli épinglé : toujours `npx eas-cli@22.4.0 <commande>`. Compte Expo `phildevsecur`.

1. `npx eas-cli@22.4.0 init` → crée le projet EAS et ajoute `extra.eas.projectId` (puis
   ajouter `"updates": { "url": "https://u.expo.dev/<projectId>" }` dans `app.json`).
2. iPhones : `npx eas-cli@22.4.0 device:create` → lien/QR à ouvrir sur chaque iPhone
   (enregistre l'UDID). Ajouter un iPhone plus tard = refaire un build iOS.
3. `npx eas-cli@22.4.0 build --profile internal --platform all` → liens d'installation
   (iOS ad hoc + APK). Android : autoriser l'installation depuis cette source.
4. Apple : même équipe que l'app Batsecur Admin. Accepter la clé APNs proposée par EAS.
5. Android, notifications : FCM V1 — ajouter l'app `com.chargissimo.admin` à un projet Firebase,
   déposer son `google-services.json` à la racine (+ `android.googleServicesFile` dans
   `app.json`) et téléverser la clé de compte de service dans EAS
   (`npx eas-cli@22.4.0 credentials`).

Le profil `internal` pointe sur `https://chargissimo.com` : le backend Chargissimo (avec
`/api/mobile-admin` et son `MOBILE_ADMIN_JWT_SECRET`) **et** le backend Batsecur (avec son
`/api/mobile-admin`, c'est-à-dire celui de « Batsecur Admin ») doivent être en prod avant.

### Mises à jour JS (EAS Update, canal `internal`)

**Toujours `npm run update -- "message"`**, jamais `npx eas-cli update` en direct (il inline
l'URL du `.env` local). `scripts/update.js` force l'URL de prod le temps de la publication.

- Une mise à jour n'atteint QUE les builds de même `version` (`runtimeVersion` suit `version`).
- Le profil ad hoc iOS expire au bout d'un an.
