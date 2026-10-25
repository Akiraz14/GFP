# Revisión consolidada antes de publicar — Claude (Linux), 2026-10-25

Árbol validado: `440ba4d` más la corrección de la serialización de la recuperación.
Entorno: Node 22.22.0 y npm 10.9.4 (Linux). La corrección solo cambia JavaScript, así que
la compilación Android de `440ba4d` (`windows-identity-20261025/`) sigue siendo válida
para el código nativo y los manifiestos.

| Paso | Comando | Código | Evidencia |
|---|---|---|---|
| Reproducción del hallazgo | Prueba temporal: 10 llamadas simultáneas a `complete()` con respuestas incorrectas | 10 de 10 evaluadas (`invalid_data`), cuando el límite es 3 | Registrada en `docs/decisiones.md`; la prueba temporal se sustituyó por las pruebas de regresión |
| Pruebas de regresión antes de corregir | `npx jest accountRecovery` | 2 fallos esperados de 15 | — |
| Instalación | `npm ci --no-audit --no-fund` | 0 | `ci.log` |
| Tipos | `npm run typecheck` | 0 | `typecheck.log` |
| Lint | `npm run lint` | 0 | `lint.log` |
| Formato | `npm run format:check` | 0 | `format-check.log` |
| Pruebas | `npx jest --ci --verbose` | 0 (13 suites, 76 pruebas) | `jest.log` |
| Auditoría | `npm audit` | 0 (0 vulnerabilidades) | `npm-audit.log` |
