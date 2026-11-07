# Guía de pruebas automatizadas de GFP

Qué validan las pruebas automatizadas de GFP, cómo ejecutarlas, cómo leer sus resultados y cómo
agregar pruebas nuevas. Todos los comandos son para **Windows PowerShell** y se ejecutan desde la
carpeta `app` del repositorio:

```powershell
$Repo = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP"
Set-Location "$Repo\app"
```

> Si PowerShell bloquea `npx` o `npm` por la política de ejecución, use `npx.cmd` y `npm.cmd`
> (así los llaman los scripts de `scripts\stage-04`).

---

## A. Fundamentos y estructura

### Herramientas

| Herramienta | Papel en GFP |
|---|---|
| **Jest** (`jest` 29, preset `@react-native/jest-preset`) | Ejecuta las pruebas en Node.js, en el PC, sin emulador. Configuración en `app/jest.config.js` y `app/jest.setup.js`; `npm test` ejecuta `jest` |
| **React Native Testing Library** (`@testing-library/react-native`) | Renderiza pantallas y componentes en memoria y permite buscarlos (`getByTestId`, `getByText`), pulsarlos (`fireEvent.press`) y escribir en ellos (`fireEvent.changeText`), como haría el usuario |
| **`node:sqlite`** (`app/testing/nodeSqliteDatabase.ts`) | Base SQLite **real en memoria** que implementa la misma interfaz `SqlDatabase` que la app. Los servicios y repositorios ejecutan su SQL y sus migraciones de verdad, pero **sin el cifrado SQLCipher** del dispositivo |
| **Dobles de prueba** (`jest.mock`, `jest.spyOn`, servicios falsos) | Reemplazan lo que no existe en Node: módulos nativos, cámara, OCR y calendario |

Al ejecutar Jest aparece `ExperimentalWarning: SQLite is an experimental feature`. Es el aviso de
Node por `node:sqlite` y no indica un fallo.

### Qué se simula siempre (`app/jest.setup.js`)

| Módulo | Sustituto |
|---|---|
| `react-native-safe-area-context` | Su mock oficial |
| `@react-native-community/datetimepicker` | `DateTimePickerAndroid.open` y `dismiss` como `jest.fn()`: cada prueba decide la fecha elegida |
| `react-native-image-picker` | `launchCamera` y `launchImageLibrary` como `jest.fn()` |
| `@react-native-ml-kit/text-recognition` | `recognize` como `jest.fn()`; las pruebas de HU7 usan un `ReceiptGateway` falso |

Además, algunos archivos simulan lo suyo: `App.test.tsx` reemplaza
`src/services/nativeAppServices` por servicios con la base en memoria, y `pbkdf2Engine.test.ts`
simula el módulo nativo `NativeGfpCrypto`.

### Organización

`app/__tests__` replica las capas de `app/src`. Las utilidades compartidas están en `app/testing`:

| Carpeta de pruebas | Código que prueba |
|---|---|
| `__tests__/analysis` | `src/analysis` (métricas de HU9 y reglas de HU10) |
| `__tests__/business` | `src/business` (dinero, fechas, reglas y servicios de categorías, movimientos y recomendaciones) |
| `__tests__/infrastructure` | `src/infrastructure` (base cifrada, migraciones, repositorios, seguridad) |
| `__tests__/presentation` | `src/presentation` (pantallas) |
| `__tests__/processing` | `src/processing` (extracción de datos del OCR) |
| `__tests__/services` | `src/services` (autenticación y sesión) |
| `__tests__/App.test.tsx` | La app completa: arranque, navegación y flujos entre pantallas |

| Utilidad (`app/testing`) | Uso |
|---|---|
| `nodeSqliteDatabase.ts` | `createNodeSqliteDatabase()`, `nodeRandomBytes`, `nodePbkdf2Engine` (PBKDF2 de Node), `sequenceRandom()` |
| `identityFixtures.ts` | `createMigratedDatabase()` (base en memoria con todas las migraciones), `createAccount()`, `profile()`, `TEST_PARAMETERS`, `DEFAULT_ANSWERS` |
| `movementFixtures.ts` | `item()`: movimientos de prueba para HU9 y HU10 |
| `renderOrder.ts` | `testIdsInOrder()`: orden en pantalla de los elementos, para comprobar la disposición sin depender de estilos |

### Tipos de prueba que existen en GFP

| Tipo | Qué hace | Ejemplos reales |
|---|---|---|
| **Unitaria** | Llama a funciones puras con datos fijos. Sin base de datos ni interfaz | `business/money.test.ts`, `analysis/recommendations.test.ts`, `processing/receiptExtraction.test.ts` |
| **Integración de servicios** | Un servicio real con la base SQLite en memoria migrada y una sesión real (`SessionManager`) | `business/movementManagement.test.ts`, `services/authentication/accountLogin.test.ts` |
| **Persistencia** | Migraciones y repositorios contra la base en memoria | `infrastructure/migrator.test.ts`, `infrastructure/movementMigration.test.ts` |
| **Infraestructura con dobles** | Lógica que envuelve módulos nativos, con el módulo simulado | `infrastructure/encryptedDatabase.test.ts`, `infrastructure/pbkdf2Engine.test.ts`, `infrastructure/secureRandom.test.ts` |
| **Componente o pantalla** | Una pantalla renderizada con servicios reales (o falsos) y la base en memoria | `presentation/MovementFormScreen.test.tsx`, `presentation/LoginScreen.test.tsx` |
| **Integración de la app** | `App` completa: arranque, navegación entre pantallas y flujos de varias historias | `App.test.tsx` |

**Jest no tiene pruebas de dispositivo.** Las pruebas en el emulador son manuales
(`docs/testing/guia-pruebas-emulador-android.md`). En `scripts\stage-04` hay scripts de recorrido
en dispositivo de etapas anteriores (`Invoke-Hu2DeviceTests.ps1`, `Invoke-Hu1DeviceRegression.ps1`,
`Invoke-HermesUnicodeCheck.ps1`, `Invoke-Pbkdf2UpgradeCheck.ps1`). Se escribieron para HU1 y HU2
y no se han vuelto a validar con las pantallas actuales.

---

## B. Inventario de pruebas

Los grupos que siguen se tomaron de los bloques `describe` reales de cada archivo. Los nombres de
las pruebas incluyen el identificador del criterio o la decisión que validan (por ejemplo
`HU4-CA05`, `E-COR-D3`, `AJ-02`), así que un fallo apunta directamente a su requisito en
`docs/trazabilidad.md`.

### Autenticación y sesión (`__tests__/services`)

| Archivo | Tipo | Qué valida | Errores que detecta |
|---|---|---|---|
| `authentication/accountRegistration.test.ts` | Integración | Registro de cuentas (HU1) en la base en memoria | Cuentas duplicadas o incompletas guardadas; secretos guardados sin derivar |
| `authentication/accountLogin.test.ts` | Integración | Inicio de sesión (HU2) con correo, documento o celular; bloqueo de 15 minutos tras tres fallos; una sesión por cuenta | Acceso con credenciales incorrectas; bloqueos que no se aplican, no se levantan o no sobreviven a un reinicio |
| `authentication/accountRecovery.test.ts` | Integración | Recuperación con preguntas de seguridad (HU3), bloqueo por intentos y política de la contraseña nueva | Recuperación con respuestas incorrectas; un usuario que recupera la cuenta de otro; contraseña nueva que no se aplica |
| `authentication/registrationValidation.test.ts` | Unitaria | Nombres, documentos, correo, teléfono, contraseña y mensajes de error de HU1 | Datos inválidos aceptados o válidos rechazados; mensajes equivocados |
| `authentication/passwordPolicy.test.ts`, `securityQuestionPolicy.test.ts` | Unitaria | Reglas de contraseña y de preguntas de seguridad | Reglas que dejan de coincidir entre HU1 y HU3 |
| `authentication/secretNormalization.test.ts`, `secretVerifier.test.ts` | Unitaria | Normalización de secretos y verificador PBKDF2 (E02-D1, E02-D2) | Respuestas equivalentes que no coinciden; verificación incorrecta |
| `authentication/attemptThrottle.test.ts` | Unitaria | Bloqueo de 15 minutos tras tres fallos de inicio de sesión y esperas crecientes de la recuperación (hasta 24 horas) | Bloqueos o esperas mal calculados, también si el reloj retrocede |
| `session/userIsolation.test.ts` | Integración | Aislamiento entre usuarios del mismo dispositivo (E02-D4) y de sus categorías | Un usuario que ve o modifica datos de otro |

### Servicios y reglas de negocio (`__tests__/business`, `__tests__/analysis`, `__tests__/processing`)

| Archivo | Tipo | Qué valida | Errores que detecta |
|---|---|---|---|
| `business/movementManagement.test.ts` | Integración | Guardar, editar, listar y eliminar movimientos (HU4, HU5), totales (HU6), aislamiento y sesión obligatoria | Datos inválidos escritos; movimientos de otro usuario visibles; totales erróneos |
| `business/categoryManagement.test.ts` | Integración | Categorías (HU8): crear, duplicados, editar, eliminar y reasignar a «Otros» | Duplicados aceptados; categorías del sistema modificables |
| `business/recommendationService.test.ts` | Integración | Servicio de recomendaciones (HU10) y descarte por sesión (AJ-05) | Recomendaciones de otro usuario; descartes que persisten entre sesiones |
| `business/money.test.ts` | Unitaria | Lectura de montos (HU4-CA05), formato colombiano (D-01) y máscara (E-COR-D3) | Montos mal interpretados; formato o cursor incorrectos |
| `business/localDate.test.ts`, `movementRules.test.ts`, `categoryRules.test.ts`, `movementFilters.test.ts` | Unitaria | Fechas sin hora, validaciones, nombres de categoría y filtros del historial | Fechas futuras aceptadas; filtros que no coinciden con HU5, HU9 o HU10 |
| `analysis/financialAnalysis.test.ts` | Unitaria | Períodos y métricas de HU9; períodos equivalentes de HU10 | Totales o porcentajes erróneos; meses o bisiestos mal calculados |
| `analysis/recommendations.test.ts` | Unitaria | Reglas R1 a R8 y Consejo de Ahorro: umbrales, prioridades y períodos | Recomendaciones en el umbral equivocado o que se contradicen |
| `processing/receiptExtraction.test.ts` | Unitaria | Monto, fecha y comercio a partir del texto del OCR, incluidos documentos girados (AJ-02) | Montos tomados de códigos; fechas o comercios equivocados |

Las pruebas de HU7 no ejecutan ML Kit: trabajan con el texto y las posiciones que ML Kit
devolvería.

### Persistencia e infraestructura (`__tests__/infrastructure`)

| Archivo | Tipo | Qué valida | Errores que detecta |
|---|---|---|---|
| `migrator.test.ts` | Persistencia | Orden, registro y checksums de las migraciones (E02-D5) | Migraciones aplicadas dos veces o modificadas después de entregadas |
| `categoryMigration.test.ts`, `movementMigration.test.ts` | Persistencia | Tablas, restricciones y datos iniciales de las migraciones 4, 5 y 6 | Restricciones de la base que dejan pasar datos inválidos |
| `identityRepository.test.ts` | Persistencia | Documentos, teléfonos E.164, identificadores únicos y creación atómica de cuentas | Cuentas a medio crear; identificadores ambiguos |
| `encryptedDatabase.test.ts` | Infraestructura con dobles | Apertura de la base cifrada y manejo de la clave (E02-D3), con un cifrador falso | Claves perdidas o regeneradas; errores de apertura no controlados |
| `pbkdf2Engine.test.ts` | Infraestructura con dobles | Puente con el módulo nativo de PBKDF2, comparado con vectores conocidos | Argumentos o resultados incorrectos del puente |
| `secureRandom.test.ts` | Infraestructura con dobles | Fuente aleatoria nativa: falla cerrada si el módulo falta | Uso de una fuente aleatoria insegura |
| `encoding.test.ts` | Unitaria | Base64, hexadecimal, UTF-8 y comparación de bytes sin salida temprana | Conversiones de bytes erróneas |

### Pantallas (`__tests__/presentation`) y app completa

| Archivo | Qué valida |
|---|---|
| `RegistrationWizard.test.tsx` | Asistente de registro (HU1): pasos, mensajes, foco y fidelidad al mockup |
| `LoginScreen.test.tsx` | Inicio de sesión (HU2), placeholder de la contraseña (AJ-03) |
| `PasswordRecoveryScreen.test.tsx` | Recuperación (HU3): pasos, foco de las respuestas |
| `MovementFormScreen.test.tsx` | Registro y edición (HU4), datos precargados de HU7 y confirmación al actualizar con regreso automático |
| `MovementHistoryScreen.test.tsx` | Historial (HU5), tarjetas y botones flotantes (AJ-01) |
| `ReceiptCaptureScreen.test.tsx` | Captura de comprobante (HU7) con un `ReceiptGateway` falso |
| `CategoriesScreen.test.tsx` | Categorías (HU8) y sus diálogos |
| `AnalysisAndRecommendations.test.tsx` | Análisis (HU9) y recomendaciones (HU10): tarjetas, íconos, colores, acciones y descarte |
| `modalDismiss.test.tsx` | Cierre de los diálogos al pulsar fuera (Task 36) |
| `App.test.tsx` | Arranque y bloqueo controlado si la base no abre (clave perdida o rechazada, sin SQLCipher, esquema más nuevo); navegación y flujos completos de HU1 a HU10 entre pantallas |

Detectan textos o botones que faltan, navegaciones equivocadas, validaciones que no se muestran,
estados que no se limpian y cambios en el orden de los elementos. **No** detectan problemas de
aspecto real (píxeles, fuentes o tamaños en pantalla).

---

## C. Comandos de ejecución

| # | Necesidad | Comando |
|---|---|---|
| 1 | Toda la suite | `npx jest` (o `npm test`) |
| 2 | Un archivo | `npx jest __tests__/presentation/MovementFormScreen.test.tsx` |
| 3 | Varios archivos | `npx jest __tests__/business/money.test.ts __tests__/analysis/recommendations.test.ts` |
| 3b | Una carpeta (la ruta es un patrón) | `npx jest __tests__/services/authentication` |
| 4 | Por nombre de prueba o de `describe` | `npx jest -t "HU4 form \(edit mode"`; dentro de un archivo: `npx jest __tests__/presentation/MovementFormScreen.test.tsx -t "after a successful update"` |
| 5 | Modo detallado (lista cada prueba) | `npx jest __tests__/presentation/MovementFormScreen.test.tsx --verbose` |
| 6 | Secuencial (un archivo a la vez) | `npx jest --runInBand` (o `-i`); con más tiempo por prueba: `npx jest --runInBand --testTimeout=30000` |
| 7a | Pruebas que dependen de un archivo de código | `npx jest --findRelatedTests src/presentation/movements/MovementFormScreen.tsx` |
| 7b | Pruebas afectadas por los cambios sin confirmar en Git | `npx jest --onlyChanged` (o `-o`) |
| 8 | Cobertura | `npx jest --coverage` |
| — | Ver qué archivos ejecutaría, sin ejecutarlos | `npx jest --listTests` (se combina con 7a: `npx jest --findRelatedTests <archivo> --listTests`) |

Notas:

- Las rutas y `-t` son **expresiones regulares**: escape los paréntesis y otros símbolos (`\(`).
  Use `/` en las rutas; Jest las convierte en Windows.
- `-t` ejecuta solo las pruebas cuyo nombre coincide; las demás aparecen como `skipped`.
- Con `npm test` los argumentos van después de `--`: `npm test -- --runInBand`.
- La cobertura queda en `app\coverage` (ignorada por Git; ábrala con
  `Invoke-Item "$Repo\app\coverage\lcov-report\index.html"`). No hay `collectCoverageFrom` en la
  configuración, así que solo informa sobre los archivos que cargan las pruebas ejecutadas.
- `Invoke-StaticChecks.ps1` ejecuta `npx.cmd jest --ci`. `--ci` no guarda snapshots nuevos; el
  proyecto no usa snapshots.

---

## D. Cómo interpretar los resultados

| Término | Significado |
|---|---|
| **Suite** | Un archivo de pruebas. `Test Suites: 1 failed, 38 passed, 39 total` = archivos |
| **Prueba** | Un `test(...)`. `Tests: 2 failed, 710 passed, 712 total` = pruebas individuales |
| **PASS** / **FAIL** | Encabezado por archivo: PASS si todas sus pruebas pasaron; FAIL si al menos una falló o el archivo no se pudo cargar |
| `✓` / `✕` | Prueba aprobada / fallida (se ven con `--verbose` o cuando hay fallos) |
| **skipped** | No se ejecutó porque no coincidía con `-t` o con el patrón. No es un fallo |
| **pending** / **todo** | `test.skip`, `xit` o `test.todo`. Hoy no hay ninguno en el proyecto; si aparece, alguien desactivó una prueba |

Al final, Jest muestra cada fallo con su ruta, la línea y el motivo. Los ejemplos siguientes son
**ilustrativos**, no resultados reales.

**Aserción.** El valor obtenido no es el esperado:

```text
● HU4-CA05: amount input › accepts «45.500» as 4550000 cents
    expect(received).toBe(expected) // Object.is equality
    Expected: 4550000
    Received: 45500
      > 27 |     expect(parseAmountInput(raw)).toBe(cents);
```

Lea `Expected` (lo que exige la prueba) frente a `Received` (lo que hizo el código) y vaya a la
línea marcada con `>`. Si el requisito cambió, se actualiza la prueba; si no, se corrige el código.

**Elemento no encontrado en una pantalla:**

```text
Unable to find an element with testID: movement-updated-back
```

El elemento no se renderizó: falta, cambió su `testID` o aparece más tarde (use `findBy...`, que
espera, en vez de `getBy...`).

**Mocks.** Síntomas típicos:

- `TurboModuleRegistry.getEnforcing(...): '...' could not be found`, o `Cannot read properties of
  undefined` dentro de un módulo nativo: el código cargó un módulo nativo que no está simulado. Se
  simula en `jest.setup.js` (si es global) o con `jest.mock` en el archivo.
- `expect(jest.fn()).toHaveBeenCalledTimes(1)` con `Received number of calls: 0`: la función
  simulada no se llamó (por ejemplo, `onDone` de una pantalla).
- Resultados que dependen del orden de ejecución: un mock que no se restauró. Use
  `mockRestore()` o `jest.restoreAllMocks()` en `afterEach`.

**Timeout:**

```text
thrown: "Exceeded timeout of 5000 ms for a test."
```

Una promesa nunca terminó (por ejemplo, un `findBy...` que espera un elemento que no aparece) o
la prueba es lenta en ese equipo. 5000 ms es el límite predeterminado de Jest; `App.test.tsx` lo
amplía a 20.000 ms con `jest.setTimeout`. Si solo falla en Windows por lentitud:
`npx jest --runInBand --testTimeout=30000`.

**Advertencia `act(...)`** (`An update to ... inside a test was not wrapped in act(...)`): la
pantalla cambió después de terminar la prueba. Espere el estado final (`findBy...`, `waitFor`) o
desmonte la vista al terminar (`await view.unmount()`).

**Dónde ver el detalle:** en la propia consola, al final de la salida, y con `--verbose` para
ver qué pruebas pasaron. `Invoke-StaticChecks.ps1` guarda la salida completa en `jest.log` dentro
de su carpeta de evidencias.

---

## E. Cómo agregar nuevas pruebas

### Ubicación y nombres

- Archivo en la carpeta de `__tests__` que corresponde a la capa de `src`: una pantalla de
  `src/presentation/movements` se prueba en `__tests__/presentation/<NombreDelArchivo>.test.tsx`;
  un módulo de `src/business` en `__tests__/business/<modulo>.test.ts`.
- `.test.tsx` si la prueba renderiza componentes; `.test.ts` en otro caso.
- Identificadores y nombres de pruebas en inglés; los comentarios pueden ir en español.
- El proyecto usa `test(...)` (no `it`) y nombres que empiezan con el criterio o la decisión:
  `test('HU4-CA05: a non positive amount shows «Ingrese un monto válido» next to the field', ...)`.
- `describe` agrupa por historia o por ajuste: `describe('HU4 form (create mode)', ...)`,
  `describe('AJ-02: rotated documents, codes and merchant name', ...)`.

### Patrón de una prueba unitaria

Datos fijos y una aserción por caso; `test.each` para tablas de casos (de
`__tests__/business/money.test.ts`):

```ts
describe('HU4-CA05: amount input', () => {
  test.each([
    ['45500', 4_550_000],
    ['1.250.000,50', 125_000_050],
  ])('accepts «%s» as %d cents', (raw, cents) => {
    expect(parseAmountInput(raw)).toBe(cents);
  });
});
```

Para HU9 y HU10, `item()` de `testing/movementFixtures.ts` crea movimientos:
`evaluateRecommendations([item('2026-11-02', 'expense', 5000)], '2026-11-04')`.

### Patrón de una prueba de servicio o pantalla

Cada prueba crea **su propia** base en memoria, cuenta y sesión. Así no depende de ninguna otra
prueba ni del orden en que se ejecuten (resumido de `__tests__/presentation/MovementFormScreen.test.tsx`):

```ts
async function setup() {
  const database = await createMigratedDatabase();          // base nueva y migrada
  const userId = await createAccount(database, profile());  // cuenta de prueba
  const sessions = new SessionManager(nodeRandomBytes);
  const movements = new MovementManagementService({
    database, sessions, random: nodeRandomBytes, now: () => NOW,
  });
  const categories = new CategoryManagementService({ database, sessions, random: nodeRandomBytes });
  return { movements, categories, session: sessions.start(userId) };
}

test('HU4-CA07 and CA08: «Actualizar» saves and shows the update message', async () => {
  // ...render(<MovementFormScreen ... onDone={jest.fn()} />), luego:
  await fireEvent.changeText(screen.getByTestId('movement-amount'), '50000');
  await fireEvent.press(screen.getByTestId('movement-save'));
  expect(await screen.findByText('El movimiento fue actualizado exitosamente')).toBeTruthy();
});
```

Pautas:

- **Fecha fija:** los servicios y pantallas reciben `now`; use una constante (`NOW`), nunca la
  fecha real.
- **Buscar por `testID` o por texto visible**, y `findBy...` cuando el elemento aparece tras una
  operación asíncrona.
- **Mocks:** prefiera servicios reales con la base en memoria. Simule solo lo nativo o el caso
  difícil de provocar, con `jest.spyOn(...).mockResolvedValueOnce(...)` (por ejemplo, un fallo al
  guardar: `jest.spyOn(context.movements, 'update').mockResolvedValueOnce({ status: 'failed' })`).
- **Limpieza:** restaure lo que cambie de forma global (`spy.mockRestore()`,
  `jest.restoreAllMocks()` en `afterEach`, `mockReset()` de los mocks de `jest.setup.js` en
  `beforeEach`, como `openPicker.mockReset()`). Desmonte las vistas que sigan actualizándose
  (`await view.unmount()`).

### Temporizadores controlados

Cuando el código usa `setTimeout`, no espere el tiempo real. Ejemplo real (confirmación al
actualizar un movimiento, regreso automático a los 2500 ms):

```ts
beforeEach(() => {
  // Temporizadores falsos; las promesas de node:sqlite siguen funcionando.
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('returns to the history by itself after 2500 ms', async () => {
  const { onDone } = await update();
  await act(() => jest.advanceTimersByTime(2499));
  expect(onDone).not.toHaveBeenCalled();
  await act(() => jest.advanceTimersByTime(1));
  expect(onDone).toHaveBeenCalledTimes(1);
});
```

`jest.getTimerCount()` comprueba que no queden temporizadores pendientes. Avance los
temporizadores dentro de `act(...)` para que la pantalla se actualice.

### Antes de dar por buena una prueba nueva

1. Ejecútela sola (`npx jest <archivo> -t "<nombre>"`) y compruebe que falla si el código está
   mal, por ejemplo cambiando temporalmente el valor esperado.
2. Ejecute su archivo completo y después la suite (sección G).

---

## F. Qué demuestra cada tipo de verificación

| Verificación | Herramienta | Demuestra | No demuestra |
|---|---|---|---|
| Pruebas automatizadas | Jest | La lógica, las reglas, el SQL y las migraciones contra SQLite, y el comportamiento de las pantallas (textos, botones, navegación, validaciones, temporizadores) | Cifrado real, módulos nativos, aspecto visual, rendimiento |
| Verificaciones estáticas | `npm run typecheck`, `npm run lint`, `npm run format:check` | Tipos correctos, reglas de ESLint y formato de Prettier | Que la app funcione |
| Compilación Android | `Invoke-AndroidBuild.ps1` (Debug), `Invoke-ReleaseBuild.ps1` (Release) | Que el código nativo, los recursos y las dependencias compilan y generan el APK; el Release comprueba firma, paquete, SDK mínimo y bundle | Que las pantallas se comporten bien |
| Pruebas manuales | Emulador o celular, según `guia-pruebas-emulador-android.md` | Lo que ve y hace el usuario: aspecto, fidelidad a los mockups, flujo real | Casos límite que Jest cubre con precisión (umbrales, fechas, bisiestos) |
| Pruebas funcionales de dispositivo | La app instalada en Android | Lo que solo existe en el dispositivo (ver abajo) | — |

Requieren la app en el emulador o en un celular, porque en Jest están simulados o no existen:

- SQLCipher (la base cifrada real) y la clave en el Android Keystore (`react-native-keychain`).
- El PBKDF2 nativo (`NativeGfpCrypto`) y la fuente aleatoria nativa.
- Cámara, galería y el reconocimiento real de ML Kit (HU7).
- El calendario nativo.
- El motor Hermes (Jest usa el JavaScript de Node), el teclado, el botón Atrás físico y el
  aspecto real: colores, íconos, tamaños y desplazamiento.
- La instalación, la actualización y los permisos del APK.

---

## G. Flujo recomendado de trabajo

| Etapa | Cuándo | Comando (desde `$Repo\app`) |
|---|---|---|
| 1. Pruebas relacionadas | Tras cada cambio | `npx jest --findRelatedTests <archivo de src modificado>` o `npx jest <archivo de prueba>` |
| 2. Corregir errores | Si algo falla | Repetir la etapa 1; con detalle: `npx jest <archivo> --verbose` |
| 3. Verificaciones estáticas | Antes de dar el cambio por terminado | `npm run typecheck`, `npm run lint`, `npm run format:check` |
| 4. Suite completa | Antes de integrar, o si el cambio toca código compartido | `npx jest` (en Windows, si va lento: `npx jest --runInBand --testTimeout=30000`) |
| 5. Prueba en dispositivo | Si el cambio afecta a lo que ve el usuario o a algo nativo (sección F) | `docs/testing/guia-pruebas-emulador-android.md` |
| 6. Evidencias | Cuando se integra o se entrega | `Invoke-StaticChecks.ps1` (árbol limpio) y `Invoke-AndroidBuild.ps1`, con `-EvidenceRoot` fuera del repositorio |

Comandos de las etapas 3 y 4 seguidos:

```powershell
Set-Location "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP\app"
npm run typecheck
npm run lint
npm run format:check
npx jest
```

Etapa 6, con el árbol de Git limpio (cambios confirmados). Los parámetros se explican en la
sección D.1 de `guia-pruebas-emulador-android.md`:

```powershell
Set-Location "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP"
$Ev = "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\<nombre-de-la-sesion>"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-StaticChecks.ps1 `
  -ExpectedBranch (git branch --show-current) -ExpectedTests <número real> -EvidenceRoot "$Ev\build"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\stage-04\Invoke-AndroidBuild.ps1 -EvidenceRoot "$Ev\build"
```

---

## H. Número de pruebas y el parámetro `-ExpectedTests`

El número de pruebas cambia cada vez que se agregan o se quitan pruebas, así que **no se fija en
la documentación**. Como referencia, el 2026-11-07 la suite tenía 39 archivos y 712 pruebas.

`Invoke-StaticChecks.ps1 -ExpectedTests N` compara la línea `Tests:` de Jest con
`N passed, N total`. Sirve para detectar que una prueba desapareció o dejó de ejecutarse sin que
nadie lo notara. Si no coincide, solo falla la comprobación `JEST-COUNT`. Su valor predeterminado
(265) es histórico; indique siempre el número actual.

Para consultar el número real sin el script:

```powershell
Set-Location "C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP\app"
npx jest --ci --json --outputFile "$env:TEMP\gfp-jest.json"
Get-Content "$env:TEMP\gfp-jest.json" -Raw | ConvertFrom-Json |
  Select-Object numTotalTestSuites, numTotalTests, numPassedTests, numFailedTests, numPendingTests
```

Use `numTotalTests` como `-ExpectedTests` solo si `numFailedTests` es 0 y la diferencia con la
última cifra conocida se explica por pruebas que se agregaron o quitaron a propósito. No cambie el
valor solo para que el script pase.
