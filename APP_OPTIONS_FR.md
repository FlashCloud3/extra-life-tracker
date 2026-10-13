# Suivi Extra Life - Référence Détaillée des Options et Paramètres

Ce document fournit une description exhaustive de toutes les vues de navigation, options de configuration, sources d'overlays OBS, dossiers de fichiers multimédias et points d'accès API.

---

## 1. Vues Principales de l'Interface

L'application propose trois vues principales accessibles depuis la barre de navigation supérieure :

### 👤 1. Tableau de Bord Participant (`Participant Dashboard`)
- **Statistiques en direct** : Total récolté, objectif, barre de progression dynamique avec pourcentage et montant restant.
- **Chronomètre Marathon** : Minuteur d'heures écoulées avec boutons Démarrer / Pause / Réinitialiser.
- **Dons Récents** : Liste en direct des donateurs, montants donnés et messages d'encouragement.
- **Jalons / Milestones** : Liste des objectifs intermédiaires de collecte (avec statut débloqué / en attente).
- **Contrôles de Test en Direct** :
  - `Test Donation (+$15)` : Simule un don avec déclenchement instantané de l'alerte sonore et visuelle.
  - `Test Big Donation (+$100)` : Simule un don majeur avec confettis et fanfare.
  - `Resync Data` : Force une nouvelle requête immédiate vers l'API DonorDrive.

### 👥 2. Tableau de Bord Équipe (`Team Dashboard`)
- **Statistiques d'équipe** : Total collectif récolté, objectif d'équipe et nombre de membres actifs.
- **Classement des Membres** : Liste des participants de l'équipe classés par montant récolté.
- **Dons d'Équipe en Direct** : Liste de tous les dons reçus par les membres de l'équipe, **triés par défaut du plus récent au plus ancien**.
- **Mode Overlay Équipe** : Lien direct pour afficher ce tableau sous forme d'overlay pour OBS (`?overlay=team-dashboard`).

### ⚙️ 3. Panneau de Configuration (`Settings`)
Accès complet à tous les paramètres de l'application, organisés en 7 sections :

---

## 2. Guide Détaillé des Paramètres (Settings Panel)

### Section 1 : Configuration DonorDrive (Extra Life)
| Paramètre | Description | Exemple / Valeur par défaut |
| :--- | :--- | :--- |
| **Participant ID** | Votre identifiant numérique de participant Extra Life. Trouvable dans l'URL de votre page de collecte. | `554030` |
| **Team ID** | *(Optionnel)* L'identifiant de votre équipe Extra Life. Laissez vide si vous participez en solo. | `66000` |
| **Polling Interval** | Intervalle en secondes entre deux actualisations automatiques des données DonorDrive. | `30` secondes (recommandé entre 15 et 60s) |
| **Currency Symbol** | Symbole monétaire affiché devant tous les montants. | `$`, `€`, `£`, `CAD` (défaut : `$`) |

---

### Section 2 : Alertes & Audio
| Paramètre | Description | Exemple / Valeur par défaut |
| :--- | :--- | :--- |
| **Alert Sound URL** | Chemin ou URL du fichier audio joué lors d'un don. Utilisez `/sounds/alert.mp3` ou une URL directe. Si vide, un son synthétisé Web Audio rétro est utilisé. | `/sounds/alert.mp3` |
| **Alert Volume** | Volume sonore de l'alerte entre 0% et 100%. | `80%` |
| **Alert Duration** | Temps en secondes pendant lequel la bannière d'alerte reste visible à l'écran. | `8` secondes |
| **Sound Preset Selector** | Permet de choisir rapidement un son parmi les fichiers intégrés (`alert.mp3`, `coin.mp3`, `fanfare.mp3`, `chime.mp3`, `celebration.mp3`). | Menu déroulant |
| **Min. Amount for Alert** | Montant minimum requis pour qu'une alerte sonore/visuelle se déclenche. | `1.00` |
| **Test Sound Button** | Écoute immédiate du son configuré sans simuler un faux don. | Bouton de prévisualisation |

---

### Section 3 : Intégration Twitch
| Paramètre | Description | Exemple / Valeur par défaut |
| :--- | :--- | :--- |
| **Twitch Integration** | Interrupteur d'activation de la connexion au chat Twitch. | Activé / Désactivé |
| **Channel Name** | Le nom de votre chaîne Twitch (sans `#` ni espace). | `MonPseudoStream` |
| **OAuth Token** | *(Optionnel)* Jeton OAuth Twitch (format `oauth:xxxxxx`) si vous souhaitez que le tracker écrive des réponses dans votre chat. | Optionnel |
| **Statut de Connexion** | Affiche l'état en direct : 🟢 Connecté, 🟡 En connexion, ⚪ Non configuré, 🔴 Erreur. | Indicateur en temps réel |
| **Commandes Actives** | Liste des commandes reconnues : `!donate`, `!total`, `!goal`, `!team`, `!schedule`, `!incentives`. | Automatique |

---

### Section 4 : Programme du Marathon (Schedule)
| Paramètre | Description | Utilisation |
| :--- | :--- | :--- |
| **Heure de début / Fin** | Horaires de chaque créneau de jeu ou d'animation. | Ex: `08:00 - 10:00` |
| **Titre du Jeu / Activité** | Nom du jeu joué ou de l'animation prévue. | Ex: `Super Mario World - Speedrun` |
| **Joueurs / Invités** | Personnes présentes sur le segment. | Ex: `Alex & Sarah` |
| **Statut (Terminé / En cours)** | Possibilité de cocher les segments terminés pour les biffer automatiquement sur l'overlay OBS. | Case à cocher |

---

### Section 5 : Sponsors & Partenaires (Sponsors Carousel)
| Paramètre | Description | Utilisation |
| :--- | :--- | :--- |
| **Nom du Sponsor** | Nom de la marque ou du partenaire. | Ex: `Local Gaming Store` |
| **Image URL** | Chemin local (ex: `/sponsors/sponsor1.png`) ou lien web vers le logo. | Fichier image |
| **Intervalle de rotation** | Temps en secondes avant de passer au sponsor suivant sur l'overlay. | `10` secondes |

---

### Section 6 : Messages Texte & Annonces (Text Overlay)
| Paramètre | Description | Utilisation |
| :--- | :--- | :--- |
| **Message Actif** | Texte libre affiché dans l'overlay `?overlay=text`. | Idéal pour règles de défi, objectifs, sous-titres |
| **Style & Police** | Rendu avec fond rétro semi-transparent et texte stylisé. | Automatique |

---

### Section 7 : Sauvegarde & Réinitialisation
- **Export Configuration (JSON)** : Télécharge l'ensemble de vos paramètres sous forme de fichier JSON pour pouvoir les restaurer rapidement ou les partager avec votre équipe.
- **Import Configuration** : Charge un fichier de configuration préalablement exporté.
- **Reset to Defaults** : Réinitialise toutes les options aux réglages d'origine.

---

## 3. Répertoire des Overlays OBS

Pour intégrer un élément dans OBS Studio, créez une source **Navigateur** (*Browser Source*) avec l'URL correspondante :

| Nom de l'Overlay | URL de la Source | Dimensions Conseillées | Rôle Principal |
| :--- | :--- | :--- | :--- |
| **Alerte de Don** | `http://localhost:3000/?overlay=alert` | 600 × 250 px | Affiche le nom du donateur, le montant et le message avec animation pop-in. |
| **Barre de Progression** | `http://localhost:3000/?overlay=progress` | 800 × 90 px | Jauge épurée avec montant collecté, objectif et % d'avancement. |
| **En-tête Stream Complet** | `http://localhost:3000/?overlay=header` | 1920 × 120 px | Barre supérieure tout-en-un (Logo Extra Life, jauge, stats, dernier donateur). |
| **Liste des Derniers Dons** | `http://localhost:3000/?overlay=donations` | 400 × 500 px | Liste défilante des dons récents avec messages. |
| **Incitations / Récompenses** | `http://localhost:3000/?overlay=incentives` | 400 × 500 px | Liste des paliers de récompense (ex: choisir un jeu, porter un déguisement). |
| **Jalons / Milestones** | `http://localhost:3000/?overlay=milestones` | 400 × 500 px | Jalons financiers avec jauge de déblocage. |
| **En-tête d'Équipe** | `http://localhost:3000/?overlay=team-header` | 1920 × 120 px | Statistiques collectives d'équipe complètes. |
| **Dons d'Équipe** | `http://localhost:3000/?overlay=team-donations` | 450 × 600 px | Dons d'équipe avec nom du participant bénéficiaire (du plus récent au plus ancien). |
| **Tableau Équipe Complet** | `http://localhost:3000/?overlay=team-dashboard` | 1280 × 720 px | Overlay complet dédié aux statistiques d'équipe pour les scènes d'entracte. |
| **Programme du Marathon** | `http://localhost:3000/?overlay=schedule` | 450 × 600 px | Planning des créneaux horaires avec surlignage du créneau actif. |
| **Carrousel Sponsors** | `http://localhost:3000/?overlay=sponsors` | 400 × 150 px | Défilement automatique des logos de vos sponsors. |
| **Zone de Texte / Annonces** | `http://localhost:3000/?overlay=text` | 600 × 150 px | Affiche en direct le message d'annonce saisi dans vos paramètres. |
| **Badge Code QR** | `http://localhost:3000/?overlay=qrcode` | 260 × 320 px | Code QR pointant directement vers votre page de don Extra Life. |
| **Célébration Plein Écran** | `http://localhost:3000/?overlay=celebration` | 1920 × 1080 px | Explosion de confettis sur tout l'écran pour les moments forts du stream. |

---

## 4. Dossiers d'Actifs Locaux (`public/sounds` et `public/sponsors`)

### Sons (`public/sounds/`)
- `alert.mp3` : Effet sonore standard lors d'un don.
- `coin.mp3` : Bruitage rétro de pièce de monnaie style arcade.
- `fanfare.mp3` : Fanfare triomphale pour les gros dons ou franchissements de paliers.
- `celebration.mp3` : Thème de fête pour les victoires d'objectifs.
- `chime.mp3` : Carillon discret et mélodieux.

### Logos Sponsors (`public/sponsors/`)
- `sponsor1.png` à `sponsor4.png` : Bannières prêtes à l'emploi.
- Remplacez simplement ces images par les logos de vos propres partenaires ou ajoutez vos propres fichiers.
