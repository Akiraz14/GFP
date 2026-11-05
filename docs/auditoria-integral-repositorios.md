# Auditoría integral de los repositorios de GFP

**Fecha:** 2026-11-04  
**Alcance:** instrucción del responsable «Auditoría integral e integración global del proyecto
final» (2026-11-04).  
**Método:** clon propio de lectura de ambos repositorios, comparación de historiales con
`git merge-base`, `git rev-list` y `git diff` contra la base correcta de cada rama, y lectura del
código, las pruebas y la documentación. El repositorio de la compañera no se modificó: su remoto
quedó configurado sin URL de envío.

## 1. Repositorios y referencias analizadas

| Repositorio | Referencia | Commit | Observación |
|---|---|---|---|
| Canónico `Akiraz14/GFP` | `main` | `5dd2071` | Merge de la Etapa 08, sin cambios locales |
| Canónico | etiquetas `etapa-03-aprobada`, `etapa-05-aprobada` a `etapa-08-aprobada` | `b59948c`, `e19d9ab`, `d6c1713`, `7558a3f`, `5dd2071` | Anotadas; no existe `etapa-04-aprobada` (E04 se cerró con `299c6ef` sin etiqueta) |
| Canónico | ramas `e04/…` a `e08/…`, `fix/pbkdf2-memory`, `fix/working-methodology` | — | Todas integradas en `main` |
| Compañera `daniela888-li/GFP` | `main` | `b669d0f` | HU2 propia (E04), sobre `b5b4140`; anterior a nuestro E04 |
| Compañera | `e06/hu8-categories` | `fd9bf4b` | HU8 sobre `b5b4140`; no integrada en su `main` |
| Compañera | `e07/hu4-movimientos` … `e12/hu10-recomendaciones` | `e6abcb5` … `02d17dc` | Encadenadas sobre `d6c1713` de nuestro `main`; 2 commits cada una |
| Compañera | `fix/navegacion-cierre-sesion` | `e3b324b` | Última de la cadena; contiene todas las anteriores |

Referencia recuperable del estado inicial: rama local `ref/inicio-consolidacion-5dd2071` en el
clon de trabajo y la etiqueta `etapa-08-aprobada` publicada.

## 2. Historial relevante

- **Canónico.** Etapas 01 a 08 integradas con merges `--no-ff` y aprobadas; HU1, HU2, HU3, HU8,
  HU4 y HU5 en `main`. Migraciones 1 a 5 publicadas (identidad, catálogos, NIT, categorías y
  movimientos).
- **Compañera.** Su HU8 (`e06/hu8-categories`) ya se portó en E06 (`a6092af`, E06-APROBACION). En
  noviembre partió de nuestro `d6c1713` y desarrolló HU4 a HU10 y la navegación. Según su
  `entrega-etapas-07-12.md`, construyó los cambios juntos y luego los separó en ramas; los catorce
  commits tienen marcas de hora del 2026-11-04 entre 21:34 y 21:36. Ninguno está aprobado ni en su
  `main`.

## 3. Estado de cada rama de la compañera

| Rama | Base | Commits propios | En su `main` | Contenido | Evaluación |
|---|---|---|---|---|---|
| `main` | `b5b4140` | 1 | — | HU2 propia | Obsoleta: nuestra HU2 integrada y validada en Android 10 y 14 |
| `e06/hu8-categories` | `b5b4140` | 4 | No | HU8 | Ya portada en E06 |
| `e07/hu4-movimientos` | `d6c1713` | 2 | No | HU4, migración 5, reasignación, `BottomTabs`, `DateField` propio | Duplicada: nuestra HU4 está integrada. Su migración 5 es incompatible con la publicada. Su `DateField` es un calendario propio, no `@react-native-community/datetimepicker` (contradice D-03). En E07 su formato de moneda omitía los decimales cero (contradice D-01; lo corrige en E09) |
| `e08/hu5-historial` | `e07` | 2 | No | HU5 | Duplicada: nuestra HU5 está integrada |
| `e09/hu6-balance` | `e08` | 2 | No | HU6 (`totalsOwn`, `BalanceSummary`, filtros iniciales del historial) | Aprovechable; coincide con el plan aprobado |
| `e10/hu7-movimiento-foto` | `e09` | 2 | No | HU7: cámara, galería, ML Kit, extracción, precarga de HU4 | Aprovechable; no borra la copia temporal de la imagen (contradice el plan aprobado) |
| `e11/hu9-analisis` | `e10` | 2 | No | HU9: métricas puras, dona y líneas con `react-native-svg` 15.16.0 | Aprovechable; coincide con D-04 |
| `e12/hu10-recomendaciones` | `e11` | 2 | No | HU10: R1 a R3 y «Consejo de Ahorro»; descarte hasta reabrir | Aprovechable con cambios: la cuarta regla y el descarte contradicen el plan (solo R1–R3; I-27) |
| `fix/navegacion-cierre-sesion` | `e12` | 2 | No | `TopBar` con Atrás, Adelante y Cerrar sesión; resumen de entrega | Pendiente de decisión: añade navegación no especificada (E-CONS-D7) |

Frente a `d6c1713`, la cadena añade 54 archivos y modifica 19; no elimina ninguno ni toca
`app/android`, `scripts/` ni `evidencias/`. Sus scripts de dispositivo siguen esperando el texto
de la pantalla provisional de HU5, que su propio historial reemplaza.

## 4. Matriz de funcionalidades por HU

| HU | Canónico (`main`, `5dd2071`) | Compañera (`fix/…`, `e3b324b`) | Resultado de la consolidación |
|---|---|---|---|
| HU1 | Integrada; Jest y emulador | Igual (heredada de nuestro `main`) | Se conserva la nuestra |
| HU2 | Integrada; Jest y Android 10 y 14 | Igual en la cadena; su `main` tiene otra versión obsoleta | Se conserva la nuestra |
| HU3 | Integrada; Jest y Android 10 y 14 | Igual (heredada) | Se conserva la nuestra |
| HU8 | Integrada; reasignación a «Otros» desde E07 | Igual más su propia reasignación | Se conserva la nuestra |
| HU4 | Integrada (E07): calendario D-03, `formatMoney`, pantalla «¡Operación exitosa!» | Propia, con calendario propio | Se conserva la nuestra; se añade la precarga de HU7 |
| HU5 | Integrada (E08): filtros, eliminación, barra inferior | Propia | Se conserva la nuestra; se añaden filtros iniciales, el resumen de HU6 y «Movimiento con foto» |
| HU6 | No existe | Implementada (propuesta) | Adaptada (E-CONS-D2) |
| HU7 | No existe (dependencias nativas de E02 sin uso) | Implementada sin borrado de temporales | Adaptada con borrado de temporales (E-CONS-D3, D4) |
| HU9 | No existe | Implementada | Adaptada (E-CONS-D5) |
| HU10 | No existe | Implementada con una regla extra y descarte en memoria | Adaptada con R1–R3 y descarte mensual persistente (E-CONS-D6) |
| Navegación con sesión | Barra inferior (E08-D4) | Barra inferior y barra superior con Atrás, Adelante y Cerrar sesión | Barra inferior; barra superior pendiente (E-CONS-D7) |
| Firma release | Clave de depuración en `release` | Sin cambios | Clave propia fuera del repositorio (E-CONS-D8) |

## 5. Matriz de archivos y documentación recuperables

| Archivo de la compañera | Commit | Destino en la consolidación |
|---|---|---|
| `src/infrastructure/database/repositories/movementRepository.ts` (`totalsOwn`) | `a3764a1` | Método `totalsOwn()` en nuestro repositorio |
| `src/presentation/movements/BalanceSummary.tsx` | `a3764a1` | Reescrito con `formatMoney()` |
| `src/processing/receiptExtraction.ts`, `receiptImage.ts` | `6ec6d3c` | Copiados; la fecha se valida con `localDate` |
| `src/processing/receiptGateway.ts`, `nativeReceiptGateway.ts` | `6ec6d3c` | Adaptados: `discardImage()`, limpieza al iniciar y reducción de la foto |
| `src/presentation/receipts/ReceiptCaptureScreen.tsx`, `receiptTexts.ts` | `6ec6d3c` | Adaptados: borrado de temporales y API de dinero y fechas |
| `src/analysis/financialAnalysis.ts` | `8bfa533` | Copiado; `date` pasa a `occurredOn` |
| `src/presentation/analysis/AnalysisScreen.tsx`, `charts.tsx`, `analysisTexts.ts` | `8bfa533` | Adaptados a `MovementFilters` y `DateField` |
| `src/analysis/recommendations.ts`, `RecommendationsScreen.tsx` | `4c7cd2f` | Adaptados: R1–R3 y servicio con descartes |
| `testing/movementFixtures.ts` | `8bfa533` | Copiado con `occurredOn` |
| Pruebas `receiptExtraction`, `ReceiptCaptureScreen`, `financialAnalysis`, `recommendations`, `AnalysisAndRecommendations` | `6ec6d3c`, `8bfa533`, `4c7cd2f` | Adaptadas y ampliadas |
| `docs/decisiones-etapa-09.md` a `13.md`, `cierre-etapa-09.md` a `12.md`, `entrega-etapas-07-12.md`, `validacion/etapa-10-pruebas-dispositivo.md` | `bc2420f` … `e3b324b` | Copias sin cambios en `docs/referencia/daniela888-li/` |

No hay en la compañera recursos gráficos, configuración Android, scripts ni evidencias nuevas.

## 6. Diferencias técnicas relevantes

| Aspecto | Canónico | Compañera |
|---|---|---|
| Esquema `movements` | `occurred_on`, `date(occurred_on) IS occurred_on`, triggers `movement_category_not_accessible` | `movement_date` con `GLOB`, triggers `movement_category_unavailable` |
| Filtros | `MovementFilters` en ISO; validación en `movementFilters.ts` | Filtros de texto `DD/MM/AAAA` en `movementRules.ts` |
| Moneda | `formatMoney()` con dos decimales siempre (D-01) | `formatAmount()`; dos decimales desde E09 |
| Calendario | `DateTimePickerAndroid` (D-03) | Modal propio |
| Navegación | Estados en `AppNavigator`; barra inferior | Además, pila de pantallas visitadas para Atrás y Adelante |
| Imagen de HU7 | Borrada (consolidación) | Queda en la caché hasta que Android la limpie |
| Descartes de HU10 | Tabla cifrada por usuario y mes | Estado de la pantalla |
| Pruebas | 38 suites, 605 pruebas (consolidación) | 34 suites, 494 pruebas declaradas (no ejecutadas por nosotros sobre su rama) |

## 7. Incompatibilidades y riesgos

- **Migración 5.** La suma de verificación de la migración 5 de la compañera no coincide con la
  publicada. Aplicar su rama sobre una base existente detendría el migrador (E02-D5). Por eso no se
  importó su esquema.
- **Duplicidad de HU4 y HU5.** Dos implementaciones con contratos distintos (`date` frente a
  `occurredOn`, filtros de texto frente a ISO).
- **Temporales de HU7.** Sin borrado, las fotos de comprobantes quedarían en la caché.
- **Reglas de HU10.** La cuarta regla y el descarte en memoria contradicen el plan aprobado.
- **Código nativo sin compilar.** `GfpFilesModule.kt` y la firma release no se han compilado en
  este entorno (sin acceso a Gradle ni al Android SDK). Riesgo medio, mitigado: mismo patrón que
  `GfpCrypto` y firma de la especificación generada por codegen comprobada.
- **OCR sin evaluar.** Ni la compañera ni esta consolidación ejecutaron el plan de evaluación.
- **Rendimiento del historial.** Lista completa sin paginación (E08-D6).

## 8. Elementos que deben conservarse de nuestro proyecto

Toda la historia y las etiquetas; HU1, HU2, HU3, HU8, HU4 y HU5 con sus migraciones 1 a 5 sin
cambios; `GfpCrypto`, SQLCipher y el almacén de claves; los scripts de `scripts/stage-04` y
`scripts/stage-07`; las evidencias de `evidencias/ETAPA-01` y `ETAPA-02`; los documentos de
decisiones, cierres, validaciones y trazabilidad de E01 a E08.

## 9. Elementos que conviene importar de la compañera

HU6, HU7 (extracción y pantalla), HU9 (métricas, gráficos y pantalla), HU10 (motor y pantalla),
los datos de prueba de movimientos, sus pruebas de esas historias y sus documentos de decisiones
como referencia. Todo se importó con las adaptaciones de las secciones 5 y 7.

## 10. Elementos descartados y justificación

| Elemento | Motivo |
|---|---|
| HU4 y HU5 de la compañera, su `DateField` y `BottomTabs` | Duplican la implementación aprobada; el calendario propio contradice D-03 |
| Su migración 5 | Incompatible con la migración publicada |
| Regla «Consejo de Ahorro» (E12-D2) | Solo R1, R2 y R3 están aprobadas |
| Descarte hasta reabrir la pantalla (E12-D3) | Contradice I-27 |
| Subtítulo del prototipo en HU7 (E10-D2) | Se prefiere el texto de la historia |
| `TopBar` con Atrás, Adelante y Cerrar sesión | Funcionalidad no especificada; pendiente de decisión (E-CONS-D7) |
| Su `main` y `e06/hu8-categories` | Obsoletas o ya portadas |
| Claves de firma de la compañera | D-06; no se encontró ninguna en sus ramas, solo la `debug.keystore` común de React Native |

## 11. Estrategia de integración aplicada

Rama `integracion/consolidacion-global` desde `main` (`5dd2071`), con commits por funcionalidad y
cita del commit de origen (E-CONS-D1): dependencia SVG, HU6, módulo nativo de borrado, HU7, HU9,
HU10 (migración 6), firma release, corrección de navegación y documentación. Sin merge ni
cherry-pick de la compañera, sin `push`, sin etiquetas.

## 12. Pendientes que requieren al propietario

P-CONS-01 a P-CONS-04 de `decisiones-consolidacion.md`, la compilación y verificación en Windows
(Debug y Release), la creación de la clave release y la validación manual integral (D-07).
