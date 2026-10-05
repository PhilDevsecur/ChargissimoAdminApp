@README.md

# Chargissimo Admin — consignes de travail (app mobile ADMIN de Chargissimo)

App Expo interne réservée aux admins Chargissimo (hors stores). Le `README.md` (importé
ci-dessus) décrit l'architecture, la stack, les pièges et la distribution. Ce fichier
ajoute les **règles de travail**, l'**état d'avancement** et les **décisions** à ne pas
re-demander.

Modèle suivi : **Batsecur Admin** (`D:\Dev\Projets BATSECUR\Site et Logiciel
Batsecur\BatsecurAdminApp`), lui-même copié de « GC Team » du Grand Comptoir. En cas de doute
sur un mécanisme commun (auth, push, EAS Update), ce sont les références.

Backend : `../ChargissimoNodeJS` — lire son `CLAUDE.md`, section « App mobile ADMIN
« Chargissimo Admin » ». Même framework que Batsecur (`frameworkdevsecurnodejs`).

## Règles non négociables

1. **Aucune règle métier dans l'app.** L'app appelle `/api/mobile-admin`, dont les routes
   sont des enveloppes minces autour des MÊMES méthodes de modèle que l'admin web. Nouvelle
   fonctionnalité = réutiliser la méthode existante, jamais la réécrire.
2. **Pas de base de dev** : le backend local attaque la base de PRODUCTION. Les tests de
   Claude se font en LECTURE SEULE (jetons de test signés avec le secret de DEV).
3. **Expo SDK 54 figé**. Ajouter un module avec `npx expo install <module>`.
4. **eas-cli épinglé** : toujours `npx eas-cli@22.4.0 <commande>`.
5. **Ports** : backend de test **8070** (`APP_PORT=8070 APP_PORT_DEV=8070`, jamais 8080 =
   serveur du développeur) ; Metro **8087**. Toujours arrêter les serveurs de test à la fin
   (PID vérifié avant l'arrêt). Un PDF généré en test reste dans `file/` → le supprimer.
6. **Backend** : déployé par l'utilisateur. Ne jamais déployer soi-même ; à la fin d'un
   chantier, donner la liste exacte des fichiers à envoyer.
7. **Secrets** : `MOBILE_ADMIN_JWT_SECRET` propre à Chargissimo (jamais celui de Batsecur),
   différent en dev et en prod, sans repli sur `JWT_SECRET`. Aucune clé d'API dans l'app. Clé de compte de service Firebase
   (`*-firebase-adminsdk-*.json`) : SECRÈTE, ignorée par git, uploadée dans EAS.
   ⚠️ `ChargissimoNodeJS/.env` est SUIVI par git malgré son `.gitignore` : n'y écrire aucun
   secret sans que l'utilisateur ait décidé quoi en faire.
8. **Pas de polling** : temps réel par Pusher ou rechargement au focus. Jamais de liste
   complète : pagination + recherche serveur.
9. Ne rien committer sans demande explicite.
10. **Styles** : pas de LESS ici (React Native) ; la charte est dans `src/theme/index.ts`.

## Décisions de l'utilisateur (ne pas re-demander)

- 2026-10-05 : app créée dans `D:\Dev\Projet Chargissimo\ChargissimoAdminApp`, dépôt GitHub
  `PhilDevsecur/ChargissimoAdminApp`, **même principe que Batsecur Admin** (iOS + Android,
  distribution interne ad hoc + APK, EAS Update canal `internal`).
- Périmètre v1 : **Commandes, Clients, Notifications push** (B2C : ni devis ni demandes de
  compte).
- Backend `/api/mobile-admin` créé dans `ChargissimoNodeJS` en même temps que l'app.
- **Logins = ceux de BATSECUR, toujours** (règle de Phil du 2026-10-05, identique au logiciel
  Windows : Chargissimo est une marque de Batsecur, sans compte admin dans sa base). Le serveur
  Chargissimo transmet le login à `batsecur.com` puis émet ses propres jetons ; voir README.
- Identité : nom **Chargissimo Admin**, identifiant `com.chargissimo.admin`, schéma
  `chargissimoadmin`, compte Expo `phildevsecur`. Charte : bleu du site (`#4479bf`,
  `#2d5891`), logo du site + bandeau orange « ADMIN » sur l'icône.

## État au 2026-10-05

Fait, **rien de déployé, aucun build, aucun commit** :
- App copiée de Batsecur Admin puis adaptée (écrans Devis / Demandes retirés, CA par année
  retiré, thème et icônes Chargissimo). `npm run typecheck` sans erreur.
- Backend `/api/mobile-admin` écrit dans `ChargissimoNodeJS` (cf. son `CLAUDE.md`).
- **Authentification déléguée à Batsecur** testée contre un FAUX serveur Batsecur local (aucun
  appel à la production) : login, jeton Chargissimo accepté, jeton Batsecur brut refusé (401),
  refresh revérifié chez Batsecur, 401 / 429 relayés, 502 si Batsecur injoignable.
- **Testé en LECTURE SEULE** sur la base de PROD (17 commandes, 21 clients) : les 4 garde-fous
  JWT répondent 401 (sans jeton, mauvaise audience, mauvais secret, refresh utilisé en
  access) ; les contrôleurs, appelés en direct, renvoient liste des commandes, fiche commande
  (lignes, facture/BL), recherche, liste et fiche client, recherche client (injection SQL
  neutralisée) et génération du PDF bon de commande (fichier de test supprimé).
- **Jamais exercé** : login réel contre le vrai `batsecur.com` (son `/api/mobile-admin` n'est pas
  encore déployé), app sur
  téléphone/navigateur, envoi réel d'une notification, Pusher en direct, ouverture d'un PDF
  sur téléphone, `push/register` (les tables `MobileAdminPushTokens` / `MobileAdminPushSent`
  seront créées au premier usage).

Prochaines étapes (côté utilisateur) :
1. **Déployer le backend Batsecur** (`/api/mobile-admin` + `MOBILE_ADMIN_JWT_SECRET` Batsecur,
   cf. le `CLAUDE.md` de `BatsecurAdminApp`) : sans lui, le login Chargissimo répond 502.
2. Repo GitHub `ChargissimoAdminApp` créé : premier commit + push à faire.
3. `npx eas-cli@22.4.0 init` (crée le projet EAS ; renseigner `extra.eas.projectId` et
   `updates.url` dans `app.json`).
4. Générer le `MOBILE_ADMIN_JWT_SECRET` **Chargissimo** (prod, différent de celui de Batsecur) et déployer les fichiers backend listés dans le
   `CLAUDE.md` de `ChargissimoNodeJS`.
5. Firebase (app Android `com.chargissimo.admin` + clé FCM V1 dans EAS), `device:create` pour
   les iPhone, puis `build --profile internal --platform all`.

## Commandes

```bash
npm run web          # Metro 8087
npm run typecheck
npx eas-cli@22.4.0 build --profile internal --platform all
npm run update -- "…"        # mise à jour JS (force l'URL de prod)
```
