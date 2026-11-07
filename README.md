# GFP — Gestión Financiera Personal

Aplicación móvil Android (React Native + TypeScript), de funcionamiento local, para
registrar y analizar ingresos y gastos personales. Entregable: APK instalable para
Android 10 (API 29) o superior.

## Fuentes de verdad (fuera del repositorio)

Por decisión del responsable del proyecto, los documentos fuente no se versionan en
este repositorio. Se conservan fuera de él, en la ubicación de trabajo del
responsable, y siguen siendo la fuente de verdad del proyecto:

- `Propuesta_comercial-Gestión_Financiera_Personal.pdf`
- `Propuesta_del_Proyecto_Gestion_Financiera_Personal_VF.md`
- `RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1.docx (2).pdf`

## Estructura

| Ruta | Contenido |
|---|---|
| `app/` | Proyecto React Native 0.87.1 (`co.gfpsas.gestionfinanciera`) |
| `app/src/` | Capas según C4 Nivel 3 (ver `app/src/README.md`) |
| `docs/` | Plan de etapas, decisiones, trazabilidad y guías de validación |
| `evidencias/` | Evidencias históricas de las Etapas 01 y 02; las siguientes se guardan fuera del repositorio (`docs/flujo-de-trabajo.md`) |
| `scripts/` | `stage-04/` y `stage-07/` (controles, compilación Debug y revisión del APK), `release/` (clave propia y APK Release firmado, D-06) y `validar-etapa.ps1` (histórico) |

## Comandos (desde `app/`)

```powershell
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
```

Instalación, compilación Debug y Release y validación final: `docs/guia-instalacion-ejecucion.md`
y `docs/validacion/guia-pruebas-manuales-finales.md`. Estado de la consolidación:
`docs/informe-consolidacion.md`. Cierre del proyecto y APK final: `docs/cierre-proyecto.md`.

## Ramas

- `main`: rama estable y publicada; solo recibe merges `--no-ff` aprobados.
- `eNN/<historia>` (etapas) y `fix/<tema>` (correcciones): se crean desde `main` actualizada.
- `etapa-NN-aprobada`: etiqueta del cierre aprobado de cada etapa.

Metodología completa en `docs/flujo-de-trabajo.md`.
