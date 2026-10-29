<div align="center">
  <h1>🎮 Suivi des Dons Extra Life & Overlays OBS</h1>
  <p><strong>Un système de suivi des dons au style rétro, des alertes de stream en direct et une suite complète d'overlays OBS personnalisables pour les marathons caritatifs Extra Life & DonorDrive.</strong></p>

  <p>
    <a href="./README.md">🇬🇧 English Version</a> •
    <a href="./APP_OPTIONS_FR.md">⚙️ Options & Paramètres Détaillés (FR)</a> •
    <a href="./GITHUB_PAGES_LOCAL_GUIDE.md">🚀 Guide de Déploiement</a>
  </p>
</div>

---

## 🌟 Fonctionnalités Principales

- **Suivi des Dons en Temps Réel** : Données synchronisées directement avec l'API DonorDrive d'Extra Life (Participant et Équipe) avec sondage automatique et actualisation configurable.
- **Tableau de Bord Participant & Équipe** :
  - **Participant** : Montant total récolté, objectif, barre de progression animée, chronomètre de marathon, liste des derniers dons et étapes (milestones).
  - **Équipe** : Statistiques globales de l'équipe, classement des membres et liste des dons d'équipe classés **du plus récent au plus ancien**.
  - **📈 Graphique de Progrès Annuel & Paliers (Repliable, Réduit par Défaut)** : Visualisation interactive des dons collectés tout au long de la campagne avec lignes de seuil horizontales pour chaque palier et l'objectif, marqueurs de trophée (🏆) indiquant la date et le don exact ayant franchi chaque étape, et bascule entre vue **Croissance Cumulative** et **Répartition Mensuelle**. Disponible sur le tableau de bord Participant ainsi que sur le tableau de bord Équipe (avec sélecteur Équipe Complète / Membre Sélectionné).
- **Suite Complète d'Overlays OBS Prêts pour le Streaming** :
  - Barre de progression (`?overlay=progress`)
  - En-tête de stream complet (`?overlay=header`)
  - Boîte d'alertes de don avec effets sonores (`?overlay=alert`)
  - Liste défilante des derniers dons (`?overlay=donations`)
  - Suivi des incitations et récompenses (`?overlay=incentives`)
  - Liste des étapes / jalons de collecte (`?overlay=milestones`)
  - En-tête d'équipe (`?overlay=team-header`)
  - Liste des dons d'équipe (`?overlay=team-donations`)
  - Tableau de bord équipe complet en overlay (`?overlay=team-dashboard`)
  - Programme / planning du marathon (`?overlay=schedule`)
  - Carrousel des logos sponsors (`?overlay=sponsors`)
  - Affichage de texte / annonces (`?overlay=text`)
  - Code QR pour faire un don direct (`?overlay=qrcode`)
  - Célébration plein écran avec confettis (`?overlay=celebration`)
- **Intégration Twitch avec Indicateur de Statut** :
  - Connexion au chat Twitch pour déclencher des commandes (`!donate`, `!total`, `!goal`, etc.).
  - Indicateur visuel d'état en direct dans l'en-tête et les paramètres (*Connecté*, *Non configuré*, *En connexion*, ou *Erreur*).
- **Dossiers d'Actifs Locaux (Sons & Logos Sponsors)** :
  - `public/sounds/` : Fichiers audio prêts à l'emploi (`alert.mp3`, `coin.mp3`, `fanfare.mp3`, `celebration.mp3`, `chime.mp3`) avec générateur de sons Web Audio de secours.
  - `public/sponsors/` : Logos et bannières sponsors (`sponsor1.png`, `sponsor2.png`, `sponsor3.png`, `sponsor4.png`).
- **Tests & Simulations Intégrés** : Boutons pour simuler un don de test (avec alerte sonore et visuelle instantanée) ou déclencher une pluie de confettis.

---

## 🚀 Démarrage Rapide

### 1. Installation & Lancement Local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement local
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

### 2. Configuration Initiale

1. Cliquez sur **⚙️ Paramètres** en haut à droite du tableau de bord.
2. Saisissez votre **ID de Participant Extra Life** (ex: `554030`).
   > *Astuce : Vous le trouverez dans l'URL de votre page de don Extra Life : `extra-life.org/participant/[VOTRE_ID]`.*
3. Si vous faites partie d'une équipe, saisissez votre **ID d'Équipe Extra Life** (ex: `66000`).
4. Personnalisez votre devise (`$`, `€`, `£`, `CAD`, etc.), le délai d'actualisation et le volume audio.
5. Cliquez sur **Enregistrer**.

---

## 🎥 Intégration OBS Studio

Tous les overlays s'intègrent dans OBS en ajoutant une source de type **Navigateur** (*Browser Source*).

### 🎛️ Panneau Personnalisé OBS / Custom Browser Dock (Recommandé pour GitHub Pages)

Lorsque vous utilisez le tracker hébergé sur **GitHub Pages** (ou en serveur statique local sans `server.js`), votre navigateur externe (Google Chrome) et les sources navigateurs d'OBS s'exécutent dans des profils isolés. Par conséquent, les événements `BroadcastChannel` ne peuvent pas communiquer entre Chrome et OBS.

Pour obtenir une **synchronisation instantanée à 100 %** (bouton **« Simuler un don (+15 $) »**, arrêt d'urgence des alertes, et mise à jour en direct des paramètres) :

1. Dans le menu supérieur d'OBS Studio, cliquez sur **Docks** (ou **Panneaux**) > **Docks de navigateur personnalisés...** (*Custom Browser Docks...*).
2. Dans la fenêtre de configuration :
   * **Nom du dock :** `Extra Life Control` (ou le nom de votre choix)
   * **URL :** L'adresse de votre GitHub Pages (ex: `https://<votre-nom-utilisateur>.github.io/<nom-du-repo>/?profile=VOTRE_ID_PARTICIPANT` ou `http://localhost:8080/?profile=VOTRE_ID` en test local)
3. Cliquez sur **Appliquer**, puis **Fermer**.
4. Une nouvelle fenêtre s'ouvre dans OBS affichant l'intégralité de votre tableau de bord Extra Life.
5. Vous pouvez ancrer ce panneau n'importe où dans OBS (à côté du chat, des scènes ou du mélangeur audio) ou le glisser sur un second écran.
6. **Synchronisation immédiate :** Comme le dock et les sources navigateurs d'OBS partagent le **même processus CEF**, l'API `BroadcastChannel` fonctionne directement. Cliquer sur **« Simuler un don »** dans le panneau déclenchera immédiatement l'alerte sur votre overlay dans OBS !

> **Précision pour les vrais dons :** Les vrais dons envoyés par vos spectateurs n'ont **pas** besoin du dock ou du navigateur externe pour s'afficher : chaque overlay dans OBS interroge directement l'API DonorDrive. Le dock personnalisé sert pour les commandes manuelles, les tests et le réglage en direct des paramètres.

---

### Comment ajouter un overlay dans OBS :
1. Dans OBS, sous la section **Sources**, cliquez sur `+` puis choisissez **Navigateur**.
2. Donnez-lui un nom (ex: `Extra Life - Alerte`).
3. Cochez **URL locale** si vous utilisez les fichiers locaux, ou collez l'URL web avec le paramètre de l'overlay (ex: `http://localhost:3000/?overlay=notifications`).
4. Indiquez la **Largeur** et la **Hauteur** recommandées (voir tableau ci-dessous).
5. Décochez **Arrêter la lecture lorsque la source n'est pas visible** (pour que l'overlay reste à l'écoute de `BroadcastChannel`).

### Tableau des Overlays Disponibles

| Overlay | Paramètre URL | Dimensions Recommandées | Description |
| :--- | :--- | :--- | :--- |
| **Alertes de Don** | `?overlay=notifications` | 500 × 200 px | Boîte d'alerte rétro avec animation et son lors d'un don. |
| **Barre de Progression** | `?overlay=progress` | 800 × 120 px | Jauge animée avec montant collecté, objectif et chronomètre du marathon. |
| **Jalons / Milestones** | `?overlay=milestone` | 600 × 100 px | Progression vers le prochain objectif ou incitatif. |
| **Graphique Annuel** | `?overlay=graph` | 880 × 420 px | Graphique interactif de collecte annuelle avec paliers et repères. |
| **Graphique Équipe** | `?overlay=team-graph` | 880 × 420 px | Graphique annuel pour l'équipe entière ou un membre sélectionné. |
| **En-tête Équipe** | `?overlay=team-header` | 850 × 220 px | Bannière horizontale avec progression, objectif et nombre de donateurs. |
| **Dons d'Équipe** | `?overlay=team-donations` | 500 × 750 px | Liste des dons d'équipe triée **du plus récent au plus ancien**. |
| **Tableau Équipe Dédié** | `?overlay=team-dashboard` | 1280 × 850 px | Vue globale équipe : totaux, progression, liste des membres et derniers dons. |
| **Célébration Confettis** | `?overlay=celebration` | 1920 × 1080 px | Pluie de confettis plein écran lors des paliers et objectifs. |
| **Programme du Marathon** | `?overlay=schedule` | 450 × 600 px | Planning des jeux avec mise à jour et biffage en direct. |
| **Carrousel Sponsors** | `?overlay=sponsors` | 400 × 150 px | Défilement rotatif des logos sponsors et partenaires. |
| **Texte / Annonces** | `?overlay=text` | 600 × 150 px | Affichage de messages personnalisés, règles ou annonces. |
| **Code QR Don** | `?overlay=qrcode` | 260 × 320 px | Badge avec QR code scannable renvoyant vers votre page de don. |

---

## 💬 Intégration Twitch & Commandes du Chat

L'application permet d'écouter et de répondre directement dans le chat de votre chaîne Twitch.

### Configuration Twitch
1. Ouvrez **Paramètres** (`⚙️`) > section **Twitch**.
2. Entrez votre **Nom de Chaîne Twitch** (ex: `MonPseudoTwitch`).
3. *(Optionnel pour envoyer des réponses)* Entrez un jeton OAuth généré pour votre compte Twitch ou compte de bot.
4. Activez l'option **Activer l'intégration Twitch**.

### Indicateur d'État Twitch
L'état de la connexion s'affiche dans la barre de navigation et dans les paramètres :
- 🟢 **Connecté au chat Twitch** : Prêt et écoute les commandes du chat.
- 🟡 **Connexion en cours...** : En cours de liaison avec les serveurs Twitch.
- ⚪ **Non configuré / Désactivé** : L'intégration n'a pas encore été paramétrée.
- 🔴 **Erreur de connexion** : Vérifiez le nom de la chaîne ou le jeton.

### Commandes Disponibles pour les Spectateurs
- `!donate` : Affiche le lien direct pour faire un don.
- `!total` ou `!raised` : Affiche le montant total récolté en direct.
- `!goal` : Indique l'objectif fixé et le pourcentage atteint.
- `!team` : Affiche le nom et le total de l'équipe Extra Life.
- `!incentives` : Liste les incitations et récompenses disponibles.
- `!schedule` : Indique le jeu ou l'événement en cours dans le marathon.

---

## 📁 Dossiers d'Actifs Locaux (Sons & Sponsors)

Vous pouvez ajouter vos propres fichiers multimédias directement dans les dossiers suivants du projet :

```text
public/
├── sounds/                 <-- Fichiers audio pour les alertes
│   ├── alert.mp3           <-- Son par défaut des alertes
│   ├── coin.mp3            <-- Son de pièce rétro
│   ├── fanfare.mp3         <-- Son de fanfare pour les paliers
│   ├── celebration.mp3     <-- Célébration
│   ├── chime.mp3           <-- Carillon doux
│   └── README.md           <-- Instructions sur les formats audio
└── sponsors/               <-- Images et logos des sponsors
    ├── sponsor1.png        <-- Logo sponsor 1
    ├── sponsor2.png        <-- Logo sponsor 2
    ├── sponsor3.png        <-- Logo sponsor 3
    ├── sponsor4.png        <-- Logo sponsor 4
    └── README.md           <-- Guide sur les dimensions recommandées
```

### Formats recommandés :
- **Audio** : `.mp3`, `.wav`, `.ogg` (fichiers légers, moins de 500 Ko conseillés).
- **Images** : `.png` avec fond transparent, `.webp`, ou `.jpg` (dimensions types : 400 × 150 px).

---

## 🛠️ Structure du Projet

- `index.tsx` : Point d'entrée principal, navigation par onglets, logique des requêtes API et synchronisation.
- `dashboard-panels.tsx` : Vues principales (Tableau de bord Participant, Tableau de bord Équipe, Panneau de Configuration).
- `overlays.tsx` : Tous les composants d'overlays dédiés pour OBS.
- `types.ts` : Types TypeScript (données DonorDrive, dons, récompenses, jalons, paramètres).
- `APP_OPTIONS_FR.md` : Description détaillée de chaque option et paramètre de configuration.
- `GITHUB_PAGES_LOCAL_GUIDE.md` : Guide étape par étape pour déployer gratuitement sur GitHub Pages ou exécuter hors-ligne.

---

## 📄 Licence & Crédits

Créé avec passion pour soutenir les hôpitaux du réseau **Children's Miracle Network Hospitals** à travers le programme caritatif **Extra Life**.
