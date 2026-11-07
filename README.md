# GFP — Gestión Financiera Personal

Aplicación móvil Android (React Native + TypeScript) para registrar y analizar ingresos y gastos
personales, con recomendaciones basadas en reglas. Funciona sin conexión y sin servidor: los datos
quedan en el dispositivo, en una base de datos cifrada (SQLCipher). Requiere Android 10 (API 29) o
superior.

**Estado:** MVP finalizado, versión 1.0. Implementa las historias de usuario HU1 a HU10. Resumen
de la entrega, pruebas, APK y declaración de cierre: [`docs/cierre-proyecto.md`](docs/cierre-proyecto.md).

## Funcionalidades

- Registro, inicio de sesión y recuperación de contraseña con preguntas de seguridad.
- Registro, edición, eliminación y consulta de ingresos y gastos, con filtros y balance.
- Captura de gastos con la cámara o la galería y lectura OCR en el dispositivo (ML Kit).
- Categorías del sistema y propias.
- Análisis financiero por período y recomendaciones automáticas (reglas R1 a R8 y Consejo de Ahorro).

## Fuentes de verdad (fuera del repositorio)

Por decisión del responsable del proyecto, los documentos fuente no se versionan en este
repositorio. Se conservan fuera de él y siguen siendo la fuente de verdad del proyecto:

- `Propuesta_comercial-Gestión_Financiera_Personal.pdf`
- `Propuesta_del_Proyecto_Gestion_Financiera_Personal_VF.md`
- `RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1.docx (2).pdf`

## Estructura

| Ruta | Contenido |
|---|---|
| `app/` | Proyecto React Native 0.87.1 (`co.gfpsas.gestionfinanciera`) |
| `app/src/` | Capas según C4 nivel 3 (`app/src/README.md`) |
| `app/__tests__/`, `app/testing/` | Pruebas automatizadas (Jest) y sus utilidades |
| `docs/` | Documentación del proyecto (ver abajo) |
| `evidencias/` | Evidencias históricas de las Etapas 01 y 02; las siguientes se guardan fuera del repositorio (`docs/flujo-de-trabajo.md`) |
| `scripts/` | `stage-04/` y `stage-07/` (controles, compilación Debug y revisión del APK), `release/` (clave propia y APK Release firmado, D-06) y `validar-etapa.ps1` (histórico) |

## Documentación

| Tema | Documento |
|---|---|
| Cierre del MVP y entrega | `docs/cierre-proyecto.md` |
| Instalación, compilación y APK Release | `docs/guia-instalacion-ejecucion.md` |
| Pruebas en el emulador Android | `docs/testing/guia-pruebas-emulador-android.md` |
| Pruebas automatizadas | `docs/testing/guia-pruebas-automatizadas.md` |
| Trazabilidad de los 99 criterios de aceptación | `docs/trazabilidad.md`, `docs/cobertura-hu1-hu10.md` |
| Decisiones | `docs/decisiones.md` (registro general) y `docs/decisiones-*.md` (por etapa) |
| Arquitectura de identidad y persistencia | `docs/arquitectura-identidad.md` |
| Ajustes finales, recomendaciones e ícono | `docs/ajustes-finales.md`, `docs/recomendaciones-ampliadas.md`, `docs/icono-aplicacion.md` |
| Plan, metodología y nomenclatura | `docs/plan-etapas.md`, `docs/flujo-de-trabajo.md`, `docs/nomenclatura.md` |
| Historial de etapas (antecedentes) | `docs/cierre-etapa-*.md`, `docs/validacion/`, `docs/informe-consolidacion.md`, `docs/auditoria-integral-repositorios.md`, `docs/incidencias-y-mejoras.md`, `docs/correcciones-android10.md`, `docs/referencia/` |

## Comandos (desde `app/`)

```powershell
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
```

## Ramas

- `main`: rama estable y publicada; solo recibe merges `--no-ff` aprobados.
- `eNN/<historia>` (etapas) y `fix/<tema>` (correcciones): se crean desde `main` actualizada.
- `etapa-NN-aprobada`: etiqueta del cierre aprobado de cada etapa.

Metodología completa en `docs/flujo-de-trabajo.md`.
