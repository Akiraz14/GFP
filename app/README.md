# GFP — aplicación Android

Proyecto React Native 0.87.1 con TypeScript. Solo Android (iOS está fuera del alcance).

- Identificador: `co.gfpsas.gestionfinanciera`
- Nombre visible: `GFP`
- Android mínimo: 10 (API 29)

## Requisitos

Node.js 22.13+ o 24.3+, JDK 17 y Android SDK con build-tools 37.0.0 y
NDK 27.1.12297006. El detalle del entorno validado está en `../docs/decisiones.md`.

## Calidad y pruebas

Desde esta carpeta (`app/`):

```powershell
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
```

## Ejecutar en el emulador

En una terminal, iniciar Metro:

```powershell
npm start
```

En otra terminal, con el emulador abierto y JDK 17 en `JAVA_HOME` para esa sesión:

```powershell
npm run android
```

## Validación por etapa

La validación completa (compilación Debug y Release, instalación, apertura y
evidencias) se ejecuta con `..\scripts\validar-etapa.ps1`. Ver
`../docs/validacion/ETAPA-01.md`.
