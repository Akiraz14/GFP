# Guía de validación Android — Etapa 01

Ejecutor: Juan, en Windows. Claude no puede compilar Android desde su entorno.
El script registra todo en `evidencias\ETAPA-01\<fecha-hora>\`. Claude lee esa
carpeta directamente para el informe de cierre.

## Requisitos (confirmados en G-02)

JDK 17 en `C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot`, `ANDROID_HOME`
configurado, build-tools 37.0.0, NDK 27.1.12297006, licencias aceptadas y AVD
`Pixel_4_Android_10`. No se requiere ninguna instalación adicional.

El script usa JDK 17 **solo dentro de su proceso**: tu `JAVA_HOME` global (Java 25)
no cambia.

## Paso 1 — Ejecutar el script

En PowerShell, desde la raíz del repositorio:

```powershell
cd C:\Users\juanz\Akiraz\Study\GFP
powershell -ExecutionPolicy Bypass -File scripts\validar-etapa.ps1 -Etapa 01 -IncluirRelease
```

- `-ExecutionPolicy Bypass` aplica solo a esta ejecución; no cambia la política del equipo.
- Si el emulador no está abierto, el script inicia `Pixel_4_Android_10` y espera su arranque.
- La primera compilación puede tardar bastante (descarga de dependencias de Gradle y compilación nativa para cuatro arquitecturas).
- `-IncluirRelease` compila además el APK release (firmado con la clave de depuración de la plantilla) y lo abre sin Metro, para comprobar que el APK funciona por sí solo. Es complementario.

**Resultado esperado:** todos los pasos en `OK` y código de salida 0. El resumen queda en `evidencias\ETAPA-01\<fecha-hora>\resumen.md`.

| Paso del script | Resultado esperado |
|---|---|
| JDK 17 para este proceso | Ruta del JDK 17 |
| Gradle se ejecuta con JDK 17 | `Launcher JVM: 17.0.20.1` en `gradle-version.log` |
| npm ci, tsc, ESLint, Prettier, Jest | Código 0 |
| assembleDebug | `app-debug.apk` generado y su SHA-256 |
| Dispositivo | API 29, ABI x86 |
| Puerto 8081 libre antes de Metro | `OK`. Si está ocupado, el script lo informa con el PID y no lo cierra |
| Metro en ejecucion | `OK` en pocos segundos; mientras espera muestra "Esperando a Metro... N s de 120" |
| Instalación y ejecución Debug | PID de la app (`pid-debug.txt`), texto `GFP` en `ui-debug.xml`, captura, `dispositivo-debug.txt` y logcat sin `FATAL EXCEPTION` ni `E/ReactNativeJS` |
| Cierre de Metro | `OK`, puerto 8081 libre (`metro-cierre.txt`) |
| Release (con `-IncluirRelease`) | Dispositivo disponible, `reverse-release.txt` sin redirecciones, `pid-release.txt`, `dispositivo-release.txt`, `ui-release.xml`, captura y logcat sin errores |

## Paso 2 — Comprobaciones manuales

Completa `evidencias\ETAPA-01\resultados.md`.

## Paso 3 — Avisar a Claude

Escribe "validación E01 ejecutada". Si algún paso falla, no hace falta corregirlo:
Claude analiza los registros, corrige dentro del alcance y prepara una nueva ronda.

## Android Studio (opcional)

Si abres `app\android` en Android Studio, selecciona el JDK 17 en
Settings → Build, Execution, Deployment → Build Tools → Gradle → *Gradle JDK*.
Ese ajuste aplica solo a este proyecto.

## Revalidación del script corregido

El script se corrigió el 2026-10-19 (lectura de Metro en Windows PowerShell 5.1,
límites de tiempo, progreso, puerto ocupado y cierre de Metro) y se revalidó ese
mismo día en `evidencias\ETAPA-01\20261019-194120\`. La revalidación
reutiliza las dependencias y compilaciones existentes; Gradle solo recompila lo
necesario.

Antes de ejecutar: desconectar teléfonos físicos (o usar `-Serial emulator-5554`)
y cerrar cualquier otro Metro. No cerrar la ventana de PowerShell durante la
ejecución; para interrumpir, usar Ctrl+C (así se cierra Metro).

```powershell
cd C:\Users\juanz\Akiraz\Study\GFP
powershell -ExecutionPolicy Bypass -File scripts\validar-etapa.ps1 -Etapa 01 -IncluirRelease -OmitirNpmCi
```

## Procedimiento utilizado para registrar el chequeo de formato en Windows

Tras crear `app/.prettierignore`, el chequeo se registró desde PowerShell con estos comandos:

```powershell
cd C:\Users\juanz\Akiraz\Study\GFP\app
$d = "..\evidencias\ETAPA-01\windows-format-check"; New-Item -ItemType Directory $d -Force | Out-Null
$f = "$d\format-check.log"
"Fecha: $(Get-Date -Format o)" | Out-File -Encoding utf8 $f
"> npm run format:check" | Out-File -Encoding utf8 -Append $f
cmd /c "npm run format:check 2>&1" | Out-File -Encoding utf8 -Append $f
"< codigo de salida: $LASTEXITCODE" | Out-File -Encoding utf8 -Append $f
Get-Content $f
```

Resultado esperado: `All matched files use Prettier code style!` y `codigo de salida: 0`.

Registro ejecutado el 2026-10-21: `evidencias\ETAPA-01\windows-format-check\format-check.log`
(resultado esperado obtenido, código de salida 0).
