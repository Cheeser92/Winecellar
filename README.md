
# Ma Cave à Vin

Application de gestion de cave à vin développée avec React et Capacitor.

## ☁️ Sauvegardes Cloud (iCloud & Google Drive)

L'application permet de sauvegarder automatiquement votre base de données sur les services Cloud.

### 🍎 Sur iPhone (iOS)
Pour que les sauvegardes apparaissent dans votre **iCloud Drive** :
1.  Ouvrez le projet dans Xcode.
2.  Allez dans l'onglet **Info** et vérifiez que ces clés sont présentes :
    *   `UIFileSharingEnabled` : **YES**
    *   `LSSupportsOpeningDocumentsInPlace` : **YES**
3.  **IMPORTANT** : Dans Xcode, activez la Capability **iCloud** pour votre projet et cochez **iCloud Documents**.
4.  Dans l'application, choisissez le répertoire **"Cloud (iCloud / Drive)"**. Vos fichiers apparaîtront dans l'application **Fichiers** de l'iPhone sous `Sur mon iPhone > My Wine Cellar` et seront synchronisés si iCloud est actif.

### 🤖 Sur Android
Pour que les sauvegardes soient synchronisées avec **Google Drive** :
1.  Dans l'application, choisissez le répertoire **"Cloud (iCloud / Drive)"**.
2.  Le fichier est enregistré dans le dossier `Documents` public de votre téléphone.
3.  Ouvrez l'application **Google Drive** sur votre téléphone, allez dans les paramètres et assurez-vous que la synchronisation des dossiers de l'appareil est activée, ou utilisez une application comme "AutoSync for Google Drive" pour lier ce dossier spécifique.

## 🛠 Prérequis pour le Build Mobile (Android)

... (étapes inchangées)
