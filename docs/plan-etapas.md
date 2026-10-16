# Plan de etapas — GFP (versión 3, aprobada el 2026-10-16)

Historias de usuario: identificadores y nombres literales del documento
`RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1`.

## Protocolo por etapa

Análisis → plan → implementación → validación → trazabilidad → documentación →
informe de cierre → pausa obligatoria hasta aprobación explícita.

## Criterio común de cierre de las etapas de historias (03–12)

1. Cada criterio de aceptación literal de la historia figura en `trazabilidad.md` con estado y evidencia.
2. Solo quedan parciales los criterios listados en `trazabilidad.md` (sección "Criterios parciales"), con la etapa donde se completan.
3. Pruebas automatizadas pertinentes ejecutadas con resultados reales.
4. Compilación e instalación en Android 10 (API 29) o superior según `validacion/`.
5. Regresión de las etapas anteriores sin fallos.
6. Decisiones de la etapa resueltas.
7. Informe de cierre y pausa obligatoria.

## Etapas

| Etapa | Contenido | Depende de | Criterio de cierre específico |
|---|---|---|---|
| 00 | Revisión documental y definición técnica | — | Plan aprobado (cerrada) |
| 01 | Estructura inicial y configuración | 00 | La estructura compila y se ejecuta en el entorno disponible y las pruebas configuradas pasan; APK de depuración generado e instalado en API 29 o superior, con evidencia |
| 02 | Fundamentos técnicos compartidos | 01 | Fundamentos críticos con pruebas y evidencias verificables; PoC de OCR solo de viabilidad; riesgos informados |
| 03 | HU1 Registrar usuario | 02 | Común |
| 04 | HU2 Iniciar sesión | HU1 | Común |
| 05 | HU3 Recuperar contraseña | HU1, HU2 | Común |
| 06 | HU8 Administrar categorías de movimientos financieros | HU2 | Común |
| 07 | HU4 Registrar y editar movimiento financiero | HU8 | Común |
| 08 | HU5 Consultar historia de movimientos financieros | HU4, HU8 | Común |
| 09 | HU6 Visualizar balance financiero | HU4, HU5 | Común |
| 10 | HU7 Capturar gasto mediante factura o comprobante | HU4, HU5, E02 | Común, con validación en dispositivo de cámara/galería |
| 11 | HU9 Consultar análisis financiero | HU4, HU5, HU7, HU8 | Común |
| 12 | HU10 Consultar recomendaciones financieras automáticas | HU4, HU5, HU8 | Común |
| 13 | Integración, regresión y entrega final | 01–12 | Los 99 criterios de HU1–HU10 verificados; sin fallos críticos; regresión completa; APK release generado, firmado, instalado en Android 10 (API 29) y validado funcionalmente; C-01 documentada; instrucciones de instalación |

Justificación del orden: HU4-CA02 exige el maestro `categories`, cuya carga inicial
es HU8-CA01, por eso HU8 precede a HU4. HU6 se ubica en la pantalla de historial
(HU5). HU7 continúa hacia HU4 y regresa a HU5. HU9 y HU10 dependen de los datos
de HU4, HU5, HU7 y HU8.

## Decisiones pendientes por etapa

Se resuelven antes de iniciar la etapa correspondiente. Cada discrepancia entre
texto y prototipo se decide individualmente; no existe regla general de precedencia.

| Etapa | Decisiones |
|---|---|
| 02 | Librerías de SQLCipher, Keystore, OCR, cámara/galería; estrategia de clave de cifrado; algoritmo de protección de contraseñas y respuestas; modelo multiusuario; esquema de BD en E02 o incremental; evidencias concretas de cierre (G-06) |
| 03 (antes) | Tratamiento de navegaciones hacia pantallas de etapas futuras (G-07) |
| 03 — HU1 | D1 formulario único (texto) vs. asistente de 3 pasos (prototipo); D2 celular obligatorio u opcional; D3 criterio de usuario ya registrado; D4 contenido de `document_types`; D5 catálogo de preguntas de seguridad; D6 definición de "preguntas similares"; D7 caracteres permitidos en nombres; D8 lista de códigos de país; D9 normalización de respuestas; D10 longitud máxima de contraseña |
| 04 — HU2 | D1 alcance y persistencia del bloqueo; D2 distinción documento/celular/correo; D3 pantalla destino tras iniciar sesión; D4 cierre y duración de sesión (no definido) |
| 05 — HU3 | D1 límite de intentos de respuesta; D2 re-aleatorización de preguntas; D3 normalización (= E03-D9) |
| 06 — HU8 | D1 categorías personalizadas por usuario o globales; D2 tipo de las categorías del sistema; D3 reasignación de categorías de ingreso a "Otros"; D4 acceso a la pantalla Categorías; D5 catálogo de íconos |
| 07 — HU4 | D1 filtrado de categorías por tipo; D2 nombres de botones; D3 destino de Cancelar y "vista principal"; D4 limpiar formulario vs. pantalla "¡Operación exitosa!"; D5 decimales y monto máximo |
| 08 — HU5 | D1 borrado físico vs. lógico; D2 nombre del botón de foto; D3 validación del rango de fechas |
| 09 — HU6 | D1 formato de moneda (HU6 vs. HU9); D2 "movimientos activos" |
| 10 — HU7 | D1 disparador del OCR; D2 límite de 5 MB y compresión; D3 fecha futura detectada; D4 destino de "Comercio/Descripción"; D5 pantalla "Completar movimiento" del prototipo |
| 11 — HU9 | D1 formato de moneda; D2 agrupación semana/mes; D3 "Cambiar tipo de gráfico"; D4 ícono de compartir del prototipo |
| 12 — HU10 | D1 período de la Regla 2; D2 Regla 3 con base 0 o categoría nueva; D3 persistencia de "Descartar"; D4 severidad (prototipo vs. texto); D5 filtros de la Regla 1; D6 "meta de ahorro" del prototipo; D7 ícono de compartir |
| 13 | D1 creación y custodia de la clave de firma release; D2 dispositivos/emuladores de la validación final |
