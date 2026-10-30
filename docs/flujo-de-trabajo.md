# Flujo de trabajo y gestión del repositorio — GFP

Estándar de trabajo para todas las etapas a partir de la Etapa 05, aprobado por el responsable
el 2026-10-30 (G-10, `decisiones.md`). Complementa el protocolo por etapa de `plan-etapas.md` y la política de
nomenclatura de `nomenclatura.md`, y sustituye la sección «Ramas» anterior del `README.md`.

## 1. Repositorio canónico

- Única ubicación principal del proyecto: `C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP`, con el
  remoto `origin` en `https://github.com/Akiraz14/GFP.git` (G-08).
- Todas las ramas se gestionan dentro de ese repositorio, con `git switch`.
- La copia de trabajo de Claude no es canónica: un cambio existe en el proyecto cuando está
  aplicado y verificado en el repositorio canónico.

## 2. Ramas y etiquetas

| Referencia | Uso | Origen |
|---|---|---|
| `main` | Rama principal, estable y publicada. Solo recibe merges aprobados; no se desarrolla sobre ella | — |
| `eNN/<historia>` | Trabajo de una etapa, por ejemplo `e05/hu3-password-recovery` | `main` actualizada |
| `fix/<tema>` | Corrección independiente de una etapa | `main` actualizada |
| `etapa-NN-aprobada` | Etiqueta del commit de `main` que cierra una etapa aprobada | — |

- Antes de crear una rama: `git fetch origin` y comprobar que `main` y `origin/main` apuntan al
  mismo commit.
- Un mismo cambio no se implementa en dos ramas sin una justificación explícita y aprobada. Si
  una etapa necesita una corrección de `fix/<tema>`, primero se integra la corrección en `main` y
  después se lleva `main` a la rama de la etapa.

## 3. Worktrees

No son el mecanismo predeterminado. Solo se usa uno cuando hay una necesidad técnica
justificada, por ejemplo validar en paralelo dos ramas distintas.

- Como máximo un worktree temporal, siempre en `GFP Proyecto\GFP-wt`.
- Su motivo se registra en el informe de la etapa antes de crearlo.
- Se retira con `git worktree remove` cuando el trabajo se integra, con autorización del
  responsable.
- No se crean carpetas por rama.

## 4. Flujo de una etapa

1. Verificar que `main` está limpia y sincronizada con `origin/main`.
2. Crear la rama de la etapa desde `main`.
3. Implementar los cambios exclusivamente en esa rama.
4. Ejecutar las pruebas y documentar sus evidencias (sección 6).
5. Revisión técnica y aprobación del responsable.
6. Integrar con `git merge --no-ff` en `main`.
7. Ejecutar las verificaciones finales sobre `main`.
8. Publicar `main` en `origin`, previa autorización del responsable.
9. Crear la etiqueta `etapa-NN-aprobada`.
10. Cerrar la etapa (`cierre-etapa-NN.md`) y conservar su trazabilidad.

## 5. Entrega de commits desde el entorno de Claude

Claude prepara los commits en su propio entorno y los entrega como Git bundles en
`GFP Proyecto\transfer\eNN\`. Cada entrega indica:

- la rama destino;
- el commit padre esperado (el `HEAD` actual de la rama destino);
- el commit resultante esperado;
- el SHA-256 del bundle.

Aplicación en el repositorio canónico. Es el procedimiento estándar para aplicar una entrega
autorizada: solo hace avanzar la rama (`--ff-only`) y no crea commits de merge. Antes se comprueban
el estado limpio, la rama destino, el commit padre, el SHA-256 y la validez del bundle; después,
que el commit recibido sea el esperado. Si una comprobación falla, la aplicación se detiene.

```powershell
cd "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP"
git switch <rama destino>                           # si la rama es nueva: git switch -c <rama destino> <commit padre>
git status --porcelain                              # debe estar vacío
git rev-parse HEAD                                  # debe ser el commit padre esperado
(Get-FileHash "..\transfer\eNN\<bundle>" -Algorithm SHA256).Hash
git bundle verify "..\transfer\eNN\<bundle>"
git fetch "..\transfer\eNN\<bundle>" <rama destino>
git rev-parse FETCH_HEAD                            # debe ser el commit esperado
git merge --ff-only FETCH_HEAD                      # solo avance; falla si no es descendiente
git rev-parse HEAD; git status --porcelain          # commit esperado y árbol limpio
```

Si un hash o un commit no coincide, la entrega no se aplica y se informa. `transfer\` no es
un remoto: después de aplicar una entrega, el repositorio canónico es la única referencia.

## 6. Archivos fuera del repositorio

| Ubicación | Contenido |
|---|---|
| `GFP Proyecto\GFP-evidencias\eNN\` | Evidencias de las pruebas de cada etapa (política global de evidencias, G-10): una carpeta por ejecución, sin sobrescribir, con cuentas sintéticas y sin secretos (práctica de E04-D8). Las evidencias no se versionan |
| `GFP Proyecto\GFP-herramientas\` | Scripts auxiliares de validación que no se versionan. Los scripts de validación de una etapa que sí se versionan van en `scripts/stage-NN/` del repositorio |
| `GFP Proyecto\transfer\eNN\` | Bundles y otras entregas |
| `GFP Proyecto\GFP Archivos\`, `_originals\` | Documentos fuente; no se modifican |

No se crean carpetas nuevas cuando ya existe una ubicación definida para ese tipo de contenido.
Las evidencias y carpetas de etapas anteriores se conservan exactamente donde están, sin mover
ni renombrar: `evidencias/ETAPA-01/` y `evidencias/ETAPA-02/` en el repositorio,
`GFP-e03-evidencias\` y `GFP-e04-evidencias\` fuera de él, y `tmp\` y `transfer\stage-04\`.

## 7. Control y seguridad

- No se eliminan ramas, worktrees, evidencias ni archivos sin autorización del responsable.
- Sin autorización, no se hace merge, push, reset destructivo, rebase ni cherry-pick que afecte al
  repositorio canónico.
- No se modifica `main` directamente durante el desarrollo.
- No se sobrescribe trabajo existente.
- No se repiten validaciones que tienen evidencia vigente y válida.
- Se mantiene la trazabilidad entre historias, commits, pruebas y decisiones (`trazabilidad.md`,
  `decisiones.md`, `cierre-etapa-NN.md`).
