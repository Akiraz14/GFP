# Guía de instalación y ejecución de GFP

Aplicación Android (React Native 0.87.1, TypeScript), sin backend, con base local cifrada
(SQLCipher) y OCR local (ML Kit). Requiere **Android 10 (API 29) o superior**.

## 1. Requisitos en Windows

| Herramienta | Versión |
|---|---|
| Node.js y npm | Los del proyecto (`app/package.json`; `npm ci` usa `package-lock.json`) |
| JDK | 17 (solo para el proceso de compilación; los scripts lo detectan o reciben `-Jdk17Path`) |
| Android SDK | `compileSdk` 37, `buildToolsVersion` 37.0.0, NDK del proyecto (`app/android/build.gradle`) |
| Emuladores de la validación | Android 10 (API 29) y Android 14 (API 34) |

## 2. Controles y pruebas

Desde la raíz del repositorio, con el árbol limpio:

```powershell
$Ev = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\correcciones"
New-Item -ItemType Directory -Force $Ev | Out-Null
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Test-ScriptSyntax.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-07\tests\Test-ApkBadging.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-StaticChecks.ps1 -ExpectedBranch main -ExpectedTests 651 -EvidenceRoot $Ev
```

`Invoke-StaticChecks.ps1` ejecuta `npm ci`, `typecheck`, `lint`, `format:check` y Jest. Desde las
correcciones de Android 10 de 2026-11-06 (`correcciones-android10.md`) se esperan 651 pruebas en `main`.

## 3. APK Debug

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-AndroidBuild.ps1 -EvidenceRoot $Ev
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-07\Invoke-Hu4ApkCheck.ps1 -EvidenceRoot $Ev
```

El APK queda en `app\android\app\build\outputs\apk\debug\app-debug.apk` y su SHA-256 en
`apk-debug.txt` de la carpeta de evidencias. El Debug necesita Metro (`npm start` desde `app/`)
para cargar el JavaScript.

## 4. Clave release propia (una sola vez, D-06)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\release\New-ReleaseKey.ps1
```

Crea `%USERPROFILE%\.gfp-release\gfp-release.jks` con el alias `gfp-release`. `keytool` pide las
contraseñas y los datos del certificado; el script no las ve ni las guarda. Haga una copia de
seguridad de la clave y de sus contraseñas fuera del equipo: sin ellas no se pueden firmar
actualizaciones.

## 5. APK Release firmado

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\release\Invoke-ReleaseBuild.ps1 -EvidenceRoot $Ev
```

Pide las contraseñas (sin mostrarlas), compila `assembleRelease` y verifica: firma con
`apksigner` y que no sea la clave de depuración, `applicationId` `co.gfpsas.gestionfinanciera`,
`minSdkVersion` 29, que no sea depurable, los permisos y que incluya
`assets/index.android.bundle`. Resultado esperado: sin FAIL. El APK queda en
`app\android\app\build\outputs\apk\release\app-release.apk` y su SHA-256 en `apk-release.txt`.

Sin la clave, `assembleRelease` produce un APK sin firmar; nunca se firma con la clave de
depuración.

## 6. Instalación en un dispositivo o emulador

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices
& $adb install -r "app\android\app\build\outputs\apk\release\app-release.apk"
```

En un teléfono: active la depuración USB o copie el APK y permita instalar aplicaciones de
origen desconocido. La primera apertura crea la base cifrada y su clave en el Android Keystore.
Desinstalar la app borra la base y la clave: los datos no se pueden recuperar (no hay copia en la
nube ni copia de seguridad de Android: `allowBackup="false"`).

## 7. Validación manual final

Siga `validacion/guia-pruebas-manuales-finales.md` en Android 10 y 14.
