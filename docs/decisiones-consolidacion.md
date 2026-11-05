# Decisiones de la consolidación global (HU6, HU7, HU9, HU10 y entrega)

Fuentes:

- instrucción del responsable del 2026-11-04 («Auditoría integral e integración global del
  proyecto final»), que sustituye el flujo por etapas E09 a E13 por una consolidación única;
- historias HU6, HU7, HU9 y HU10 del documento
  `RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` y sus prototipos;
- plan aprobado de las Etapas 07 a 13 (PLAN-E07-E13 en `decisiones.md`): D-01 a D-08 y las
  interpretaciones I-01 a I-30;
- propuestas no aprobadas de `daniela888-li/GFP` (copias en `referencia/daniela888-li/`);
- auditoría de ambos repositorios (`auditoria-integral-repositorios.md`).

**Estado (2026-11-04):** decisiones de implementación de la rama
`integracion/consolidacion-global`. Ninguna cambia un criterio literal ni una decisión aprobada.
Las que dependen del responsable figuran como pendientes en la sección final.

**Limitación documental.** El texto completo de las interpretaciones I-01 a I-30 no está en el
repositorio (PLAN-E07-E13 remite a un documento externo). Esta consolidación aplica las
interpretaciones que `decisiones.md` enumera: descripción de hasta 250 caracteres, fechas sin
hora, borrado físico, balance sobre todos los movimientos sin filtros, OCR tras capturar o elegir
la imagen, datos del OCR editables y nunca guardados sin confirmación, comercio en la
descripción, imagen no conservada y temporales eliminados, solo R1, R2 y R3, y descarte hasta el
mes siguiente (I-27). La instrucción del 2026-11-04 cita además I-05, I-13, I-14, I-16 a I-18,
I-20 a I-23, I-25, I-26 e I-30; su texto no está disponible en el repositorio, así que su
cumplimiento no se pudo contrastar (pendiente P-CONS-01).

## Resumen

| Decisión | Asunto | Resolución |
|---|---|---|
| E-CONS-D1 | Mecanismo de integración | Rama nueva desde `main` (`5dd2071`); adaptación manual por funcionalidad, sin merge ni cherry-pick de las ramas de la compañera |
| E-CONS-D2 | HU6 | Totales de todos los movimientos del usuario, sin filtros, en la parte superior del historial |
| E-CONS-D3 | HU7 | OCR al capturar o elegir; extracción conservadora; formulario de HU4 precargado; subtítulo literal de HU7 |
| E-CONS-D4 | Imagen de HU7 | Copia temporal borrada al terminar y al iniciar la app (módulo nativo `GfpFiles`); foto de cámara reducida a 2048 px |
| E-CONS-D5 | HU9 | Propuestas E11-D1 a E11-D6 de la compañera, con `react-native-svg` 15.16.0 (D-04) |
| E-CONS-D6 | HU10 | Solo R1, R2 y R3; descartes guardados por mes (I-27, migración 6); severidad del prototipo |
| E-CONS-D7 | Barra superior Atrás/Adelante y Cerrar sesión | No se integran; pendientes de decisión |
| E-CONS-D8 | Firma release | Clave propia fuera del repositorio por variables del proceso; sin clave, APK sin firmar (D-06) |

## E-CONS-D1 — Mecanismo de integración

- Las ramas `e07` a `fix` de la compañera parten de `d6c1713` (cierre de E06 en nuestro `main`) y
  están encadenadas. Sus HU4 y HU5 son implementaciones paralelas a las integradas en
  `main` (`7558a3f`, `5dd2071`) y su migración 5 crea `movements` con otras columnas
  (`movement_date`) y otra suma de verificación. Un merge o un cherry-pick reemplazaría o
  duplicaría HU4 y HU5 aprobadas y rompería la migración 5 publicada.
- Por eso cada funcionalidad nueva se adaptó a nuestra arquitectura: `MovementRepository`,
  `MovementFilters` en ISO, `formatMoney()`, `localDate`, `DateField` con el calendario de D-03 y
  los servicios con resultados tipados. Cada commit cita el commit de origen.
- La rama `e06/hu8-categories` ya se había portado en E06 (`a6092af`). `main` de la compañera
  (`b669d0f`) es anterior a nuestro E04 y no aporta nada.

## E-CONS-D2 — HU6

Coincide con E09-D1 y E09-D2 de la compañera y con el plan aprobado: los totales suman todos los
movimientos del usuario de la sesión (`totalsOwn()`), sin los filtros del historial, con el
formato D-01, ingresos en verde, gastos en rojo y balance en azul o rojo si es negativo. Se leen
de la base con cada carga de la lista, así que cambian al volver de crear o editar y después de
eliminar (HU6-CA04).

## E-CONS-D3 — HU7

- El OCR se ejecuta al capturar o elegir la imagen (plan aprobado; E10-D1). No hay botón
  «Procesar imagen»: HU7-CA03 pide procesar al pulsar «Tomar fotografía».
- Extracción conservadora de Monto, Fecha y Comercio (E10-D3): ante la duda, el campo queda
  vacío; la fecha debe existir y no ser futura. El comercio pasa a la descripción.
- «Continuar» abre el formulario de HU4 en Gasto con lo reconocido y el resto vacío, también la
  fecha (HU7-CA07, CA08). Si falta algún dato se muestra «No fue posible identificar toda la
  información. Complete los datos manualmente» (E10-D4). Nada se guarda hasta «Guardar
  movimiento» (HU7-CA05).
- Un fallo del OCR equivale a no haber leído datos (HU7-CA06, E10-D5).
- El acceso desde el historial se llama «Movimiento con foto», como el prototipo (E10-D6).
- Subtítulo: se usa el texto de los elementos visuales de HU7 («Toma una fotografía o elige una
  foto de tu galería.», con la conjugación corregida) y no el del prototipo que proponía E10-D2.

## E-CONS-D4 — Imagen de HU7

- `react-native-image-picker` copia cada foto en la caché de la app con el prefijo
  `rn_image_picker_lib_temp_`. El nuevo TurboModule `GfpFiles` borra solo esos archivos dentro de
  la caché. La app borra la imagen al reintentar, cancelar, continuar, salir de la pantalla o
  rechazar una imagen no válida, y borra todas las que queden al iniciar.
- La foto de la cámara se pide con `maxWidth`/`maxHeight` 2048 y calidad 0,8 para que quede por
  debajo de 5 MB. La imagen de la galería se valida tal cual (HU7-CA02).
- No se declaran permisos nuevos: la cámara se abre con el intent del sistema.
- ML Kit usa el modelo latino incluido en el APK (`com.google.mlkit:text-recognition`), sin
  descarga ni envío de la imagen.

## E-CONS-D5 — HU9

Se aplican E11-D1 a E11-D6 de la compañera: dona y líneas con `react-native-svg` 15.16.0 (D-04,
versión exacta); «Por categoría» y «Evolución» como «Cambiar tipo de gráfico»; agrupación por
semana hasta 62 días y por mes en rangos mayores; moneda D-01 aunque HU9 muestre `$1,250.00`;
sin botón de compartir; «+ Nuevo movimiento» en el estado vacío. Períodos: mes actual, últimos 3
meses, año actual y rango personalizado (ambas fechas obligatorias, con las reglas de E08-D3).
El enlace de un segmento abre el historial con el período, Gasto y la categoría.

## E-CONS-D6 — HU10

- **Solo R1, R2 y R3** (plan aprobado). Se descarta el «Consejo de Ahorro» de E12-D2.
- **Descarte hasta el mes siguiente (I-27).** Se descarta E12-D3 (descarte hasta reabrir la
  pantalla). La migración 6 crea `recommendation_dismissals` (usuario, recomendación, mes) en la
  base cifrada; un descarte oculta la tarjeta durante el mes en que se hizo y se borra con el
  usuario.
- R2 se evalúa sobre el mes actual y R3 exige gastos de la categoría en el mes anterior (E12-D1).
- Severidad: R1 en naranja y R2 y R3 en rojo, como el prototipo.
- «Ver movimientos asociados» abre el historial con el mes actual y, en R2 y R3, la categoría y
  Gasto. R1 no tiene categoría y muestra ingresos y gastos del mes.
- Sin «Ajustar meta de ahorro» ni compartir (E12-D4, E12-D5): ninguna historia los define.

## E-CONS-D7 — Barra superior y cierre de sesión

La rama `fix/navegacion-cierre-sesion` añade una barra superior con «Atrás», «Adelante» y «Cerrar
sesión» (E13-D2, E13-D3, propuestas). No se integran: «Adelante» y el historial de navegación no
están en ninguna historia ni en el plan, y el cierre de sesión cambia la reserva de E04-D4. Hoy la
sesión termina al cerrar la app. Queda pendiente P-CONS-02.

## E-CONS-D8 — Firma release (D-06)

- `app/android/app/build.gradle` toma la ruta del almacén, el alias y las contraseñas de
  `GFP_RELEASE_STORE_FILE`, `GFP_RELEASE_KEY_ALIAS`, `GFP_RELEASE_STORE_PASSWORD` y
  `GFP_RELEASE_KEY_PASSWORD` (variables del proceso o propiedades de Gradle fuera del
  repositorio). Rechaza un almacén dentro del repositorio.
- Sin esos datos, `assembleRelease` genera un APK sin firmar: ya no se usa la clave de depuración.
- `scripts/release/New-ReleaseKey.ps1` crea la clave con las preguntas de `keytool` y
  `scripts/release/Invoke-ReleaseBuild.ps1` compila y verifica el APK. La clave de depuración de
  la compañera no se importa.

## Pendientes de decisión del responsable

| Pendiente | Asunto |
|---|---|
| P-CONS-01 | Incorporar al repositorio el documento de aprobación con I-01 a I-30, para contrastar las interpretaciones no enumeradas en `decisiones.md` |
| P-CONS-02 | Aprobar o descartar «Cerrar sesión» y la barra Atrás/Adelante de la compañera (E-CONS-D7) |
| P-CONS-03 | Evaluación del OCR según `plan-evaluacion-ocr.md` o muestra reducida identificada como limitación (D-05); hoy no se ha ejecutado ninguna |
| P-CONS-04 | Vulnerabilidades de `npm audit` (1 alta, 4 bajas) en herramientas de compilación (`@react-native-community/cli`): ya estaban en `main`; actualizar exige cambiar dependencias aprobadas |
