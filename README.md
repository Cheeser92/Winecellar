# Ma Cave à Vin

Application de gestion de cave à vin développée avec React et Capacitor.

## Prérequis pour le Build Mobile (Android)

Pour générer l'application Android (APK), vous devez avoir configuré votre environnement de développement.

### 1. Installation des dépendances
```bash
npm install
npm install @capacitor/android
npx cap add android
```

### 2. Résolution de l'erreur JAVA_HOME

Si vous rencontrez l'erreur `ERROR: JAVA_HOME is not set`, cela signifie que le JDK (Java Development Kit) n'est pas trouvé.

**Solution :**
1. Installez **Android Studio** (ou OpenJDK 17).
2. Configurez la variable d'environnement `JAVA_HOME`.

**Sur Windows (PowerShell) :**
```powershell
# Exemple si vous utilisez le JDK inclus dans Android Studio (vérifiez votre chemin réel)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```
Pour le rendre permanent, ajoutez-le dans les "Variables d'environnement système" de Windows.

**Sur macOS/Linux :**
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

### 3. Générer l'APK

Une fois l'environnement configuré :

1. Construire l'application Web :
   ```bash
   npm run build
   ```

2. Synchroniser avec Capacitor :
   ```bash
   npx cap sync
   ```

3. Ouvrir le projet dans Android Studio pour générer l'APK :
   ```bash
   npx cap open android
   ```
   Dans Android Studio, allez dans **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

## Développement Web

Pour lancer l'application dans le navigateur :
```bash
npm run dev
```
