# Evidencias de la Etapa 02 — manifiesto

Cierre: `docs/cierre-etapa-02.md`. Criterios: `docs/trazabilidad.md` (E02-C1 a E02-C7).

| Carpeta | Contenido | Ejecutado por | Versionado |
|---|---|---|---|
| `V4/` | Ejecución V4 del protocolo `poc-stage02.ps1` sobre `6caa2acc882965d68a37f87992c0a6136c7db4fa`, 2026-10-23, `emulator-5554` (API 34): `summary.md`, `results.json`, logs, pasos y análisis de privacidad | Juan (Windows) | Sí, excepto lo indicado abajo |
| `claude-20261023/` | Validación del árbol `app/` de `main` integrado: `npm ci`, tsc, ESLint, Prettier, Jest, regla E02-RNG y `npm audit` | Claude (Linux) | Sí |
| `windows-debug-20261025/` | Compilación Debug de `main` (`cbef19f`) en Windows con JDK 17, en el worktree `GFP Proyecto\GFP-e02-int`: entorno, `npm ci`, calidad, Jest, Gradle, `aapt2`, hashes de los APK de la Etapa 01 y estado del repositorio antes y después | Juan (Windows), script `stage02-debug-validation.ps1` | Sí |
| `archivo-spike-v4/` | Copia de archivo del protocolo y las herramientas de la rama experimental | — | Sí, como archivo experimental no integrable |

## Procedencia de `V4/`

Copia de `GFP-spike02-evidencias\20261023-163848-6caa2ac\`, que está fuera del repositorio.
Los 69 archivos de esa carpeta son idénticos byte a byte a los de `V4/` en la carpeta de
trabajo (SHA-256 comparados el 2026-10-23). En Git, los 49 archivos versionados se guardan
con finales de línea LF por la regla `* text=auto eol=lf` de `.gitattributes`, igual que las
evidencias de la Etapa 01. 48 de ellos tenían CRLF en el original, y los 49 coinciden con el
original una vez convertido CRLF a LF. Los logs conservan los espacios finales de la salida
original. El análisis de privacidad (`V4/sensitive-scan.md`) revisó 17
archivos sin exposiciones. Los logs contienen rutas locales de Windows del equipo de
ejecución, igual que las evidencias de la Etapa 01. `V4/steps/` registra la huella
SHA-256 del secreto de prueba del emulador, no el secreto.

## Archivos no versionados

| Archivo | Motivo | Tamaño (bytes) | SHA-256 |
|---|---|---|---|
| `V4/app-release.apk` | Binario de 128 MiB; excluido por la regla `*.apk` de `.gitignore`. Es el Release compilado en la ruta corta `C:\gfp-v4-short` desde `6caa2ac`, solo instalado y abierto; no se usó en las pruebas Release de `V4/summary.md` (APK `DD54C93E…`) | 134674262 | `819ef8cc366b1d7e0feea8bbbf9883a88332f929c0201ac0533aea9d2bbfd3c7` |
| `V4/db-copies/` (20 archivos) | Copias binarias de las bases de datos del emulador, extraídas para `at-rest.txt`: datos sintéticos, cifradas salvo el control positivo `poc-canary-v2.db` (texto `GFP-POC-CANARY-rmvlhyhf8`). Sus hashes ya constan en `V4/at-rest.txt`; no aportan trazabilidad adicional. Excluidas en `.gitignore` | Ver tabla siguiente | Ver tabla siguiente |

| Original en el emulador | Copias | Tamaño (bytes) | SHA-256 |
|---|---|---|---|
| `poc-canary-v2.db` | A, B, C, D | 8192 | `672f3fb19d417f7dce6f3bb68293bec7e1512220f835cec6dbacdf8195093ca3` |
| `poc-p1-passphrase-v2.db` | A, B, C | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `poc-p1-v2.db` | A, B, C, D | 8192 | `86a64292e1f504232e621a8c21045478ab08a78eba39f28d9bdc280985f2b83f` |
| `poc-p1-wrong-key-v2.db` | A, B, C | 8192 | `ea2775cc2337c1fc9b9b9e22eb3049dff5b947ca32396239f17f4d044e8d4868` |
| `poc-p1b-v2.db` | A, B, C | 8192 | `755ac3d9036cdc5cc4a381f1311e927a49f5078505191cf83934737023def8e6` |
| `poc-p1b-wrong-key-v2.db` | A, B, C | 8192 | `4599ebe4ad6b6643c4830aa9c4f1285cffd59e65a908d3d2d2a8d1ef7667b3d8` |

Los archivos no versionados permanecen en esta carpeta del equipo de trabajo; no se
eliminaron.

## Evidencias externas

| Ubicación | Contenido |
|---|---|
| `GFP-spike02-evidencias\` (junto al repositorio) | Ejecuciones V2 (`8b64ccb`), V3 (`abd4804`) y V4 (`6caa2ac`), e imágenes sintéticas `ocr-sinteticas-v1` |
| `Informe_Cierre_Tecnico_Stage02_V4.docx` (junto al repositorio) | Informe de cierre técnico V4 |
| `refs/revision/spike-02-v4` (`6caa2ac`) | Código de las pruebas de concepto; no integrado en `main` |
| `GFP-spike02-evidencias\integration-debug-20261025-093725\` | Original de `windows-debug-20261025/` (18 archivos, iguales salvo la conversión de CRLF a LF en Git) |
| `GFP Proyecto\GFP-e02-int\app\android\app\build\outputs\apk\debug\app-debug.apk` | APK Debug de `main`, no versionado: 206057040 bytes, SHA-256 `0aef5c750b2b7d53e9162176f054e6cb859c26752292eab30552b492b17bebac` |
