# MonTaxiDirect — Plateforme de réservation taxi

Site web en français pour un réseau de chauffeurs indépendants. Chaque chauffeur affilié possède son **propre lien**, son **code QR unique**, sa **carte de visite PNG/imprimable**, un **tableau de bord privé** et un **carnet clients issu de ses réservations**. L'administrateur peut approuver/désactiver les chauffeurs et suivre les réservations du réseau.

## Identité visuelle MonTaxiDirect

- **Marque :** MonTaxiDirect · Signature : **Votre taxi. En direct.**
- **Palette :** bleu nuit `#142138`, jaune taxi `#FFC247`, turquoise `#61D8C8`, fond clair `#F6F8FB`.
- **Logo éditable :** `logo.svg` ; icône de site/PWA : `favicon.svg`.
- **Cartes de visite :** la nouvelle signature apparaît à l’écran et dans les fichiers PNG/imprimés ; le choix de couleur du chauffeur reste disponible.
- **Domaine :** à choisir et vérifier avant impression (aucune disponibilité de domaine ou marque n’a été vérifiée).

## Démarrer en démonstration

1. Ouvrir `index.html` dans un navigateur moderne (Chrome, Safari, Edge), ou lancer un serveur local :
   ```bash
   python3 -m http.server 8080
   ```
   puis visiter `http://localhost:8080`.
2. Cliquer sur **Espace chauffeur**, puis choisir *Amine*, *Sarah* ou *Administration*.
3. Tester les profils, les QR, le téléchargement de la carte et une demande de réservation. Deux chauffeurs différents ont deux carnets différents.

**Important :** en démo, les données résident **uniquement dans le `localStorage` de ce navigateur**. La connexion est simulée et non sécurisée. Un QR pointant vers `file://` ou `localhost` ne fonctionnera pas sur le téléphone d'un client distant. Aucune vraie réservation ne doit être collectée dans ce mode.

## Activer le véritable site multi-chauffeurs

Le site utilise **Firebase Authentication + Cloud Firestore** sans serveur Node.js. Les règles Firestore font respecter le cloisonnement des réservations entre chauffeurs. L'interface et la génération des QR fonctionnent sans bibliothèque JS distante. En mode Firebase, le SDK Firebase est chargé depuis les CDN officiels de Google.

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/).
2. **Authentication** → Activer le fournisseur **Adresse courriel/mot de passe**.
3. **Firestore Database** → Créer une base (choisir une région canadienne appropriée à votre politique de confidentialité).
4. **Paramètres du projet** → Ajouter une application **Web**, puis copier sa configuration dans `firebase-config.js`, à la place de `null` :
   ```js
   window.TAXI_FIREBASE_CONFIG = {
     apiKey: "...", authDomain: "...", projectId: "...",
     storageBucket: "...", messagingSenderId: "...", appId: "..."
   };
   ```
   Cette configuration de client n'est pas un mot de passe secret ; **la sécurité dépend des règles Firestore**.
5. Installer Firebase CLI (`npm install -g firebase-tools`) puis dans ce dossier :
   ```bash
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules,hosting
   ```
   Ou coller intégralement `firestore.rules` dans Firestore → Règles, et publier les fichiers sur Firebase Hosting.
6. Créer son compte sur le site via **Affilier mon taxi**. La première inscription est automatiquement **en attente** (`active: false`).
7. Dans Authentication → Utilisateurs, copier l'**UID** du propriétaire du site. Dans Firestore → Données, créer **manuellement** le document :
   ```text
   Collection : admins
   ID du document : <UID de l'administrateur>
   Champ : name (string) = Propriétaire
   ```
   **Ne jamais rendre l'écriture de `admins` accessible aux clients.** Les règles du projet la bloquent expressément. Déconnecter/reconnecter le compte et ouvrir **Mon espace** pour voir le panneau admin.
8. Depuis le tableau de bord administrateur, activer les chauffeurs approuvés. Chaque chauffeur actif peut partager son lien `https://votre-domaine/?taxi=<UID-du-chauffeur>` et enregistrer sa carte PNG unique.
9. Ajouter votre domaine personnalisé dans Firebase Hosting pour obtenir de beaux QR codes permanents. Éviter de changer les URL après avoir imprimé les cartes.

## Modèle des données

- `driversPublic/{uid}` : informations expressément publiques du chauffeur, téléphone professionnel, ville, véhicule, `status`, `active`.
- `reservations/{bookingId}` : `driverId`, nom/téléphone du client, départ/destination, heure demandée, passagers, note, statut.
- `admins/{uid}` : seulement des documents ajoutés par un administrateur dans la console Firebase.

Les clients peuvent **uniquement créer** une demande de réservation pour un chauffeur approuvé et actif. Ils ne peuvent pas lire les demandes existantes. Un chauffeur connecté ne peut lire que les documents `reservations` dont `driverId` correspond à son propre UID et ne peut changer que leur statut. L'administrateur peut lire toutes les demandes. Les utilisateurs ne peuvent pas s'auto-approuver. Un carnet clients est calculé à partir des réservations de son chauffeur : aucune base clients partagée entre chauffeurs.

## Fonctionnalités incluses

- Page d'accueil professionnelle adaptative (ordinateur, iPhone, Android).
- Inscription/connexion chauffeur (Firebase lorsque configuré).
- Approbation/désactivation des chauffeurs par l'admin.
- Page publique de réservation strictement liée au chauffeur (`?taxi=<UID>`).
- Demandes : trajet, date/heure, coordonnées, nombre de passagers, notes.
- Statuts : à confirmer, confirmée, terminée, annulée.
- Tableau de bord de réservations privé et filtre par statut.
- Carnet de clients récurrents dérivé uniquement des courses du chauffeur.
- Profil personnalisable et choix de couleur pour la carte.
- QR code local, sans service externe ; carte PNG de grande taille, prête à partager ; impression sur format 85,6 × 54 mm.
- Démo utilisable sans Firebase (comptes fictifs non authentifiés).

## Avant une mise en production commerciale

**Obligatoire/fortement recommandé :**
- Ajouter une politique de confidentialité, les mentions légales et la gestion des demandes d'accès/suppression de données, en tenant compte de la Loi 25 du Québec. Définir la rétention des réservations.
- Intégrer le SDK **Firebase App Check** au code client, configurer son fournisseur et activer son application à Firestore, puis envisager une fonction serveur avec limitation de débit / protection antispam. Les règles Firestore valident les champs mais ne limitent **pas** le nombre de réservations anonymes par visiteur.
- Mettre en place des **notifications réelles** (courriel, SMS ou push côté serveur) pour les chauffeurs et, si désiré, le client. **La version fournie n'envoie aucune notification** : le chauffeur voit les réservations depuis son tableau de bord, en temps réel lorsque celui-ci est ouvert.
- Ne pas annoncer une course « confirmée » tant que le chauffeur n'a pas choisi le statut confirmé : le reçu client ne confirme que la **réception de la demande**.
- Adapter les validations de numéro de téléphone, les règles métier de réservation et les obligations locales du transport rémunéré de personnes, y compris celles concernant les prix/tarifs et les renseignements à communiquer.
- Personnaliser les coordonnées de l'entreprise, les conditions d'utilisation, et le domaine définitif. Le logo **MonTaxiDirect** est déjà fourni dans `logo.svg` et `favicon.svg`. En cas d'oubli du mot de passe, ajouter un parcours de récupération de compte Firebase.
- Tester `firestore.rules` dans l'émulateur Firebase avec des profils de deux chauffeurs différents, un client anonyme et un administrateur avant publication.

Ce projet est un **MVP fonctionnel en démo** et une base connectable à Firebase, pas une plateforme commerciale testée/auditée de bout en bout.

## Licence / attributions

Le générateur de QR local est dérivé de « QRCode for JavaScript » © Kazuhiko Arase, distribué sous licence MIT via le paquet `qrcode-terminal`. Voir les commentaires dans `vendor/qr-code.js`. La maquette et le code spécifique du site peuvent être personnalisés.

## Mise à jour depuis Taxi Live

Les données de la démonstration locale sont reprises automatiquement si le stockage `taxi-live-demo-v1` existait déjà, afin de ne pas perdre les essais précédents. Les comptes Firebase et identifiants de chauffeurs ne sont pas renommés : leurs URL de réservation restent basées sur `?taxi=<UID>`. Lors de la publication sur un nouveau domaine, il faut générer et redistribuer les QR codes qui contiennent l’ancienne URL.