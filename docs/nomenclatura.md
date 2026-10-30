# Política de nomenclatura — GFP

Política oficial del repositorio, establecida por el responsable en la WU del
2026-10-25 (decisión G-09 en `decisiones.md`). Se aplica a todo artefacto nuevo o
renombrado.

## 1. Idioma

| Ámbito | Idioma |
|---|---|
| Código fuente y scaffolding: clases, interfaces, tipos, funciones, métodos, variables, constantes, módulos y carpetas de código | Inglés |
| Persistencia: entidades, propiedades, tablas, columnas, índices y restricciones | Inglés |
| Pruebas automatizadas, fixtures técnicos e identificadores de configuración | Inglés |
| Comentarios dentro de archivos de código | Español |
| Textos visibles de la aplicación y mensajes al usuario | Español |
| Documentación del proyecto, decisiones, arquitectura, criterios de aceptación e informes | Español |
| Mensajes de commit | Inglés, con Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `build:`) |

Los nombres técnicos existentes de paquetes, API y contratos públicos se conservan
(`co.gfpsas.gestionfinanciera`, `document_types` y `categories` de las HU,
`RNGetRandomValues`, nombres de bibliotecas).

## 2. Convenciones por tecnología

| Tecnología | Regla |
|---|---|
| TypeScript / React Native | Componentes y sus archivos en `PascalCase` (`App.tsx`). Otros módulos en `camelCase` (`secretVerifier.ts`). Tipos, interfaces y clases en `PascalCase`. Funciones, variables y propiedades en `camelCase`. Constantes de módulo en `UPPER_SNAKE_CASE`. Especificaciones de módulos nativos: `Native<Nombre>.ts`, como exige el codegen de React Native |
| Pruebas Jest | `__tests__/<capa>/<módulo>.test.ts`; títulos de prueba en inglés. Ayudas de prueba fuera de `__tests__/`, en `app/testing/` |
| SQL (SQLite/SQLCipher) | Tablas y columnas en `snake_case` inglés, tablas en plural (`users`, `security_answers`); índices únicos `ux_<tabla>_<columnas>` |
| Kotlin / Java (Android) | Paquetes en minúsculas bajo `co.gfpsas.gestionfinanciera`; clases en `PascalCase`; miembros en `camelCase`; constantes en `UPPER_SNAKE_CASE` |
| Recursos Android | `snake_case` (`data_extraction_rules.xml`) |
| PowerShell | Scripts nuevos en `kebab-case.ps1`; funciones `Verb-Noun`; parámetros y variables en `PascalCase` |

## 3. Etapas, decisiones y evidencias

- En prosa: «Etapa 02», «Etapa 03».
- Directorios de evidencias: desde la Etapa 05, `GFP-evidencias\eNN\`, fuera del repositorio (G-10, `flujo-de-trabajo.md`). `evidencias/ETAPA-01/` y `evidencias/ETAPA-02/` del repositorio, y `GFP-e03-evidencias` y `GFP-e04-evidencias`, se conservan como evidencia histórica donde están.
- Nuevos nombres de archivo: `kebab-case`, ASCII, sin espacios ni tildes, salvo los que exige una herramienta (`README.md`, `package.json`, `AndroidManifest.xml`) o las convenciones de la tabla anterior.
- Fechas en evidencias: `YYYYMMDD` (por ejemplo `claude-20261025/`).
- Se conservan los identificadores existentes: `E02-D1` a `E02-D9`, `E02-C1` a `E02-C8`, `E03-D1` a `E03-D10`, `G-xx`, `C-xx`, `HUx-CAyy`.

## 4. Aplicación

Antes de renombrar se revisan las referencias en scripts, configuración, imports,
pruebas y documentación, y se actualizan en el mismo cambio. No se renombran archivos
históricos, identificadores publicados, contratos ni datos persistidos sin una
necesidad demostrada.

### Auditoría del 2026-10-25

| Elemento | Situación | Acción |
|---|---|---|
| Carpetas de capas `app/src/` (`presentacion/`, `negocio/`, `servicios/`, `procesamiento/`, `analisis/`, `infraestructura/`) | Nombres de carpetas de código en español | Renombradas a `presentation/`, `business/`, `services/`, `processing/`, `analysis/` e `infrastructure/`. La única referencia era `app/src/README.md`, que se actualizó. Contenían solo un `README.md` cada una |
| Código nuevo de la Etapa 02 (`app/src/infrastructure/`, `app/src/services/`, `app/testing/`, `app/__tests__/`, `app/android/.../crypto/`) | Inglés según la política | Sin cambios |
| `scripts/validar-etapa.ps1` (nombre, parámetros `-Etapa`, `-IncluirRelease`, `-OmitirNpmCi`) | Artefacto aprobado de la Etapa 01 referenciado por evidencias históricas | Se conserva. Renombrarlo cambia su interfaz de línea de comandos y exige revalidación en Windows |
| `evidencias/ETAPA-01/**` y `evidencias/ETAPA-02/V4/**` | Evidencia histórica con rutas citadas en cierres y trazabilidad | Se conserva |
| `evidencias/ETAPA-02/archivo-spike-v4/` | Archivo experimental no integrable | Se conserva sin cambios ni traslado a producción |
| Documentos `docs/*.md` | Documentación en español, nombres `kebab-case` ASCII | Se conservan |
| Identidad Android `co.gfpsas.gestionfinanciera` | Contrato de la aplicación instalada (G-05) | Se conserva |
| Ramas y referencias Git (`spike/02-compatibilidad`, `etapa-01-aprobada`, `refs/revision/*`) | Referencias publicadas o históricas | Se conservan |
| Textos de catálogos (`app/src/infrastructure/database/seedCatalogs.ts`) | Etiquetas visibles en español con identificadores en inglés | Conforme a la política |
