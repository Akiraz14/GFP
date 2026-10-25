# Cierre de la Etapa 02 — Fundamentos técnicos compartidos

**Veredicto: cierre técnico aceptado con reservas (E02-CIERRE).** Los fundamentos críticos
tienen pruebas y evidencias verificables en emulador, la PoC de OCR demuestra solo
viabilidad y los riesgos están informados. La etapa no queda completamente cerrada:
E02-C6 es parcial, el APK Debug de `main` integrado se compiló pero no se instaló, y la
aprobación formal de los criterios (E02-D6) está pendiente del responsable. Este cierre
no autoriza el inicio de la Etapa 03.

## Alcance evaluado

Criterio específico del plan (`plan-etapas.md`): fundamentos críticos con pruebas y
evidencias verificables; PoC de OCR solo de viabilidad; riesgos informados.

- SQLCipher con `@op-engineering/op-sqlite`: cifrado en reposo, lectura y escritura, rechazo de clave incorrecta y persistencia.
- Android Keystore con `react-native-keychain`: secreto persistente entre ejecuciones.
- PBKDF2-HMAC-SHA256 con `@noble/hashes`: conformidad con vectores y tiempos de derivación.
- Valores aleatorios con el módulo nativo `RNGetRandomValues`.
- Cámara, galería y OCR con `react-native-image-picker` y `@react-native-ml-kit/text-recognition`: viabilidad.
- Integración selectiva en `main` de dependencias, configuración y reglas; el código de las pruebas de concepto no se integra.

No se implementó ninguna historia de usuario ni trabajo de la Etapa 03.

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
| E02-C4 | PBKDF2-HMAC-SHA256 conforme a vectores | Verificado (emulador); parámetros no aprobados |
| E02-C5 | Viabilidad de cámara, galería y OCR | Verificado solo como viabilidad; calidad no aprobada |
| E02-C6 | Decisiones de la etapa resueltas | Parcial |
| E02-C7 | Integración en `main` sin alterar la aplicación de la Etapa 01 | Verificado (compilación Debug en Windows); APK de `main` no instalado |

## Cambios integrados en `main`

| Commit | Contenido |
|---|---|
| `372180c` | `app/package.json` y `app/package-lock.json` (6 dependencias con versión exacta y `"op-sqlite": { "sqlcipher": true }`), `app/.eslintrc.js` (regla E02-RNG en `src/`), `docs/decisiones.md`, `docs/trazabilidad.md` |
| `e21ba6b` | Merge de `372180c` sobre `e10cebf` |
| `cbef19f` | `docs/cierre-etapa-02.md`, actualización de `docs/decisiones.md` y `docs/trazabilidad.md`, evidencias de `evidencias/ETAPA-02/` y regla de `.gitignore` para las copias de bases de datos |
| Commit de validación final | Evidencia `windows-debug-20261025/` y actualización de este documento, `decisiones.md`, `trazabilidad.md` y el manifiesto de evidencias |

Sin cambios respecto a `e10cebf`: `App.tsx`, `__tests__/App.test.tsx`, `app/android/`
(`versionName "1.0"`, `co.gfpsas.gestionfinanciera`), `app/src/`, la configuración de Jest,
`scripts/` y `evidencias/ETAPA-01/`. Los APK de la Etapa 01 conservan sus hashes
(`8EB6D5A0…` Debug, `D39154D3…` Release; comprobado el 2026-10-23 y antes y después de la
compilación del 2026-10-25).

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
| `npm ci`, tsc, ESLint, Prettier, Jest y `assembleDebug` de `main` (`cbef19f`) con JDK 17 | PASS: `BUILD SUCCESSFUL in 15m 5s`, SQLCipher activo, APK `0AEF5C75…` (`versionName 1.0`, `co.gfpsas.gestionfinanciera`, `minSdkVersion 29`); repositorio canónico y APK de la Etapa 01 sin cambios | `windows-debug-20261025/` | Juan (Windows, 2026-10-25) |

No ejecutadas: instalación y ejecución del APK Debug de `main`; compilación Release de
`main`; desinstalación y reinstalación (destructivas, sin autorización); pruebas en
dispositivo físico.

## Limitaciones y reservas

- Resultados de un emulador (API 34) con código de pruebas de concepto; no demuestran el comportamiento en producción ni en dispositivos físicos.
- Protección de claves respaldada por hardware no demostrada (nivel declarado `SECURE_SOFTWARE`).
- Generación del secreto con `RNGetRandomValues` no observada en la ejecución final.
- Las pruebas Release usaron el APK `DD54C93E…`; el Release `819EF8CC…`, compilado en la ruta corta, solo se instaló y abrió.
- La compilación Release en Windows requiere una ruta corta por el límite de 260 caracteres de Ninja.
- Calidad del OCR no aprobada: 6 imágenes sintéticas y anomalía `similarity=0.355` aceptada como limitación conocida (E02-OCR).
- APK Debug de `main` compilado en Windows, pero no instalado ni ejecutado; Release de `main` no compilado.
- Vulnerabilidad alta de `body-parser` sin tratar (E02-D9).

## Decisiones pendientes y su impacto

Detalle, justificación y condición de resolución en `decisiones.md` ("Etapa 02 —
decisiones abiertas").

| ID | Decisión | Impacto | Prerrequisito de la Etapa 03 |
|---|---|---|---|
| E02-D1 | Parámetros de PBKDF2 | Almacenamiento de contraseñas y respuestas de HU1 | Sí |
| E02-D2 | Normalización Unicode | Mismas credenciales con distinta forma Unicode | Sí |
| E02-D3 | Estrategia de clave de cifrado | Creación de la base de datos cifrada | Sí |
| E02-D4 | Modelo multiusuario | Aislamiento de datos (HU2-CA11) | Sí |
| E02-D5 | Esquema de base de datos | Primer registro de usuario; HU8-CA07c | Sí |
| E02-D6 | Aprobación de los criterios de cierre | Cierre formal de la etapa | Sí |
| E02-D7 | Permisos del APK final | Superficie de permisos del APK | No |
| E02-D8 | Umbral de calidad del OCR | HU7 (Etapa 10) | No |
| E02-D9 | Vulnerabilidad de `body-parser` | Cadena de herramientas de desarrollo | No |

Otras discrepancias abiertas: C-02 (G-03 frente al remoto de GitHub).

## Condiciones para autorizar la Etapa 03

1. Aprobación explícita del responsable de este cierre y de los criterios E02-C1 a E02-C7 (E02-D6).
2. Decisiones E02-D1 a E02-D5 resueltas y registradas en `decisiones.md`.
3. G-07 y E03-D1 a E03-D10 resueltas (`plan-etapas.md`).
4. Propuesta pendiente de aprobación: instalar el APK Debug de `main` (`0AEF5C75…`) en API 29 o superior y comprobar que la aplicación de la Etapa 01 sigue funcionando (criterios comunes 4 y 5 del plan). La compilación ya está hecha (`windows-debug-20261025/`).
5. Autorización explícita del responsable para iniciar la Etapa 03.

## Pendiente del responsable

1. Aprobación del cierre con reservas y de los criterios (E02-D6).
2. Decisiones E02-D1 a E02-D5, E02-D7 a E02-D9 y C-02.
3. Autorizar o descartar la instalación del APK Debug de `main` (condición 4). Si se instala en el emulador, reemplaza la aplicación de pruebas de concepto instalada, que usa el mismo identificador.
4. Decidir si se retira el worktree `GFP Proyecto\GFP-e02-int`, que se conserva.
