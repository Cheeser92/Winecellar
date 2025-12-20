# Ma Cave à Vin

Application de gestion de cave à vin développée avec React et Capacitor.

## Prérequis pour le Build Mobile (Android)

Pour générer l'application Android (APK) avec le bon logo, suivez ces étapes :

### 1. Installation des dépendances
```bash
npm install
npm install @capacitor/android @capacitor/assets
npx cap add android
```

### 2. Génération des icônes et splash screen

Le dossier `/assets` contient déjà les fichiers sources optimisés (`icon-background.svg`, `icon-only.svg`, etc.). Pour générer les ressources natives :

1. Assurez-vous d'être à la racine du projet.
2. Lancez la commande suivante :
```bash
npx capacitor-assets generate --android
```
Cette commande va transformer les fichiers du dossier `assets` en ressources Android (`mipmap` pour le launcher et `drawable` pour le splash screen) dans le dossier `android/app/src/main/res`.

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