# Ma Cave à Vin

Application de gestion de cave à vin développée avec React et Capacitor.

## Prérequis pour le Build Mobile (Android)

Pour générer l'application Android (APK), vous devez avoir configuré votre environnement de développement.

### 1. Installation des dépendances
```bash
npm install
npm install @capacitor/android @capacitor/assets
npx cap add android
```

### 2. Génération de l'icône de l'application (Bouteille de vin)

Pour que l'icône apparaisse sur le téléphone, vous devez transformer le fichier `app-icon.svg` en icônes Android natives :

1. Créez un dossier nommé `assets` à la racine (si non présent).
2. Copiez `app-icon.svg` dans `assets/icon-only.svg` et `assets/icon-background.svg`.
3. Lancez la commande suivante :
```bash
npx capacitor-assets generate --android
```
Cette commande va automatiquement créer toutes les tailles d'icônes dans le dossier `android/app/src/main/res`.

### 3. Résolution de l'erreur JAVA_HOME

Si vous rencontrez l'erreur `ERROR: JAVA_HOME is not set` :
1. Installez **Android Studio**.
2. Configurez la variable d'environnement `JAVA_HOME`.
**Windows (PowerShell) :** `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`

### 4. Générer l'APK

1. Construire l'app Web : `npm run build`
2. Synchroniser : `npx cap sync`
3. Ouvrir dans Android Studio : `npx cap open android`
4. Dans Android Studio : **Build > Build APK(s)**.

## Développement Web
`npm run dev`
