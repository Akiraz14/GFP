# Cierre de la Etapa 05 — HU3 Recuperar contraseña

**Veredicto: HU3 está implementada y validada en los emuladores Android 10 (API 29) y Android 14
(API 34), con reservas, excepciones y riesgos conocidos documentados.** Los criterios HU3-CA01 a
HU3-CA05 y HU3-CA07 a HU3-CA13 están verificados en Jest y en emulador; HU3-CA06 está verificado
en Jest, sin verificación en dispositivo. La prueba R16 (contraseñas y respuestas en `logcat`) es
**NO VERIFICABLE** en ambos emuladores. Este cierre no autoriza el inicio de la Etapa 06.

**Estado de aprobación (E05-APROBACION, `decisiones.md`):** el 2026-11-04 el responsable:

- ratificó E05-D1 a E05-D9, E05-D5 con los textos propuestos y E05-D8 aceptando expresamente el
  riesgo H-1;
- aceptó como riesgo conocido H-2;
- aceptó como reserva documental la falta de comparación con el prototipo;
- aceptó R16 como no verificable y las excepciones O-01 a O-08;
- difirió P-D1 a la Etapa 06 o posterior;
- aprobó este cierre documental.

**Integración:** pendiente. La integración en `main` con `git merge --no-ff`, la verificación final
sobre `main`, la publicación en `origin` y la etiqueta `etapa-05-aprobada` (G-10,
`flujo-de-trabajo.md`) requieren la autorización expresa del responsable.

## Objetivo y alcance

Implementar HU3 Recuperar contraseña según sus 13 criterios literales (`trazabilidad.md`, sección
«HU3 — criterios de aceptación», sin cambios en su texto):

- Pantalla en dos fases: «Identificador» y «Comenzar recuperación»; después, 2 de las 5 preguntas
  configuradas, «Nueva contraseña», «Confirmar nueva contraseña» y «Actualizar contraseña».
- Verificación de las respuestas con PBKDF2 sobre el servicio de recuperación de la Etapa 02,
  límite de intentos (E05-D1) y reto de 15 minutos (E05-D2).
- Actualización de la credencial y regreso al inicio de sesión de HU2.
- Sustitución de la pantalla provisional del enlace «Olvidé mi contraseña» (HU2-CA09).

Fuera del alcance: las pantallas con datos financieros (HU4 a HU10), el cierre de sesión (E04-D4)
y cualquier cambio del mecanismo de bloqueo de HU2.

## Decisiones de la etapa

Texto completo, justificaciones y riesgos en `decisiones-etapa-05.md`. Todas fueron ratificadas
por el responsable el 2026-11-04 (E05-APROBACION).

| Decisión | Asunto | Ratificación |
|---|---|---|
| E05-D1 | Límite de intentos y bloqueo | RATIFICADA. El bloqueo se anuncia en el intento siguiente al tercer fallo, a diferencia de HU2 (E04-D5) |
| E05-D2 | Preguntas al azar y vencimiento del reto | RATIFICADA |
| E05-D3 | Normalización `free-text-folded` | RATIFICADA. Mantiene el riesgo residual de E03-D11 |
| E05-D4 | Flujo en dos fases | RATIFICADA, sin comparación con el prototipo |
| E05-D5 | Mensajes y borrado de campos | RATIFICADA, incluidos los textos propuestos |
| E05-D6 | Botón Atrás | RATIFICADA |
| E05-D7 | Celular nacional ambiguo | RATIFICADA |
| E05-D8 | Reinicio del bloqueo de inicio de sesión tras una recuperación correcta | RATIFICADA, aceptando expresamente el riesgo H-1 |
| E05-D9 | Ubicación de las evidencias | RATIFICADA |

## Cambios principales

Rama `e05/hu3-recuperar-contrasena`, creada desde `main` (`bc824fe`).

| Commit | Contenido |
|---|---|
| `9e7db18` | `feat(auth): implement HU3 password recovery` |
| `cdc8923` | `docs: record HU3 decisions and traceability` |
| `69425e4` | `test(scripts): expect the HU3 recovery form in the HU2 device run` |
| `67a36f1` | `docs: prepare the stage 05 final validation` |
| `81b03e5` | `docs: separate local validation from answer checks in the HU3 walk` |
| `972ea8f` | `docs: record the HU3 manual validation results` |

| Área | Archivos | Cambio |
|---|---|---|
| Servicio | `app/src/services/authentication/accountRecovery.ts` | `RecoveryGateway`; `validateRecoveryIdentifier()`; búsqueda con `lookupIdentifier` (A-ID1 a A-ID4, E05-D7); `challenge_expired`; resultado `failed` ante un error de la base; reinicio del contador del dispositivo (E05-D8) |
| Pantalla | `app/src/presentation/recovery/PasswordRecoveryScreen.tsx`, `recoveryTexts.ts` | Formulario de HU3 en dos fases con los componentes de HU1 y HU2 |
| Navegación y servicios | `AppNavigator.tsx`, `routes.ts`, `appServices.ts`, `nativeAppServices.ts` | Ruta `passwordRecovery` implementada; servicio `recovery` con la base y el motor PBKDF2 compartidos |
| Pruebas | `accountRecovery.test.ts`, `PasswordRecoveryScreen.test.tsx`, `App.test.tsx` | 20 suites y 293 pruebas en Jest |
| Scripts | `scripts/stage-04/Invoke-Hu2DeviceTests.ps1` | Solo HU2-CA09: espera el formulario real de HU3 |
| Documentación | `decisiones-etapa-05.md`, `trazabilidad.md`, `arquitectura-identidad.md`, `plan-etapas.md`, `decisiones.md`, `decisiones-etapa-03.md`, `validacion/etapa-05-pruebas-dispositivo.md`, `validacion/etapa-05-observaciones-validacion.md`, este documento | Decisiones, criterios, procedimiento, resultados, observaciones y cierre |

El árbol `app/` no cambia desde `cdc8923` (`52b103a…`): las pruebas de Jest, el APK y los
recorridos corresponden al mismo código. Los commits posteriores son de documentación y del script
de HU2-CA09.

## Validación

Procedimiento y resultados en `validacion/etapa-05-pruebas-dispositivo.md`; observaciones en
`validacion/etapa-05-observaciones-validacion.md`. Evidencias en `GFP-evidencias\e05\` (E05-D9),
fuera del repositorio y sin modificar.

### Pruebas automatizadas

| Comprobación | Commit | Evidencia | Resultado |
|---|---|---|---|
| Jest, `typecheck`, `lint` y `format:check` en Linux | `cdc8923` | `hu3-static-linux-20261030-030652` | Sin errores; Jest 20 suites y 293/293 |
| Sintaxis de los scripts en Windows | `81b03e5` | Salida de consola | 9 archivos, 0 errores |
| Controles estáticos en Windows | `81b03e5` | `hu2-static-windows-20261030-092018` | PASS=8 FAIL=0; Jest 293/293 |
| Compilación del APK Debug | `81b03e5` | `hu2-build-windows-20261030-092132` | PASS=4 FAIL=0; APK `011B6277…F826F` |

### Instalación y regresión en emulador (2026-10-30)

El APK `011B6277…F826F` se instaló en limpio y se ejecutó en ambos emuladores.

| Script | Android 14 (API 34) | Android 10 (API 29) |
|---|---|---|
| HU2, incluido HU2-CA09 con el formulario real (`Invoke-Hu2DeviceTests.ps1`) | PASS=26 FAIL=0 | PASS=26 FAIL=0 |
| Regresión de HU1 (`Invoke-Hu1DeviceRegression.ps1`) | PASS=26 **FAIL=4** | PASS=30 FAIL=0 |
| P-D2, Hermes y Unicode (`Invoke-HermesUnicodeCheck.ps1`) | PASS=15 FAIL=0 | PASS=15 FAIL=0 |

**La regresión no está libre de fallos.** Los 4 FAIL de Android 14 son `E03-V13` (CC, CE, PPT y
PA): el script no reconoce el formato de registro de Gboard en Android 14 y anota «sin EditorInfo
en logcat». Es un defecto conocido del script, conservado sin cambios por decisión del
responsable (E04-APROBACION; `validacion/etapa-04-pruebas-dispositivo.md`). Se comprobó a mano en
`ime-*.log` de `hu2-hu1-regression-emulator-5554-20261030-120800`: Gboard recibe
`inputTypeString=Number` en CC, CE y PPT y la clase Text en PA, que es el comportamiento esperado.
Se acepta como excepción del script, no de la app.

La primera ejecución en Android 14 (`…-111027`, `…-111028`, `…-111030`) quedó BLOCKED porque el
emulador no estaba conectado y se repitió.

### Pruebas manuales de HU3 (2026-11-04)

Ejecución culminada en `hu3-manual-android14-api34-20261104-083056` y
`hu3-manual-android10-api29-20261104-101040`, con 31 capturas y un `logcat` por emulador.

| Pasos | Android 14 | Android 10 |
|---|---|---|
| R01 a R15 y R14b | PASS, aceptados con las excepciones de la tabla siguiente | PASS, aceptados con las excepciones de la tabla siguiente |
| R16 | **NO VERIFICABLE** | **NO VERIFICABLE** |

**R16.** Los registros disponibles no permiten certificar la ausencia de contraseñas y respuestas
en `logcat` durante todo el recorrido: las contraseñas no están registradas (como exige el
procedimiento), no consta qué respuestas se usaron en Android 10 y el `logcat` de Android 14 solo
cubre desde R14, por un reinicio del emulador. Por decisión del responsable no se ejecutó la
comprobación adicional ni se solicitaron valores. Las comprobaciones parciales de
`etapa-05-observaciones-validacion.md` son informativas y no sustituyen a R16.

## Excepciones aceptadas

Detalle en `validacion/etapa-05-observaciones-validacion.md`. Ninguna se trata como fallo
funcional, porque ninguna evidencia demuestra un defecto de la aplicación.

| ID | Emulador | Excepción |
|---|---|---|
| O-01 | Android 14 | Reinicio del emulador no documentado entre R13 y R14 |
| O-02 | Android 14 | Dos capturas de R14 en orden inverso a sus nombres; no se renombran |
| O-03 | Android 10 | Cierre inesperado de la app tras R03 (`SIGABRT` en `RenderThread`, `GL errors`), coincidente con un fallo igual de otra app del sistema; la causa no está probada |
| O-04 | Android 10 | Fila de R03 duplicada en `resultados.md` |
| O-05 | Android 10 | R11 con un reto nuevo tras el vencimiento no documentado del anterior |
| O-06 | Android 10 | Falta la captura de R10 posterior a «Aceptar» |
| O-07 | Android 10 | Sin `datos.txt` |
| O-08 | Ambos | R06: el identificador no editable se respalda en Jest |

O-09 y O-10 (texto esperado de R14 y columna «Uso» de la tabla de cuentas) se corrigieron en el
procedimiento en este cierre. O-11 es R16; O-12, las carpetas de preparación y BLOCKED que se
conservan; O-13, la falta del prototipo.

## Criterios de aceptación

| Criterio | Estado | Observación |
|---|---|---|
| HU3-CA01 a HU3-CA05, HU3-CA07 a HU3-CA13 | Verificado (Jest; Android 10 y 14) | Pasos y observaciones por criterio en `trazabilidad.md`; HU3-CA10 se apoya también en R14b |
| HU3-CA06 | Verificado (Jest); sin verificación en dispositivo | R16 no verificable; la base no se inspeccionó en el recorrido |
| HU2-CA09 (regresión) | Verificado en la rama (Jest; Android 10 y 14) | El enlace abre el formulario real de HU3; en `main` sigue la pantalla provisional hasta integrar E05 |

## Riesgos conocidos

| Riesgo | Estado |
|---|---|
| **H-1.** Una recuperación correcta reinicia el contador de inicio de sesión compartido por el dispositivo (E05-D8); quien recupera su propia cuenta puede reiniciar un bloqueo que afecta a otras cuentas | Aceptado por el responsable. No es un defecto frente a la decisión aprobada; se suma al riesgo de manipular el reloj. Sin cambios en esta etapa; una mejora debe evaluarse en un cambio independiente |
| **H-2.** HU3 distingue identificadores existentes de inexistentes, como exige HU3-CA03 | Aceptado como riesgo conocido; mitigado por el bloqueo tras tres identificadores inexistentes (E05-D1) |
| Baja entropía de las respuestas de seguridad | Riesgo residual de E03-D11: solo demostración académica controlada |
| Reloj del dispositivo adelantado | Acorta o anula los bloqueos de inicio de sesión y de recuperación (`arquitectura-identidad.md`, sección 6) |
| Bloqueo del dispositivo por terceros | Riesgo de E04-D1; en la recuperación, tres identificadores inexistentes bloquean su inicio en el dispositivo |
| Contraseña en la memoria de JavaScript | Limitación de React Native (`arquitectura-identidad.md`, sección 6) |

## Reservas y pendientes diferidos

| Asunto | Estado | Condición o etapa |
|---|---|---|
| Comparación con el prototipo de HU3 | Reserva documental aceptada | No se dispone de las imágenes; no se declara hecha |
| R16 | No verificable | Aceptado por el responsable |
| P-D1 (dispositivo físico) | Diferida a la Etapa 06 o posterior | No bloquea la Etapa 05 |
| Anuncio del bloqueo distinto de HU2 | Aceptado en E05-D1 | Mejora futura opcional |
| Ruta por defecto de `scripts/stage-04/lib/Common.ps1` (`GFP-e04-evidencias`) | Fuera del alcance de la Etapa 05 | Se usa `-EvidenceRoot` (E05-D9); corrección en un cambio independiente |
| Defectos conocidos de `scripts/stage-04`, incluido `E03-V13` en Android 14 | Se conservan (E04-APROBACION) | `validacion/etapa-04-pruebas-dispositivo.md` |
| Fin del bloqueo y espera progresiva | Verificados solo en Jest | En dispositivo exigirían esperar 15 minutos o más |
| Reservas heredadas de etapas anteriores (P-D7, E02-D8, Keystore sin respaldo por hardware, HU2-CA10, HU2-CA11, E04-D4) | Sin cambios | Etapas indicadas en sus cierres |

## Criterio común de cierre (`plan-etapas.md`)

| # | Criterio | Estado |
|---|---|---|
| 1 | Cada criterio literal figura en `trazabilidad.md` con estado y evidencia | Cumplido: HU3-CA01 a HU3-CA13 |
| 2 | Solo quedan parciales los criterios de «Criterios parciales previstos» | Cumplido: HU3 no tiene criterios parciales; HU3-CA06 queda sin verificación en dispositivo, declarado |
| 3 | Pruebas automatizadas ejecutadas con resultados reales | Cumplido: Jest 293/293 en Linux (`cdc8923`) y Windows (`81b03e5`) |
| 4 | Compilación e instalación en Android 10 (API 29) o superior | Cumplido: APK `011B6277…F826F` en API 29 y API 34 |
| 5 | Regresión de las etapas anteriores sin fallos | Cumplido con excepción: 4 FAIL de `E03-V13` en Android 14 por el defecto conocido del script, comprobados a mano |
| 6 | Decisiones de la etapa resueltas | Cumplido: E05-D1 a E05-D9 ratificadas el 2026-11-04 |
| 7 | Informe de cierre y pausa obligatoria | Este documento (E05-APROBACION) |

## Pendiente del responsable

1. Autorizar la integración de `e05/hu3-recuperar-contrasena` en `main` con `git merge --no-ff`.
2. Verificación final sobre `main`: Jest y controles estáticos. No es necesario repetir las
   pruebas en emulador si el árbol `app/` de `main` es idéntico al validado (`52b103a…`).
3. Publicar `main` en `origin`.
4. Crear la etiqueta `etapa-05-aprobada`.
5. Decidir si se conserva o retira la rama `e05/hu3-recuperar-contrasena` tras la integración.
6. Autorizar la Etapa 06 (HU8 Administrar categorías).
