# Informe de la consolidación global de GFP

**Fecha:** 2026-11-04  
**Rama:** `integracion/consolidacion-global`, desde `main` `5dd2071` (`etapa-08-aprobada`)  
**Estado:** consolidada y verificada en Jest; **sin integrar en `main`, sin `push` y sin
etiquetas**. Compilaciones Android y validación manual pendientes en Windows.

Documentos relacionados: `auditoria-integral-repositorios.md` (auditoría),
`decisiones-consolidacion.md` (decisiones y pendientes), `cobertura-hu1-hu10.md` (matriz de los
99 criterios), `guia-instalacion-ejecucion.md` y `validacion/guia-pruebas-manuales-finales.md`.

## 1. Estado inicial de nuestro proyecto

`main` en `5dd2071`, sin cambios locales. HU1, HU2, HU3, HU8, HU4 y HU5 integradas; migraciones 1
a 5; 32 suites y 519 pruebas de Jest (E08). Sin HU6, HU7, HU9 ni HU10. Release firmado con la
clave de depuración.

## 2. Estado inicial del proyecto de la compañera

`main` en `b669d0f` (HU2 propia, anterior a nuestro E04). HU4 a HU10 y una barra de navegación
en siete ramas encadenadas sobre nuestro `d6c1713`, la última `fix/navegacion-cierre-sesion`
(`e3b324b`); ninguna en su `main` ni aprobada. Declara 34 suites y 494 pruebas en Jest, que no
ejecutamos sobre su rama.

## 3. Ramas y commits evaluados

Todas las ramas de ambos repositorios (sección 3 de la auditoría). Origen del código adaptado:
`a3764a1` (HU6), `6ec6d3c` (HU7), `8bfa533` (HU9), `4c7cd2f` (HU10). Evaluados y no integrados:
`28c68c6`, `4ddb7b0` (HU4 y HU5 duplicadas) y `a17f360` (barra superior y cierre de sesión).

## 4. Funcionalidades recuperadas

| HU | Qué se recuperó | Cambios respecto del origen |
|---|---|---|
| HU6 | Totales y resumen del historial | `formatMoney()`; lectura con cada carga de la lista |
| HU7 | Extracción de Monto, Fecha y Comercio; pantalla de captura; precarga de HU4 | Borrado de la imagen temporal (módulo nativo nuevo `GfpFiles`), reducción de la foto de cámara, subtítulo literal de HU7 |
| HU9 | Métricas, dona, líneas y pantalla | Filtros ISO y `DateField` con el calendario de D-03 |
| HU10 | Motor de reglas y pantalla | Solo R1–R3; descartes persistentes por mes (migración 6); severidad del prototipo |
| HU5 | Filtros iniciales al llegar desde HU9 o HU10 | Remontaje del historial en cada visita |

## 5. Documentación y recursos recuperados

Copias sin cambios de las decisiones y cierres de las Etapas 09 a 13 de la compañera, su resumen de
entrega y su validación de HU7, en `docs/referencia/daniela888-li/` con su origen. No había
recursos gráficos, configuración Android, scripts ni evidencias nuevas que recuperar.

## 6. Decisiones en conflicto y su resolución

| Conflicto | Resolución |
|---|---|
| HU4, HU5 y migración 5 de la compañera frente a las aprobadas | Se conservan las nuestras (E-CONS-D1) |
| «Consejo de Ahorro» (E12-D2) frente a «solo R1, R2 y R3» | Se descarta (E-CONS-D6) |
| Descarte hasta reabrir (E12-D3) frente a I-27 | Descarte hasta el mes siguiente (E-CONS-D6) |
| Imagen en caché frente a «imagen no conservada y temporales eliminados» | Borrado con `GfpFiles` (E-CONS-D4) |
| Subtítulo del prototipo (E10-D2) frente al texto de HU7 | Texto de HU7 (E-CONS-D3) |
| Barra Atrás/Adelante y Cerrar sesión frente a la ausencia de requisito | No se integran; pendiente P-CONS-02 |
| `$1,250.00` de HU9 frente a D-01 | D-01 (E-CONS-D5) |

## 7. Cambios en nuestra arquitectura

- **Datos:** migración 6 `recommendation_dismissals`; `MovementRepository.totalsOwn()`;
  `RecommendationDismissalRepository`. Migraciones 1 a 5 sin cambios (sumas de verificación
  bloqueadas en pruebas).
- **Negocio:** `RecommendationService` (C4 Generador de Recomendaciones); `filterInputFrom()`;
  `MovementGateway.totals()`.
- **Procesamiento y análisis:** `src/processing/` (OCR, validación de imagen, puerta nativa) y
  `src/analysis/` (métricas y reglas, funciones puras).
- **Presentación:** `BalanceSummary`, `ReceiptCaptureScreen`, `AnalysisScreen` y gráficos,
  `RecommendationsScreen`; precarga en `MovementFormScreen`; rutas de HU7, HU9 y HU10 activas.
  Las pantallas no acceden a la base: usan los servicios.
- **Nativo Android:** TurboModule `GfpFiles` (Kotlin, codegen) registrado en
  `MainApplication.kt`; firma release desde variables del proceso (D-06).
- **Dependencias:** `react-native-svg` 15.16.0 (D-04, versión exacta). Ninguna más.

Cambios frente a `main` antes del commit de documentación: 52 archivos (27 nuevos y 25
modificados), ninguno eliminado. Commits
(`5dd2071..`):

| Commit | Contenido |
|---|---|
| `e042bd7` | `react-native-svg` 15.16.0 |
| `4152ca4` | HU6 |
| `a319886` | Módulo nativo `GfpFiles` |
| `e8268ae` | HU7 |
| `ca915d8` | HU9 |
| `9843d80` | HU10 y migración 6 |
| `bfcf0c8` | Firma release propia y scripts `release/` |
| `bac1aa9` | Corrección: historial con filtros en cada visita |
| siguiente | Documentación de la consolidación |

## 8. Pruebas ejecutadas y resultados exactos

Ejecutadas en el entorno Linux de Claude, sobre un clon limpio de la rama (`bac1aa9`, el código
no cambia en el commit de documentación), el 2026-11-04:

| Verificación | Resultado |
|---|---|
| `npm ci` | Código 0 |
| `npm run typecheck` | Código 0 |
| `npm run lint` | Código 0 |
| `npm run format:check` | Código 0 |
| Jest | 38 suites, 605 pruebas aprobadas, 0 fallos |
| Pruebas de `ApkBadging` (PowerShell 7) | 10 pruebas, 0 fallos |
| Análisis sintáctico de los scripts de `stage-04` (`Test-ScriptSyntax.ps1`), `stage-07` y `release` | 0 errores; solo ASCII |
| Bundle JavaScript de Release (`react-native bundle --dev false`) | Generado, 1.367.493 bytes |
| Compilación del bundle con `hermesc` (Hermes del proyecto, Linux) | 0 errores, 10 avisos de variables globales no declaradas (habituales) |
| Codegen de React Native (`generate-codegen-artifacts.js`) | Genera `NativeGfpFilesSpec` con `deleteTemporaryImage(String, Promise)` y `clearTemporaryImages(Promise)`, la firma que implementa `GfpFilesModule` |
| `npm audit --omit=dev` | 5 vulnerabilidades (1 alta en `joi`, 4 bajas en `deepmerge` y `@react-native-community/cli`), las mismas que en `main`; herramientas de compilación, no se incluyen en el APK (P-CONS-04) |
| Revisión estática de seguridad (búsqueda manual) | Sin `console`, `eval`, `fetch`, URL de red ni `Math.random` en `src/`; ninguna pantalla accede a la base; la imagen no se guarda; sin claves en el repositorio (solo la `debug.keystore` habitual) |
| Exportaciones sin uso (búsqueda con un script propio) | Solo tipos y constantes usados dentro de su archivo; no se encontró código muerto. No se pudo usar una herramienta dedicada: su instalación fue denegada en este entorno |

Cubierto en Jest además: migración desde una base vacía y desde las versiones 1, 2, 3, 4 y 5;
aislamiento entre usuarios en movimientos, categorías, totales, recomendaciones y descartes;
sesión vencida en todos los servicios; borrado de la imagen en todos los caminos de HU7 (con
dobles). El cifrado SQLCipher y el almacén de claves se prueban con dobles desde E02
(`encryptedDatabase.test.ts`); en dispositivo se validaron en E03 a E05.

**No ejecutado** en este entorno: compilación Debug y Release con Gradle (sin acceso a Gradle ni
al Android SDK), compilación de Kotlin de `GfpFilesModule`, firma, inspección del APK, pruebas en
emulador y validación manual.

## 9. Compilaciones Debug y Release

No ejecutadas por Claude. Se preparan con `Invoke-AndroidBuild.ps1`, `Invoke-Hu4ApkCheck.ps1`,
`New-ReleaseKey.ps1` e `Invoke-ReleaseBuild.ps1` (`guia-instalacion-ejecucion.md`). El
`Invoke-ReleaseBuild.ps1` comprueba firma, paquete, `minSdkVersion` 29, permisos, que no sea
depurable y el bundle JavaScript, y registra el SHA-256.

## 10. Cobertura HU1–HU10

99 criterios: 97 implementados y cubiertos por pruebas automatizadas; 2 (HU7-CA01 cámara y galería
reales, HU7-CA03 OCR real) implementados con el flujo probado en Jest mediante dobles y pendientes
de validación en dispositivo. Ninguno parcial ni sin implementar. Todos entran en la validación
manual integral (D-07). Detalle en `cobertura-hu1-hu10.md`.

## 11. Riesgos y pendientes reales

| Pendiente | Responsable | Impacto |
|---|---|---|
| Compilar Debug y Release en Windows (incluye Kotlin de `GfpFiles` y la nueva configuración de firma) | Responsable | Alto: si falla, no hay APK |
| Crear la clave release y guardarla con copia de seguridad (D-06) | Responsable | Alto: sin ella el Release queda sin firmar |
| Validación manual integral en Android 10 y 14 | Responsable | Alto: cierre del proyecto |
| P-CONS-03: evaluación del OCR (D-05) | Responsable | Medio: calidad de HU7 desconocida |
| P-CONS-02: Cerrar sesión y barra Atrás/Adelante | Responsable | Bajo: hoy la sesión termina al cerrar la app |
| P-CONS-01: incorporar I-01 a I-30 al repositorio | Responsable | Medio: interpretaciones no contrastadas |
| P-CONS-04: vulnerabilidades de herramientas de compilación | Responsable | Bajo: no se incluyen en el APK |
| HU3-CA06 sin verificación en dispositivo (heredado de E05) | Responsable | Bajo |
| Lista del historial sin paginación (E08-D6) | — | Bajo: se registrará si la validación muestra lentitud |

## 12. APK y SHA-256

No se generó ningún APK en este entorno. Los SHA-256 los registran `Invoke-AndroidBuild.ps1`
(`apk-debug.txt`) e `Invoke-ReleaseBuild.ps1` (`apk-release.txt`) en la carpeta de evidencias.

## 13. Rama y commit final

Rama `integracion/consolidacion-global`; el commit final y el SHA-256 del bundle de transferencia
se informan en la entrega (no pueden escribirse dentro del propio commit).

## 14. Pasos para revisar y publicar

1. Verificar el bundle de transferencia y crear la rama local (comandos de la entrega).
2. `guia-instalacion-ejecucion.md`, secciones 2 a 5: controles, Debug, clave y Release.
3. Validación manual con `validacion/guia-pruebas-manuales-finales.md` en Android 10 y 14.
4. Decidir P-CONS-01 a P-CONS-04.
5. Si se aprueba: `git switch main`, `git merge --no-ff integracion/consolidacion-global`,
   etiqueta y `git push` (decisión exclusiva del responsable).
