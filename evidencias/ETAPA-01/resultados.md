# Resultados manuales — Etapa 01

**Ejecutado por:** Juan  
**Fecha de las comprobaciones:** 19/10/2026  
**Carpeta de evidencias:** `evidencias/ETAPA-01/20261016-152425/` (las rutas de la columna "Evidencia" son relativas a esta carpeta)  
**Dispositivo:** `Pixel_4_Android_10` — Android 10, API 29 (`emulator-5554`)

Contenido de la carpeta de evidencias:

- Raíz: ejecución del script del 16/10/2026 (calidad, pruebas y compilación Debug).
- `reanudacion/`: validación manual Debug (16/10/2026) y Release (19/10/2026).
- `complementarias-20261019/`: comprobaciones M1 y M4 (19/10/2026).

## Resultados M1–M4

| ID | Comprobación | Resultado esperado | Resultado | Observaciones | Evidencia |
|---|---|---|---|---|---|
| M1 | Lanzador del emulador `Pixel_4_Android_10` | Aparece la app con el nombre “GFP” | OK | La captura del cajón de aplicaciones muestra el icono y el nombre GFP. | `complementarias-20261019/captura-lanzador.png` |
| M2 | Abrir la app (APK Debug, Metro activo) | Muestra “GFP” y “Gestión Financiera Personal”, sin pantalla roja de error | OK | Instalación `Success`; la app abrió con PID `5575`; el XML de UI contiene ambos textos y el logcat registra `Running "GFP"`. No se encontraron `FATAL EXCEPTION`. El PID coincide con el registrado en el logcat. | `reanudacion/captura-debug.png`, `reanudacion/ui-debug.xml`, `reanudacion/logcat-debug.txt`, `reanudacion/instalar-debug.log` |
| M3 | Abrir la app (APK Release, sin Metro) | Muestra la misma pantalla sin Metro | OK | `assembleRelease` terminó con `BUILD SUCCESSFUL` en 4m 55s; instalación `Success`; la app abrió con PID `6012`; el XML contiene ambos textos. El PID coincide con el registrado en el logcat. Metro estaba detenido y se ejecutó `adb reverse --remove-all` antes de instalar/abrir Release (observado por Juan; no registrado en archivo). | `reanudacion/captura-release.png`, `reanudacion/ui-release.xml`, `reanudacion/logcat-release.txt`, `reanudacion/gradle-assembleRelease.log`, `reanudacion/instalar-release.log` |
| M4 | Información de la app en Ajustes → Apps → GFP | Paquete `co.gfpsas.gestionfinanciera` | Verificación técnica OK; comprobación literal en Ajustes no disponible | La captura de Ajustes muestra GFP y versión 1.0, pero Android no muestra el identificador del paquete en esa pantalla. El comando `aapt2 dump badging` confirma el paquete esperado. No afirmar que se vio el identificador literalmente en Ajustes. Los XML de la interfaz registran `package="co.gfpsas.gestionfinanciera"`. | `complementarias-20261019/captura-ajustes-gfp.png`, `complementarias-20261019/salida-aapt2.txt`, `reanudacion/ui-debug.xml`, `reanudacion/ui-release.xml` |

## Resultado del comando `aapt2`

Comando ejecutado desde la raíz del repositorio:

```powershell
& "$env:ANDROID_HOME\build-tools\37.0.0\aapt2.exe" dump badging `
    app\android\app\build\outputs\apk\release\app-release.apk |
    Select-String "package:|application-label:|minSdkVersion"
```

Salida observada en consola (filtrada por `Select-String`):

```text
package: name='co.gfpsas.gestionfinanciera' versionCode='1' versionName='1.0' platformBuildVersionName='17'
platformBuildVersionCode='37' compileSdkVersion='37' compileSdkVersionCodename='17'
minSdkVersion:'29'
application-label:'GFP'
```

La salida completa sin filtrar está en `complementarias-20261019/salida-aapt2.txt` (UTF-16). Además de lo anterior, registra `targetSdkVersion:'36'`, el permiso `android.permission.INTERNET`, `launchable-activity: name='co.gfpsas.gestionfinanciera.MainActivity'` y `native-code: 'arm64-v8a' 'armeabi-v7a' 'x86' 'x86_64'`.

## Identificadores y hashes de los APK

| APK | Ejecución | SHA-256 |
|---|---|---|
| Debug | `20261016-152425` (16/10/2026) | `086163609A5CA26347D8710CF8697DF634FDD928C13BAD447B21762A96E184D2` |
| Debug | `20261019-194120` (19/10/2026) | `8EB6D5A0D3317A852ACA7A0A560459E579F25BBD1238B90388CED32BF39B395E` |
| Release | `reanudacion/` (19/10/2026) | `D39154D3AE285AE089BFBF7AC53E7997B7CB1C905D27ED53982B721801E4FA05` |
| Release | `20261019-194120` (19/10/2026) | `D39154D3AE285AE089BFBF7AC53E7997B7CB1C905D27ED53982B721801E4FA05` |

- **Application ID:** `co.gfpsas.gestionfinanciera`
- **Etiqueta declarada en APK:** `GFP`
- **SDK mínimo:** API 29

## Notas

- Debug: Android 10/API 29 registrado en `dispositivo.txt` (16/10/2026). Release: API 29 (`emulator-5554`) observada por Juan con `adb`; no quedó registrada en archivo en esa sesión.
- En la sesión de Release, ADB inicialmente no detectó el emulador. Se inició nuevamente; luego `adb devices` mostró `emulator-5554` en estado `device` (observado por Juan; no registrado en archivo).
- La comprobación de Ajustes no expuso visualmente el identificador del paquete. La configuración del paquete sí quedó comprobada técnicamente con `aapt2` y en el XML de la interfaz.
- La validación de Metro en Windows PowerShell 5.1 identificó que `Invoke-WebRequest` devuelve `System.Byte[]` para `/status`, aunque `curl.exe` devuelve HTTP 200 y `packager-status:running`. La corrección del script se aplicó el 19/10/2026 y se revalidó en la ejecución `../20261019-194120/` (Metro listo en 5 s; ver `resumen.md` de esa carpeta).
- En la revalidación `../20261019-194120/` quedaron registrados en archivo los datos de M3 que en la sesión manual solo observó Juan: Metro cerrado y puerto 8081 libre antes de Release (`metro-cierre.txt`), ninguna redirección `adb reverse` activa (`reverse-release.txt`, lista vacía) y Android 10/API 29 en la sesión Release (`dispositivo-release.txt`).
- Este archivo registra los resultados observados y no representa por sí solo la aprobación formal ni el cierre de la Etapa 01.

## Integridad de las evidencias complementarias

| Archivo | SHA-256 |
|---|---|
| `complementarias-20261019/captura-lanzador.png` | `1405b645accda531805323e4f058b2086357a267402e22e398cf2dd65cbf84f4` |
| `complementarias-20261019/captura-ajustes-gfp.png` | `69bf581627af9fd7ae75842282b07f9244243592d4f3505fad75248dc9fca5f7` |
| `complementarias-20261019/salida-aapt2.txt` | `ae3759faac716f55b642b57a0550da19c2a4f4e8017683899e4fd0dfe2141ff1` |
