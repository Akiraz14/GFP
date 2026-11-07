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

Desde la raíz del repositorio, con el árbol limpio (`Invoke-StaticChecks.ps1` se detiene si hay
cambios sin confirmar):

```powershell
$Ev = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\correcciones"
New-Item -ItemType Directory -Force $Ev | Out-Null
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Test-ScriptSyntax.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-07\tests\Test-ApkBadging.ps1
$ExpectedTests = 712   # total registrado el 2026-11-07; consulte el número real antes de usarlo
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-StaticChecks.ps1 -ExpectedBranch main -ExpectedTests $ExpectedTests -EvidenceRoot $Ev
```

`Invoke-StaticChecks.ps1` ejecuta `npm ci`, `typecheck`, `lint`, `format:check` y Jest, y compara
el número de pruebas aprobadas con `-ExpectedTests`. Cómo consultar el número real y ejecutar las
pruebas por archivo o por nombre: `testing/guia-pruebas-automatizadas.md`.

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

El APK Release lleva el bundle JavaScript: se instala y se abre sin Metro, sin servidor y sin USB
permanente. El APK final de entrega se copia a
`C:\Users\juanz\Akiraz\Study\GFP Proyecto\entregables\` (`cierre-proyecto.md`, sección 10).

**Actualizar o desinstalar.** Android solo actualiza una app si el APK nuevo tiene el mismo
paquete y la misma firma, y una `versionCode` igual o mayor. Con el Release firmado con
`gfp-release`, `adb install -r` (o abrirlo desde el administrador de archivos y elegir
«Actualizar») conserva la base cifrada y los datos. Si el teléfono tiene un APK Debug (firmado con
la clave de depuración) o uno firmado con otra clave, la instalación falla con
`INSTALL_FAILED_UPDATE_INCOMPATIBLE`; solo entonces hay que desinstalar, y desinstalar borra la
base y su clave: los datos no se pueden recuperar (no hay copia en la nube ni copia de seguridad de
Android: `allowBackup="false"`).

Con ADB (depuración USB activada en el teléfono):

```powershell
$Adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$Pkg = "co.gfpsas.gestionfinanciera"
$Apk = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\entregables\GFP-Android-Release-v1.0.apk"
Test-Path $Apk; Get-FileHash $Apk -Algorithm SHA256
& $Adb devices                                   # el teléfono debe aparecer como «device»
& $Adb shell getprop ro.build.version.sdk        # 29 en Android 10
& $Adb shell pm list packages $Pkg               # vacío si la app no está instalada
& $Adb install -r $Apk                           # Success; conserva los datos si la firma coincide
& $Adb shell pm list packages $Pkg               # package:co.gfpsas.gestionfinanciera
& $Adb shell dumpsys package $Pkg | Select-String "versionName|versionCode|minSdk|targetSdk"
& $Adb shell monkey -p $Pkg -c android.intent.category.LAUNCHER 1
```

Si `install -r` devuelve `INSTALL_FAILED_UPDATE_INCOMPATIBLE` y acepta perder los datos locales:
`& $Adb uninstall $Pkg` y después `& $Adb install $Apk`.

Registros si algo falla:

```powershell
& $Adb logcat -c
& $Adb shell monkey -p $Pkg -c android.intent.category.LAUNCHER 1
# ...reproducir el problema...
& $Adb shell "logcat -d -v time > /sdcard/gfp-logcat.txt"
& $Adb pull /sdcard/gfp-logcat.txt "$env:USERPROFILE\Desktop\gfp-logcat.txt"
& $Adb shell rm /sdcard/gfp-logcat.txt
```

El volcado se guarda en el dispositivo y se descarga con `adb pull`: redirigir con `>` en Windows
PowerShell 5.1 crea archivos UTF-16.

Sin ADB: copie el APK al teléfono (cable USB en modo «Transferencia de archivos», Google Drive o
correo), ábralo desde el administrador de archivos (Archivos › Descargas), autorice
«Instalar apps desconocidas» para esa aplicación cuando Android lo pida y pulse «Instalar» (o
«Actualizar»). Ábrala desde el ícono «GFP».

## 7. Pruebas

- Pruebas en el emulador (arranque en frío, instalación, Metro, logs, capturas y cierre):
  `testing/guia-pruebas-emulador-android.md`.
- Pruebas automatizadas (Jest): `testing/guia-pruebas-automatizadas.md`.
- `validacion/guia-pruebas-manuales-finales.md` es la guía histórica de la validación integral
  HU1–HU10 posterior a la consolidación; sus escenarios siguen siendo válidos como referencia.
