# Extra Life Tracker - Référence Détaillée des Options et Paramètres de l'Application

> 🇬🇧 **English version available:** See [`APP_OPTIONS.md`](./APP_OPTIONS.md) and [`README.md`](./README.md)

Ce document fournit un guide exhaustif de toutes les vues de navigation, options de configuration, sources d'overlays OBS, dossiers de ressources et points d'accès API.

---

## 🧭 Vues de Navigation

La barre de navigation supérieure propose trois vues principales :

1. **👤 Tableau de Bord Participant (`Participant Dashboard`) :**
   - Statistiques de collecte en temps réel : Total Récolté, Objectif, Barre de Progression, Minuteur Écoulé / Compte à Rebours du Marathon.
   - **📈 Graphique de Progrès Annuel & Jalons (Repliable, Réduit par Défaut) :** Graphique interactif affichant les courbes de collecte cumulée tout au long de l'année de campagne, les lignes de seuil horizontales pour chaque jalon et objectif (avec code couleur pour les cibles atteintes vs à venir), les marqueurs de trophée (🏆) indiquant la date exacte du don et le donateur ayant débloqué chaque palier, ainsi qu'une bascule entre les vues **Croissance Cumulative** et **Répartition Mensuelle**.
   - Liste des dons récents et franchissements de jalons.
   - Contrôles de stream en direct : **Test Donation (+$15)**, **Resync Data** (Synchronisation forcée) et **Clear & Stop All** (Tout arrêter et effacer).
   - Cartes de liens pour tous les overlays participants avec boutons d'aperçu en un clic **Copier le lien** et **Ouvrir le popup**.

2. **👥 Tableau de Bord Équipe (`Team Dashboard`) :**
   - Barre de progression collective de l'équipe, total récolté, objectif et nombre de donateurs.
   - **📈 Graphique Annuel Équipe & Membre (Repliable, Réduit par Défaut) :** Graphique d'évolution annuelle interactif avec bascule immédiate entre **Progrès de l'Équipe Complète** (courbe cumulative macro de l'équipe & jalons d'objectifs d'équipe) et **Progrès du Membre Sélectionné** (courbe individuelle du membre avec ses jalons personnels).
   - Liste interactive de tous les membres de l'équipe avec leurs totaux individuels et leurs objectifs de collecte.
   - **Fil des Dons Récents de l'Équipe :** Automatiquement trié avec les **dons les plus récents en premier** sur l'ensemble des membres de l'équipe, avec recherche et filtrage par donateur.
   - Inspection des membres : Cliquez sur n'importe quel membre de l'équipe pour visualiser ses dons personnels et sa progression.
   - Liens rapides et aperçus popups pour l'En-tête d'Équipe, le fil de Dons d'Équipe, le Tableau de Bord d'Équipe complet et le Graphique d'Équipe.

3. **⚙️ Paramètres (Vue Pleine Page - `Settings`) :**
   - Vue dédiée propre en pleine page regroupant toutes les sections de configuration sans encombrer le tableau de bord de stream en direct.
   - Organisée en panneaux repliables décrits ci-dessous.

---

## ⚙️ Guide de Référence des Paramètres

### 1. Configuration Principale & Identification (`Core Setup`)
Situé dans la section **Configuration Principale** :
* **Langue (`Language`) :** Basculez dynamiquement l'ensemble de l'interface entre le **Français (`fr`)** et l'**Anglais (`en`)**. Toutes les traductions sont définies dans `translations.js`.
* **Identifiant Participant (`Participant ID`) :** Votre identifiant numérique unique Extra Life (ex. `534123` extrait de l'URL de votre page de collecte `extra-life.org/participant/534123`).
* **Détection automatique de l'Équipe (`Auto-detect Team ID`) :** Interroge automatiquement DonorDrive pour identifier et associer l'équipe à laquelle appartient votre participant.
* **Identifiant d'Équipe (`Team ID`) :** Définissez manuellement l'identifiant de votre équipe Extra Life si vous souhaitez suivre une équipe indépendamment.
* **Intervalle d'actualisation (`Refresh Interval`) (secondes) :** Fréquence à laquelle l'application interroge l'API Extra Life pour récupérer les nouvelles données (minimum 15s ; 60s recommandées).
* **Mode Devise (`Currency Mode`) :**
  * **USD ($) :** Devise standard d'Extra Life.
  * **CAD (C$) :** Récupère automatiquement les taux de change en direct, ou permet un calcul de taux fixe personnalisé basé sur le total affiché sur votre page Extra Life canadienne.

### 2. Événement & Horaires (`Event & Timing`)
* **Heure de Début de l'Événement (`Event Start Time`) :** Définissez la date et l'heure de votre marathon.
  * *Effet :* Affiche un compte à rebours (« Débute dans... ») avant le lancement, puis un chronomètre (« Temps Écoulé... ») une fois l'événement démarré, à la fois sur le tableau de bord et sur les overlays de barre de progression.
* **Durée de la Célébration (`Celebration Duration`) (secondes) :** Durée de l'explosion de confettis lorsque les objectifs ou les jalons sont atteints.

### 3. Intégration Twitch & Statut en Direct (`Twitch Integration & Live Status`)
* **Badge de Statut & Diagnostics :**
  * Indicateur visuel persistant dans la barre supérieure et dans les Paramètres :
    - 🟢 **Connecté (`#channel`) :** Connexion WebSocket active à Twitch IRC.
    - 🟡 **En connexion :** Reconnexion ou négociation du protocole IRC en cours.
    - 🔴 **Erreur :** Problème d'authentification ou de connexion avec infobulle explicative et bouton **Reconnecter**.
    - ⚪ **Désactivé / Configuration requise :** Intégration désactivée ou identifiants manquants.
  * Diagnostics : Affiche le nombre de commandes traitées, le nombre d'alertes envoyées et l'horodatage de la dernière activité.
  * **Envoyer un Message de Test (`Send Test Message`) :** Envoie un message de vérification sur votre chaîne pour confirmer les permissions d'écriture dans le chat.
* **Activer l'Intégration Twitch :** Interrupteur principal pour le bot de chat Twitch.
* **Chaîne Twitch (`Twitch Channel`) :** Votre nom d'utilisateur Twitch en minuscules.
* **Jeton OAuth Twitch (`Twitch OAuth Token`) :** Jeton disposant des portées `chat:read` et `chat:edit`. Cliquez sur **Obtenir un Jeton OAuth** pour une autorisation automatique.
* **Activer les Alertes de Chat :** Publie automatiquement une annonce dans le chat dès qu'un don est reçu.
* **Activer les Commandes de Chat :** Répond aux commandes intégrées des spectateurs (`!total`, `!goal`, `!milestone`).
* **Commandes Personnalisées :** Créez vos propres commandes de spectateurs (ex. `!donate`, `!schedule`, `!guild`) avec vos messages de réponse sur mesure.

### 4. Thèmes & Personnalisation Visuelle (`Themes & Visual Customization`)
* **Préréglages Visuels (`Visual Presets`) :**
  * **Neon Vibe** (Esthétique rétro cyan / magenta par défaut)
  * **Solarized Dark** (Palette douce bleu / sarcellé)
  * **Hacker Green** (Vert phosphorescent façon terminal cathodique CRT)
  * **Synthwave** (Ambiance rétrowave violet / rose années 80)
  * **Final Fantasy** (Cadre de fenêtre classique bleu et blanc)
  * **Final Fantasy XIV** (Gris foncé, or et bleu éthéré)
  * **Dwarf Fortress** (Pierre sombre et rouge magma)
* **Polices Pixel & Typographie :** Press Start 2P, Bungee, Roboto Mono, VT323, Cinzel.
* **Animations de Notification :** Slide In, Fade In, Bounce In, Zoom In.
* **Remplacement Personnalisé des Couleurs :** Personnalisez individuellement les couleurs HEX d'arrière-plan, des panneaux, du texte, des bordures, des en-têtes, des boutons primaires, des boutons secondaires, de succès et d'erreur.

### 5. Paramètres Sonores & Audio (`Sound & Audio Settings`)
* **Activer le Son :** Interrupteur général pour toutes les alertes sonores.
* **Volume Principal :** Curseur de volume réglable de 0 % à 100 %.
* **Son de Don :** Choisissez entre la pièce de monnaie 8-bit intégrée, vos propres fichiers téléversés, ou les sons du dossier `/sounds/`.
* **Son de Jalon :** Choisissez entre la fanfare intégrée, des fichiers téléversés, ou les sons du dossier `/sounds/`.
* **Bibliothèque Sonore & Dossier de l'Application (`/sounds`) :**
  * Téléversez des fichiers personnalisés `.mp3`, `.wav` ou `.ogg` (jusqu'à 2 Mo).
  * **Dossier `/sounds` :** Déposez directement des fichiers audio dans le dossier `/sounds` du projet pour qu'ils apparaissent automatiquement dans les menus déroulants. Contient 5 sons d'alerte prêts à l'emploi : `chime.wav`, `bell.wav`, `fanfare.wav`, `coin.wav`, `alert.wav`.

### 6. Paramètres de l'Overlay Code QR (`QR Code Overlay Settings`)
* **URL Personnalisée :** Par défaut l'URL de votre page de participant Extra Life, ou toute URL personnalisée de votre choix.
* **Libellé / Appel à l'Action :** Texte affiché au-dessus du code QR (ex. « Scannez pour Donner ! »).
* **Couleur & Taille :** Ajustez la taille du code QR, la couleur d'arrière-plan, la transparence et les bordures selon vos besoins de mise en page.

### 7. Programme du Marathon (`Marathon Schedule`)
* **Ajouter un Bloc :** Saisissez l'horaire (ex. `10:00 AM`) et la description du jeu / de l'activité.
* **Validation en Direct :** Cochez les éléments comme « Terminé » sur le tableau de bord pour les barrer en temps réel sur les overlays de stream.
* **Réorganiser / Supprimer :** Gestion simplifiée de votre liste de segments.

### 8. Carrousel de Sponsors (`Sponsors Carousel`)
* **Durée d'Affichage :** Nombre de secondes pendant lesquelles chaque bannière de sponsor reste visible.
* **Ajout de Sponsors :**
  - **Téléverser une Image :** Sélectionnez une image locale depuis votre appareil.
  - **Coller une URL d'Image :** Fournissez n'importe quel lien d'image HTTPS direct.
  - **Dossier `/sponsors` :** Déposez vos images dans `/sponsors/` (supporte `.svg`, `.png`, `.jpg`, `.webp`, `.gif`). Contient 5 bannières de démarrage (`sponsor-sample-gold.svg`, `silver`, `energy`, `community`, `extra-life`).

### 9. Overlay d'Affichage de Texte (`Text Display Overlay`)
* **Options de Source :**
  - **Saisie Directe de Texte :** Saisissez vos annonces personnalisées, règles ou messages directement dans les Paramètres.
  - **Fichier Local (`/text_files`) :** Lit automatiquement et recharge en temps réel tout fichier `.txt` placé dans le dossier `/text_files`.
  - **URL Distante :** Récupère périodiquement du texte brut depuis n'importe quelle URL.
* **Mise en Forme :** Configurez la taille de police et l'alignement du texte (haut-gauche, centré, bas-droite, etc.).

### 10. Jalons & Objectifs Intermédiaires (`Milestones & Incentives`)
* Ajoutez des objectifs de collecte avec montants et descriptions (ex. `500 $ - Défi Bean Boozled`).
* Alimente automatiquement l'overlay **Prochain Jalon** et la commande Twitch `!milestone`.

### 11. Sauvegarde de Profil & Multi-Utilisateurs (`Profile Backup & Multiple Users`)
* **Changement de Profil Participant :** Basculez entre différents streamers via le paramètre URL `?profile=PARTICIPANT_ID`. Chaque ID conserve des réglages totalement isolés.
* **Exporter les Paramètres :** Exporte la configuration du profil actif sous la forme d'un fichier `.json` téléchargeable.
* **Importer les Paramètres :** Restaure un fichier de configuration `.json` préalablement exporté.

---

## 🎥 Sources d'Overlays Navigateur OBS

| Overlay | Paramètre URL | Dimensions Conseillées | Description |
| :--- | :--- | :--- | :--- |
| **Barre de Progression** | `?overlay=progress` | 800 × 120 | Barre horizontale épurée avec total actuel, objectif et minuteur du marathon. |
| **Notifications** | `?overlay=notifications` | 500 × 200 | File d'alertes pop-up pour les nouveaux dons avec animations et son. |
| **Prochain Jalon** | `?overlay=milestone` | 600 × 100 | Barre de progression et montant restant avant le prochain objectif intermédiaire. |
| **Graphique de Progrès Annuel** | `?overlay=graph` | 880 × 420 | Graphique annuel complet avec courbe de dons cumulés et seuils de jalons. |
| **Graphique de Progrès Équipe** | `?overlay=team-graph` | 880 × 420 | Graphique d'évolution annuelle pour l'équipe entière ou un membre sélectionné. |
| **En-tête d'Équipe** | `?overlay=team-header` | 850 × 220 | Bannière d'équipe horizontale avec total récolté, objectif et nombre de donateurs. |
| **Dons d'Équipe** | `?overlay=team-donations` | 500 × 750 | Fil dédié affichant les **dons d'équipe les plus récents en premier**. |
| **Tableau de Bord Équipe** | `?overlay=team-dashboard` | 1280 × 850 | Poste de commandement plein écran avec stats d'équipe, effectif complet et fil de dons. |
| **Célébration** | `?overlay=celebration` | 1920 × 1080 | Effet de confettis plein écran déclenché lors de l'atteinte d'objectifs et de jalons. |
| **Programme du Marathon** | `?overlay=schedule` | 450 × 600 | Planning du marathon ; les segments cochés « Fait » sont barrés en direct. |
| **Sponsors** | `?overlay=sponsors` | 400 × 150 | Diaporama rotatif pour les logos de partenaires et bannières de sponsors. |
| **Affichage de Texte** | `?overlay=text` | 600 × 150 | Message personnalisé, lecteur de fichier `.txt` local ou flux texte distant. |
| **Code QR** | `?overlay=qrcode` | 260 × 320 | Badge rétro avec code QR scannable menant directement à la page de don. |

---

## 🔌 API d'Automatisation Locale (Stream Deck / Points d'accès HTTP)

Lorsque vous exécutez le serveur local (`npm start`), vous pouvez piloter le tracker via des requêtes HTTP POST :

* **Changer de Thème :** `POST http://localhost:3000/api/theme`
  * Corps JSON : `{"name": "synthwave", "profile": "534123"}`
* **Arrêter Tous les Sons & Alertes :** `POST http://localhost:3000/api/stop-events`
  * Corps JSON : `{"profile": "534123"}`
* **Simuler un Don de Test :** `POST http://localhost:3000/api/test-donation`
  * Corps JSON : `{"amount": 15, "profile": "534123"}`
* **Lister les Sponsors / Sons :**
  * `GET http://localhost:3000/api/list-sponsors`
  * `GET http://localhost:3000/api/list-sounds`
