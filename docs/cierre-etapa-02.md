# Cierre de la Etapa 02 — Fundamentos técnicos compartidos

**Veredicto: cierre técnico aceptado con reservas (E02-CIERRE).** Los fundamentos críticos
tienen pruebas y evidencias verificables en emulador, la PoC de OCR demuestra solo
viabilidad y los riesgos están informados. Los fundamentos de identidad y seguridad
(E02-D1 a E02-D5) están implementados, probados en Jest y `javac` y compilados en Android.
La etapa no queda completamente cerrada: E02-C6 es parcial (iteraciones de PBKDF2
provisionales, permiso `INTERNET` y umbrales del OCR), el módulo nativo no se ha
ejecutado en un dispositivo (E02-C8), el APK Debug de `main` no se ha instalado y la aprobación
formal de los criterios (E02-D6) está pendiente del responsable. Este cierre no autoriza
el inicio de la Etapa 03.

## Alcance evaluado

Criterio específico del plan (`plan-etapas.md`): fundamentos críticos con pruebas y
evidencias verificables; PoC de OCR solo de viabilidad; riesgos informados.

- SQLCipher con `@op-engineering/op-sqlite`: cifrado en reposo, lectura y escritura, rechazo de clave incorrecta y persistencia.
- Android Keystore con `react-native-keychain`: secreto persistente entre ejecuciones.
- PBKDF2-HMAC-SHA256 con `@noble/hashes`: conformidad con vectores y tiempos de derivación.
- Valores aleatorios con el módulo nativo `RNGetRandomValues`.
- Cámara, galería y OCR con `react-native-image-picker` y `@react-native-ml-kit/text-recognition`: viabilidad.
- Integración selectiva en `main` de dependencias, configuración y reglas; el código de las pruebas de concepto no se integra.
- Fundamentos de identidad y seguridad para HU1 a HU3: verificadores PBKDF2 nativos, normalización, política de contraseñas, preguntas de seguridad, limitación de intentos, recuperación, clave SQLCipher, migraciones y aislamiento multiusuario (`arquitectura-identidad.md`). Sin pantallas ni flujos de las historias.

No se implementó ninguna historia de usuario ni pantalla de la Etapa 03.

## Fundamentos validados experimentalmente

Ejecución V4 sobre la rama experimental `6caa2ac`, 2026-10-23, emulador API 34
(`evidencias/ETAPA-02/V4/summary.md`: 48 PASS, 1 FAIL `BUILD-RELEASE`, por el límite de
rutas de Ninja). Resumen por fundamento en `decisiones.md` ("Etapa 02 — resultados
validados experimentalmente").

## Criterios de cierre E02

Detalle y evidencias en `trazabilidad.md` (sección "Etapa 02").

| ID | Criterio | Estado |
|---|---|---|
| E02-C1 | Librerías nativas seleccionadas y compatibles con React Native 0.87.1 | Verificado (emulador) |
| E02-C2 | Base de datos cifrada con SQLCipher | Verificado (emulador) |
| E02-C3 | Secreto en Android Keystore persistente | Verificado (emulador); respaldo por hardware no demostrado |
| E02-C4 | PBKDF2-HMAC-SHA256 conforme a vectores | Verificado (emulador); implementación nativa conforme en JDK; iteraciones provisionales |
| E02-C5 | Viabilidad de cámara, galería y OCR | Verificado solo como viabilidad; calidad no aprobada |
| E02-C6 | Decisiones de la etapa resueltas | Parcial |
| E02-C7 | Integración en `main` sin alterar la aplicación de la Etapa 01 | Verificado (compilación Debug en Windows); APK de `main` no instalado |
| E02-C8 | Fundamentos de identidad y seguridad implementados y probados | Verificado (Jest, `javac` y compilación Debug en Windows); ejecución en dispositivo pendiente |

## Cambios integrados en `main`

| Commit | Contenido |
|---|---|
| `372180c` | `app/package.json` y `app/package-lock.json` (6 dependencias con versión exacta y `"op-sqlite": { "sqlcipher": true }`), `app/.eslintrc.js` (regla E02-RNG en `src/`), `docs/decisiones.md`, `docs/trazabilidad.md` |
| `e21ba6b` | Merge de `372180c` sobre `e10cebf` |
| `cbef19f` | `docs/cierre-etapa-02.md`, actualización de `docs/decisiones.md` y `docs/trazabilidad.md`, evidencias de `evidencias/ETAPA-02/` y regla de `.gitignore` para las copias de bases de datos |
| `a9b86dc` | Evidencia `windows-debug-20261025/` de la compilación Debug de `cbef19f` y actualización de este documento, `decisiones.md`, `trazabilidad.md` y el manifiesto de evidencias |
| `a5c1379`, `d3e69ee`, `03195e9`, `d609143`, `440ba4d` | `body-parser` 2.4.0; renombrado de las carpetas de capas a inglés; fundamentos de identidad y seguridad con sus pruebas; permisos y exclusión de copias en el manifiesto; documentación y evidencias (`claude-20261025/`) |
| Commits de la revisión consolidada | Serialización de la recuperación con pruebas de regresión; evidencia `windows-identity-20261025/` y `claude-20261025-review/` |

Se conservan sin cambios desde la Etapa 01: `App.tsx`, `__tests__/App.test.tsx`,
`versionName "1.0"`, la identidad `co.gfpsas.gestionfinanciera`, `scripts/` y
`evidencias/ETAPA-01/`. Cambian deliberadamente en la WU del 2026-10-25:
`MainApplication.kt` (registro de `GfpCryptoPackage`), `AndroidManifest.xml` (permisos
biométricos y reglas de extracción), `jest.config.js` (transformación de `@noble/hashes`,
la misma configuración validada en la V4), `.eslintrc.js` (`no-console`) y `package.json`
(`codegenConfig`). Los APK de la Etapa 01 conservaban sus hashes (`8EB6D5A0…` Debug,
`D39154D3…` Release) antes y después de la compilación del 2026-10-25.

## Pruebas ejecutadas y evidencias

Rutas relativas a `evidencias/ETAPA-02/`; manifiesto en `README.md` de esa carpeta.

| Prueba | Resultado | Evidencia | Ejecutado por |
|---|---|---|---|
| Calidad y Jest de la rama experimental | PASS | `V4/{typecheck,lint,format,jest}.log` | Juan (Windows) |
| Build Debug de la rama experimental | PASS (`E0994C87…`) | `V4/gradle-assembleDebug.log`, `V4/apk-spike.txt` | Juan (Windows) |
| Build Release de la rama experimental | FAIL en la ruta larga | `V4/gradle-assembleRelease.log` | Juan (Windows) |
| P1/P1B SQLCipher, en reposo, clave incorrecta, SQLite estándar | PASS | `V4/at-rest.txt`, `V4/marker-search.txt`, `V4/wrong-key-hashes.txt`, `V4/sqlite-standard.txt` | Juan (Windows, emulador) |
| Persistencia: force-stop, cierre, cambio de variante, actualización, reinicio | PASS | `V4/runs/`, `V4/steps/`, `V4/runs.txt` | Juan (Windows, emulador) |
| P3 vectores ampliados y benchmark (12/12 muestras) | PASS | `V4/p3-extended.txt`, `V4/p3-benchmark.txt`, `V4/pbkdf2-vectors.txt` | Juan (Windows, emulador) |
| P4 lote OCR (6 imágenes sintéticas), galería y cámara | PASS (viabilidad) | `V4/p4-batch.txt`, `V4/steps/` | Juan (Windows, emulador) |
| Análisis de privacidad | PASS (17 archivos) | `V4/sensitive-scan.md` | Juan (Windows) |
| `npm ci`, tsc, ESLint, Prettier y Jest sobre `app/` de `main` | PASS | `claude-20261023/` | Claude (Linux) |
| Regla E02-RNG | 2 errores en `src/`, 0 fuera | `claude-20261023/eslint-rule-probe.log` | Claude (Linux) |
| `npm audit` | 1 hallazgo alto (E02-D9) | `claude-20261023/npm-audit.json` | Claude (Linux) |
| Fundamentos de identidad: `npm ci`, tsc, ESLint, Prettier y Jest (13 suites; 74 pruebas, 76 tras la revisión consolidada: vectores PBKDF2, normalización NFC/NFD, contraseñas, verificadores, preguntas, intentos, recuperación, migraciones, clave SQLCipher y aislamiento) | PASS | `claude-20261025/` | Claude (Linux, 2026-10-25) |
| `Pbkdf2HmacSha256.java` con `javac` y JDK 21 | 5/5 vectores | `claude-20261025/pbkdf2-java-vectors.txt` | Claude (Linux, 2026-10-25) |
| `npm audit` tras `body-parser` 2.4.0 | 0 vulnerabilidades | `claude-20261025/npm-audit.json` | Claude (Linux, 2026-10-25) |
| `npm ci`, tsc, ESLint, Prettier, Jest y `assembleDebug` de `main` (`cbef19f`) con JDK 17 | PASS: `BUILD SUCCESSFUL in 15m 5s`, SQLCipher activo, APK `0AEF5C75…` (`versionName 1.0`, `co.gfpsas.gestionfinanciera`, `minSdkVersion 29`); repositorio canónico y APK de la Etapa 01 sin cambios | `windows-debug-20261025/` | Juan (Windows, 2026-10-25) |
| `npm ci`, `npm audit`, tsc, ESLint, Prettier, Jest (74/74), `assembleDebug` y manifiesto Release de `440ba4d` con JDK 17 | PASS: `BUILD SUCCESSFUL in 8m 15s`, `NativeGfpCryptoSpec` generado, APK `3CF23009…` sin permisos biométricos y con `dataExtractionRules`; Release solo con `INTERNET`, `ACCESS_NETWORK_STATE` y el permiso interno de AndroidX; Etapa 01 sin cambios | `windows-identity-20261025/` | Juan (Windows, 2026-10-25) |
| Revisión consolidada: 10 intentos de recuperación simultáneos | Antes: 10 evaluados (bloqueante). Después: 3 evaluados y 7 bloqueados; Jest 76/76 | `claude-20261025-review/` | Claude (Linux, 2026-10-25) |

No ejecutadas: ejecución del módulo `GfpCrypto` en un dispositivo; instalación y ejecución
del APK Debug de `main`; compilación Release de `main`;
desinstalación y reinstalación (destructivas, sin autorización); pruebas en dispositivo
físico (P-D1, P-D2, P-D3 y P-D7 en `validacion/etapa-02-pruebas-dispositivo.md`).

## Limitaciones y reservas

- Resultados de un emulador (API 34) con código de pruebas de concepto; no demuestran el comportamiento en producción ni en dispositivos físicos.
- Protección de claves respaldada por hardware no demostrada (nivel declarado `SECURE_SOFTWARE`).
- Generación del secreto con `RNGetRandomValues` no observada en la ejecución final.
- Las pruebas Release usaron el APK `DD54C93E…`; el Release `819EF8CC…`, compilado en la ruta corta, solo se instaló y abrió.
- La compilación Release en Windows requiere una ruta corta por el límite de 260 caracteres de Ninja.
- Calidad del OCR no aprobada: 6 imágenes sintéticas y anomalía `similarity=0.355` aceptada como limitación conocida (E02-OCR).
- APK Debug de `main` compilado en Windows, pero no instalado ni ejecutado; Release de `main` no compilado.
- Módulo nativo `GfpCrypto` compilado pero no ejecutado en un dispositivo; Jest sustituye el módulo nativo por una implementación de Node.
- Iteraciones de PBKDF2 provisionales (600 000) hasta medirlas en el dispositivo físico mínimo (P-D1).
- Las opciones de respuesta de seguridad tienen entropía limitada; la recuperación depende de la limitación de intentos (`arquitectura-identidad.md`, sección 4).

## Decisiones de la etapa

Valores, justificación y condición de cierre en `decisiones.md` ("Etapa 02 — decisiones
técnicas").

| ID | Decisión | Estado | Bloquea iniciar la Etapa 03 |
|---|---|---|---|
| E02-D1 | Protección de contraseñas y respuestas | Adoptada; 600 000 iteraciones provisionales hasta P-D1 | No |
| E02-D2 | Normalización Unicode (NFC) | Adoptada; P-D2 pendiente | No |
| E02-D3 | Custodia de la clave SQLCipher | Adoptada; P-D3 pendiente | No |
| E02-D4 | Varias cuentas locales con aislamiento lógico | Adoptada | No |
| E02-D5 | Modelo de datos de identidad y seguridad | Adoptada; catálogos propuestos | No |
| E02-D6 | Criterios de cierre | Registrados; aprobación pendiente | Sí |
| E02-D7 | Permisos del APK | Parcialmente resuelta; `INTERNET` hasta P-D7 | No |
| E02-D8 | Calidad del OCR | Plan definido; umbrales para la Etapa 10 | No |
| E02-D9 | Vulnerabilidad `body-parser` | Resuelta (2.4.0) | No |

Discrepancias: C-02 resuelta por G-08; C-03 (respuestas seleccionables) resuelta por la
WU del 2026-10-25.

## Riesgos residuales

Ver `arquitectura-identidad.md`, sección 6: iteraciones sin medir en el dispositivo
mínimo, comportamiento de Hermes con `normalize` y `\p{…}`, Keystore sin respaldo por
hardware demostrado, secretos como `string` de JavaScript, errores de consulta entre
usuarios y manipulación del reloj.

## Condiciones para autorizar la Etapa 03

1. Aprobación explícita del responsable de este cierre y de los criterios E02-C1 a E02-C8 (E02-D6).
2. E03-D1 y E03-D2 ya están definidas por el responsable (2026-10-25); quedan las ambigüedades A-W1 a A-W6 y A-ID1 a A-ID4 y el contenido de E03-D4 y E03-D5 (`decisiones-etapa-03.md`).
3. Propuesta pendiente de aprobación: instalar el APK Debug de `main` en API 29 o superior y comprobar que la aplicación de la Etapa 01 sigue funcionando (criterios comunes 4 y 5 del plan).
4. Autorización explícita del responsable para iniciar la Etapa 03.

La compilación Android de los fundamentos de identidad ya está verificada
(`windows-identity-20261025/`). P-D1, P-D2 y P-D3 no bloquean el inicio, pero deben completarse antes del cierre de la
Etapa 03.

## Pendiente del responsable

1. Aprobación del cierre con reservas y de los criterios (E02-D6).
2. A-W1 a A-W6, A-ID1 a A-ID4, E03-D4 y E03-D5.
3. Autorizar o descartar la instalación del APK Debug de `main` (condición 3). Si se instala en el emulador, reemplaza la aplicación de pruebas de concepto instalada, que usa el mismo identificador.
4. Decidir si se retiran los worktrees auxiliares (`GFP Proyecto\GFP-e02-int` y `GFP Proyecto\GFP-e02-id`), que se conservan.
5. Autorizar la publicación en GitHub.
