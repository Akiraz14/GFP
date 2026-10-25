# Fundamentos de identidad y seguridad — Claude (Linux), 2026-10-25

Árbol validado: el código de la WU del 2026-10-25 sobre `main` (`a9b86dc`), antes de su
compilación en Android. Entorno: Node 22.22.0, npm 10.9.4 y JDK 21.0.12.1 (Linux). No
incluye compilación Android, que no está disponible en este entorno.

| Paso | Comando | Código | Evidencia |
|---|---|---|---|
| Instalación | `npm ci --no-audit --no-fund` | 0 | `ci.log` |
| Tipos | `npm run typecheck` | 0 | `typecheck.log` |
| Lint (incluye E02-RNG y `no-console` en `src/`) | `npm run lint` | 0 | `lint.log` |
| Formato | `npm run format:check` | 0 | `format-check.log` |
| Pruebas | `npx jest --ci --verbose` | 0 (13 suites, 74 pruebas) | `jest.log` |
| Auditoría | `npm audit --json` (sin `fix`) | 0 (0 vulnerabilidades) | `npm-audit.json` |
| PBKDF2 nativo | `javac` sobre `Pbkdf2HmacSha256.java`, `HexCodec.java` y `Pbkdf2Calibration.java`; ejecución con 600 000 iteraciones y 5 muestras | 0 (5/5 vectores) | `pbkdf2-java-vectors.txt` |
| Codegen | `generate-specs-cli.js` de React Native 0.87.1, el mismo que ejecuta Gradle | 0 | `codegen-output.txt` |

Los tiempos de `pbkdf2-java-vectors.txt` proceden de un JDK de escritorio con el
proveedor `SunJCE`. No sustituyen la calibración P-D1 en un dispositivo Android.

Jest sustituye el módulo nativo `GfpCrypto` por `crypto.pbkdf2Sync` de Node y usa SQLite
de Node (`node:sqlite`) en memoria para las migraciones, la recuperación y el
aislamiento. SQLCipher, Keychain y `RNGetRandomValues` se prueban con dobles.
