# Matriz de trazabilidad — GFP

Los criterios de aceptación se conservan **literalmente** en el documento fuente
`RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` (sección 3).
Esta matriz solo asigna identificadores internos `HUx-CAyy`, numerados en el orden
en que aparecen los criterios en cada historia, y registra etapa, estado y
evidencia. La transcripción literal de cada criterio se incorpora a esta matriz al
iniciar la etapa de su historia.

Estados: Pendiente · Implementado · Probado · Parcial · Verificado.

## Resumen por historia

| Historia | Criterios | Etapa | Estado |
|---|---|---|---|
| HU1 Registrar usuario | CA01–CA19 | 03 | Pendiente |
| HU2 Iniciar sesión | CA01–CA11 | 04 | Pendiente |
| HU3 Recuperar contraseña | CA01–CA13 | 05 | Pendiente |
| HU8 Administrar categorías de movimientos financieros | CA01–CA08 (CA07 con subcriterios a, b, c) | 06 | Pendiente |
| HU4 Registrar y editar movimiento financiero | CA01–CA13 | 07 | Pendiente |
| HU5 Consultar historia de movimientos financieros | CA01–CA07 | 08 | Pendiente |
| HU6 Visualizar balance financiero | CA01–CA04 | 09 | Pendiente |
| HU7 Capturar gasto mediante factura o comprobante | CA01–CA12 | 10 | Pendiente |
| HU9 Consultar análisis financiero | CA01–CA06 | 11 | Pendiente |
| HU10 Consultar recomendaciones financieras automáticas | CA01–CA06 (CA02 con subcriterios a, b, c) | 12 | Pendiente |
| **Total** | **99** | | |

## Criterios parciales previstos

| Criterio | Historia | Dependencia | Evidencia exigible en la etapa actual (propuesta) | Verificación definitiva |
|---|---|---|---|---|
| HU1-CA18 | HU1 | Pantalla de inicio de sesión (HU2) | Prueba: Cancelar limpia todos los campos y emite navegación a la ruta de inicio de sesión | E04 |
| HU2-CA09 | HU2 | Pantalla de recuperación (HU3) | Prueba: el enlace emite navegación a la ruta de recuperación | E05 |
| HU2-CA10 | HU2 | Pantallas con información financiera (HU4, HU5, HU6, HU9, HU10) | Prueba: rutas autenticadas inaccesibles sin sesión válida; re-verificación en E07–E12 | E13 |
| HU2-CA11 | HU2 | Datos financieros de dos o más usuarios | Prueba: la sesión queda asociada a un único usuario; aislamiento verificado en E07, E08, E11, E12 | E13 |
| HU8-CA07c | HU8 | Movimientos (HU4) | Prueba de eliminación; reasignación con datos de prueba solo si el esquema existe desde E02 | E07 |
| HU8-CA08 | HU8 | Formulario HU4 y filtros HU5 | Prueba: la categoría creada o editada aparece de inmediato en la consulta de categorías activas | E07 y E08 |
| HU4-CA07 y CA08 (variante edición) | HU4 | Punto de entrada a la edición (HU5) | Prueba de integración del modo edición: guarda y muestra el mensaje de actualización | E08 |
| HU4-CA10 | HU4 | Botón "Editar" del historial (HU5-CA07) | Prueba de integración: el modo edición carga todos los datos del movimiento | E08 |
| HU4-CA12 | HU4 | Historial (HU5) y decisión E07-D3 | Prueba: Cancelar descarta cambios sin persistir | E08 |

HU5-CA07 pertenece a HU5 y se verifica en E08 como criterio propio; no sustituye
a HU4-CA10.

## Etapa 01 — criterios de cierre (no son criterios de historias)

| ID interno | Criterio | Evidencia |
|---|---|---|
| E01-C1 | Proyecto React Native 0.87.x con TypeScript para Android, identificador y nombre de G-05 | Ver informe de cierre E01 |
| E01-C2 | Estructura inicial de carpetas según C4 Nivel 3 | `app/src/README.md` |
| E01-C3 | Herramientas de calidad configuradas (tsc, ESLint, Prettier) y sin errores | Registros de ejecución |
| E01-C4 | Pruebas configuradas (Jest + React Native Testing Library) pasan | Registros de ejecución |
| E01-C5 | Compilación Android (`assembleDebug`) con JDK 17 sin modificar Java global | `evidencias/ETAPA-01/` |
| E01-C6 | APK de depuración instalado y ejecutándose en Android 10 (API 29) | `evidencias/ETAPA-01/` |
| E01-C7 | Repositorio Git local con convenciones; documentos fuente intactos | Historial Git y hashes SHA-256 |
