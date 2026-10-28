# Cierre de la Etapa 03 — HU1 Registrar usuario

**Veredicto: HU1 implementada, validada, integrada en `main` y publicada, con reservas
documentadas.** Los 19 criterios literales (HU1-CA01 a HU1-CA19) están verificados en Jest y
en emulador; la regresión de integración se ejecutó sobre el código integrado en Android 10
(API 29) y Android 14 (API 34) sin fallos. Quedan abiertas las reservas y tareas diferidas de
la sección «Reservas y tareas diferidas». Este cierre no autoriza el inicio de la Etapa 04.

**Estado de aprobación:** cierre aprobado formalmente con reservas por el responsable
(2026-10-28, E03-APROBACION en `decisiones.md`), conforme a este documento. La aprobación no
da por superadas las reservas ni elimina las tareas pendientes ni las verificaciones futuras
registradas.

**Publicación:** Juan publicó `main` en `origin` el 2026-10-28 con `git push origin main`
(`b5b4140..14f2c88`), sin `--force`, tras comprobar que `main` estaba limpia, que el remoto
seguía en `b5b4140` y que `main` contenía solo los dos commits de la integración.
`git ls-remote origin refs/heads/main` devolvió después
`14f2c88f55afb3cdc4aac821935570e2591d952c`, igual al `HEAD` local, y `git status -sb` mostró
`## main...origin/main` sin commits pendientes.

## Objetivo y alcance

Implementar HU1 Registrar usuario según sus criterios literales (`trazabilidad.md`, sección
«HU1 — criterios de aceptación») y las decisiones aprobadas en `decisiones-etapa-03.md`:

- Asistente de tres pasos (E03-D1, A-W1 a A-W9): identificación, contacto y preguntas de seguridad.
- Identificadores inequívocos y normalizados (E03-D2, A-ID1 a A-ID4): correo, documento normalizado y celular E.164 obligatorio con selector de país y bandera.
- Tipos de documento activos y reglas de caracteres por tipo (E03-D4): CC, CE y PPT solo dígitos; PA letras y dígitos; sin longitud fija.
- Preguntas de seguridad no similares y respuestas escritas de 2 a 100 caracteres (E03-D5, E03-D6, E03-D11).
- Mensajes de validación específicos y ayuda de contraseña (E03-V15).
- Apertura segura de la base con la pantalla de error aprobada, sin borrar ni recrear la base (A-W9, E03-V09).
- Persistencia cifrada sin datos parciales ni secretos en claro (E02-D1, E02-D3).

Fuera del alcance: el inicio de sesión (HU2, Etapa 04); la vista de inicio de sesión es la
pantalla provisional de G-07.

## Commits de implementación e integración

| Commit | Contenido |
|---|---|
| `7e13b9020a7ac904a265ca1ae090421938c6e075` | `feat(identity): implement HU1 three-step account registration`: 41 archivos de `app/` (14 modificados, 27 nuevos) y 5 documentos (`trazabilidad.md`, `decisiones.md`, `decisiones-etapa-03.md`, `arquitectura-identidad.md`, `validacion/etapa-02-pruebas-dispositivo.md`), sobre `b5b4140` |
| `14f2c88f55afb3cdc4aac821935570e2591d952c` | `merge: integrate HU1 account registration (stage 03)`: merge `--no-ff` de la rama `e03/hu1-integration` en `main`; padres `b5b4140` y `7e13b90` |

Origen: candidato depurado `hu1-implementation-v6-clean-r2.patch` (SHA-256
`b9c8c9ff…5e261423f`), derivado de `hu1-implementation-v6.patch` sin las 140 evidencias de
E03; los 41 archivos de `app/` coinciden con `hu1-candidate-manifest.txt` (SHA-256
`ccb80749…a78b3`). No cambian `package.json`, `package-lock.json`, `android/` ni la
configuración de las herramientas. Los parches y manifiestos no se versionan.

## Criterio común de cierre (`plan-etapas.md`)

| # | Criterio | Estado |
|---|---|---|
| 1 | Cada criterio literal figura en `trazabilidad.md` con estado y evidencia | Cumplido: HU1-CA01 a HU1-CA19 verificados, con su texto literal sin cambios |
| 2 | Solo quedan parciales los criterios de «Criterios parciales previstos» | Cumplido: HU1-CA18 verificado en E03; se repite como regresión en E04 |
| 3 | Pruebas automatizadas ejecutadas con resultados reales | Cumplido: Jest 221/221 en la rama de integración y en `main` |
| 4 | Compilación e instalación en Android 10 (API 29) o superior | Cumplido: APK Debug compilado del mismo árbol que `main`, instalado en API 29 y API 34 |
| 5 | Regresión de las etapas anteriores sin fallos | Cumplido: suite completa de Jest (incluidos los fundamentos de la Etapa 02), P-D2 y P-D3 en dispositivo y APK de la Etapa 01 intactos |
| 6 | Decisiones de la etapa resueltas | Cumplido con reserva: E03-D1 a E03-D11 definidas; E03-V06 con reserva documental |
| 7 | Informe de cierre y pausa obligatoria | Este documento; aprobado por el responsable el 2026-10-28 (E03-APROBACION) |

## Pruebas automatizadas

| Ejecución | Resultado | Evidencia |
|---|---|---|
| Rama `e03/hu1-integration` antes del commit (Windows, 2026-10-28): verificación del parche y de los manifiestos, `npm ci`, `typecheck`, `lint`, `format:check`, Jest y `assembleDebug` con JDK 17 | Código 0; 17 suites, 221 pruebas; `BUILD SUCCESSFUL in 8m 50s`; APK Debug `9F4545C0…3876EA060B6`; ningún archivo versionado modificado por las herramientas | `hu1-int-20261028-092927/` |
| `main` tras el merge (`14f2c88`, Windows, 2026-10-28): `npm ci`, `typecheck`, `lint`, `format:check` y Jest | Código 0 en los cinco; 17 suites, 221 pruebas; `git status` vacío | `hu1-merge-20261028-105148/` (`main-validation.txt`, `main-*.log`) |
| Commit y merge | 46 archivos del índice iguales al manifiesto r2; el árbol del commit es el del índice verificado; sin evidencias, temporales ni binarios; merge con padres `b5b4140` y `7e13b90` | `hu1-merge-20261028-105148/summary.txt` |

## Regresión en dispositivo

APK Debug `9F4545C0…3876EA060B6` y JavaScript servido por Metro desde el worktree de
integración, cuyo contenido es el de `main`. Emuladores desechables, sin datos que
conservar.

| Comprobación | Android 14 (`emulator-5554`, API 34) | Android 10 (`emulator-5556`, API 29) |
|---|---|---|
| P-D3: instalación limpia, desinstalación y reinstalación | PASS | PASS |
| E03-V09: clave ausente y clave rechazada, mensaje aprobado, sin detalles internos, reversible | PASS | PASS |
| E03-V06: pasaporte con `#` rechazado con el mensaje de la regla final | PASS | PASS |
| HU1-CA18: Cancelar en los pasos 2 y 3, sin cuenta parcial ni datos en claro | PASS | PASS |
| E03-V13 y E03-V06: teclado numérico y solo dígitos en CC, CE y PPT; teclado de texto y alfanumérico en PA | PASS | PASS |
| P-D2: NFC, NFD, `free-text-folded` y `\p{…}` en Hermes | PASS | PASS |
| `logcat` sin `FATAL EXCEPTION` | PASS | PASS |
| **Total** | **58 PASS, 0 FAIL** (28 + 15 + 15) | **58 PASS, 0 FAIL** (28 + 15 + 15) |
| Evidencia | `hu1-int-closure-20261028-100459/`, `hu1-int-v13-emulator-5554-20261028-101222/`, `hu1-int-p-d2-emulator-5554-20261028-101517/` | `hu1-int-closure-20261028-103338/`, `hu1-int-v13-emulator-5556-20261028-104045/`, `hu1-int-p-d2-emulator-5556-20261028-102101/` |

Las validaciones anteriores a la integración, sobre el worktree aislado de HU1, figuran en
`trazabilidad.md` (secciones «HU1 — evidencias de la implementación», «correcciones de
usabilidad», «cierre de validación» y «versión candidata consolidada»).

## Evidencias

Las evidencias de la Etapa 03 no se incluyen en el repositorio: forman el paquete de
evidencias `GFP-e03-evidencias`, que conserva el responsable del proyecto y que puede
solicitarse a él. Las carpetas citadas en este documento son carpetas de ese paquete; no son
rutas del repositorio. Los resultados comprobados constan en las tablas, de modo que no hace
falta disponer del paquete para conocerlos. Tampoco se versionan los scripts de validación
de la Etapa 03 ni los parches y manifiestos del candidato.

## Incidencias de la validación

Ninguna se atribuye a un defecto de HU1:

- `hu1-int-20261028-092927/`: el control `NO-PERSONAL-PATHS` dio un falso FAIL porque buscaba `AKIRAZ` sin distinguir mayúsculas y coincidió con la URL oficial del repositorio. La recomprobación con el patrón corregido dio 0 coincidencias (`summary-recheck.txt` de esa carpeta).
- `hu1-int-v13-emulator-5556-20261028-101542/`: la interfaz de la aplicación no llegó a mostrarse y la comprobación se detuvo antes de evaluar los casos; la causa probable, no confirmada, es que el JavaScript no se cargó desde Metro. Repetida tras una instalación limpia, dio 15 PASS y 0 FAIL (`hu1-int-v13-emulator-5556-20261028-104045/`). Esa carpeta contiene además `logcat-on-stop.txt` y `screen-on-stop.png`, generados por un aviso erróneo del bloque de ejecución; no corresponden a un fallo.
- `hu1-merge-20261028-105148/`: el primer `typecheck` sobre `main` falló porque los `node_modules` previos de `main` no correspondían a su `package-lock.json`. Tras `npm ci`, los cinco controles dieron código 0.

## Reservas y tareas diferidas

| Reserva | Estado | Condición o etapa |
|---|---|---|
| E03-V06 | Verificado, con reserva documental | CE y PPT se apoyan en especificaciones oficiales sectoriales (MinSalud) a falta de una norma de Migración Colombia sobre el formato del número; si se publica, se revisa la regla (`decisiones-etapa-03.md`, E03-D4) |
| P-D1 | Diferida por decisión del responsable (2026-10-27) | Calibración de PBKDF2 en el dispositivo físico mínimo; Etapa 05 o 06 (`validacion/etapa-02-pruebas-dispositivo.md`). Excepción a la condición de `cierre-etapa-02.md` (completar P-D1 antes del cierre de la Etapa 03), basada en la decisión del responsable del 2026-10-27 de que no bloquea el cierre de HU1 en emuladores; confirmada con la aprobación formal de este cierre (E03-APROBACION, 2026-10-28) |
| P-D7 | Diferida | Procesar con OCR las imágenes sintéticas en un Release sin `INTERNET`; requiere el flujo de OCR de HU7 (Etapa 10) |
| HU1-CA18 | Verificado con la pantalla provisional | Repetir como regresión en la Etapa 04, cuando HU2 sustituya la pantalla provisional de inicio de sesión |
| Política de evidencias | Pendiente de decisión | Gestión de las evidencias de las etapas siguientes; las de la Etapa 03 se conservan fuera del repositorio y las plantillas de P-D1 y P-D2 se mantienen sin cambios hasta esa decisión |

Siguen vigentes las limitaciones de la Etapa 02 que no dependen de HU1
(`cierre-etapa-02.md`, «Limitaciones y reservas»), entre ellas la protección de claves sin
respaldo por hardware demostrado y el uso restringido a una demostración académica
controlada (E03-D11).

## Pendiente del responsable

1. Aprobar formalmente el cierre de la Etapa 03 con las reservas de este documento. Cumplido el 2026-10-28 (E03-APROBACION).
2. Decidir si se crea la etiqueta `etapa-03-aprobada`, como la de la Etapa 01.
3. Decidir si se retiran la rama `e03/hu1-integration` y los worktrees auxiliares de las Etapas 02 y 03, que se conservan.
4. Definir la política de evidencias de las etapas siguientes.
5. Autorizar la Etapa 04 (HU2 Iniciar sesión).

## Conclusión

HU1 está implementada, integrada en `main` (`14f2c88`) y publicada en `origin/main`, con
Jest 221/221, controles estáticos y compilación correctos y la regresión de integración sin
fallos en Android 10 y Android 14. Las reservas de E03-V06, P-D1, P-D7, HU1-CA18 y la
política de evidencias quedan documentadas y abiertas. El responsable aprobó formalmente el
cierre de la Etapa 03 el 2026-10-28 (E03-APROBACION), con esas reservas.
