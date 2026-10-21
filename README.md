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
| `evidencias/` | Resultados de validación por etapa |
| `scripts/` | `validar-etapa.ps1` (validación Android en Windows) |

## Comandos (desde `app/`)

```powershell
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
```

Validación Android completa: ver `docs/validacion/ETAPA-01.md`.

## Ramas

- `main`: solo etapas aprobadas. Aún no existe: se creará sobre el commit aprobado de la Etapa 01, junto con la etiqueta `etapa-01-aprobada`.
- `etapa/NN-nombre`: trabajo de cada etapa; al aprobarse se integra en `main` y se etiqueta `etapa-NN-aprobada`.
