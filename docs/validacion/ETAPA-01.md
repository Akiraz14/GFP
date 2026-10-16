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
| Metro, instalación, ejecución | PID de la app, texto `GFP` en `ui-debug.xml`, captura y logcat sin `FATAL EXCEPTION` ni `E/ReactNativeJS` |

## Paso 2 — Comprobaciones manuales

Completa `evidencias\ETAPA-01\resultados.md`.

## Paso 3 — Avisar a Claude

Escribe "validación E01 ejecutada". Si algún paso falla, no hace falta corregirlo:
Claude analiza los registros, corrige dentro del alcance y prepara una nueva ronda.

## Android Studio (opcional)

Si abres `app\android` en Android Studio, selecciona el JDK 17 en
Settings → Build, Execution, Deployment → Build Tools → Gradle → *Gradle JDK*.
Ese ajuste aplica solo a este proyecto.
