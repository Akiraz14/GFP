# Incidencias y mejoras pendientes (Bugs 38–41, Tasks 27–37)

**Fecha:** 2026-11-05  
**Rama:** `main`, desde `dec86ff` (merge de la consolidación global)  
**Actualización 2026-11-06:** la máscara de E-INC-D2 fue sustituida por E-COR-D3 y varias
presentaciones se corrigieron tras las pruebas en Android 10 (`correcciones-android10.md`).

**Estado:** implementado y verificado en Jest; **sin `push`**. La compilación Android y la
validación en dispositivo están pendientes (sección 6).

La Task 47 es la tarea de QA de las validaciones integradas HU1–HU10. No es una incidencia y
este trabajo no la ejecuta ni la cierra. Ningún elemento de Azure DevOps debe marcarse como
completado sin la validación en dispositivo de la sección 6.

## 1. Resumen

| ID | Trabajo | Estado | Commit |
|---|---|---|---|
| Task 36 | Cierre de modales con un toque fuera | Implementada; Jest | `b272602` |
| Bug 40 + Task 37 | Máscara decimal continua del monto | Corregida; Jest | `8ba1f21`, `f28903e` (ayuda del campo) |
| Bug 39 | Foco de las respuestas de seguridad (recuperación y registro) | Corregida; Jest | `ebac982`, `cb39ea3` |
| Bug 38 + Task 27 | Secuencia y distribución del registro | Corregida; Jest | `cb39ea3` |
| Bug 41 | Formato y tamaño de imágenes | **No es un error**; sin cambios de código | — |
| Task 28 | HU2 Inicio de sesión | Implementada; Jest | `e56c78f` |
| Task 29 | HU3 Recuperación | Implementada; Jest | `48b5f6d` |
| Task 30 | HU5 Historial | Implementada; Jest | `2b63c7c` |
| Task 31 | HU4 Formulario de movimientos | Implementada; Jest | `f28903e` (y Bug 40) |
| Task 32 | HU7 Captura de facturas | Implementada; Jest | `e552110` |
| Task 33 | HU8 Categorías | Implementada; Jest (con Task 36) | `608472c`, `b272602` |
| Task 34 | HU9 Análisis | Implementada; Jest | `24dd3ad` |
| Task 35 | HU10 Recomendaciones | Implementada; Jest | `24dd3ad` |

«Jest» significa verificado con pruebas automatizadas; ninguna se ejecutó en un dispositivo.

## 2. Incidencias

### Bug 38 — Secuencia y distribución del registro (con Task 27)

**Causa.** El asistente repartía los datos en «Identificación y datos personales», «Contacto y
acceso» y «Preguntas de seguridad», y registraba desde el paso 3 sin una revisión previa. El
prototipo de HU1 (página 8 de RQ02v2) usa otra secuencia: (1) identificación oficial,
información personal y credenciales de acceso, (2) preguntas de seguridad y (3) confirmación de
datos con «Registrar», «Editar datos» y «Cancelar». E03-D1/A-W6 indicaba que, si el prototipo
distribuía los campos de otra forma, se decidiría de nuevo (E-INC-D1).

**Cambio** (`RegistrationWizard.tsx`, `registrationTexts.ts`):

- Paso 1 «Datos personales y de acceso»: secciones «Identificación oficial», «Información
  personal» y «Credenciales de acceso» (código de país, celular, correo y contraseña). La tecla
  «siguiente» recorre los ocho campos. Al pulsar «Siguiente» se validan todos y se comprueba la
  disponibilidad (HU1-CA14), como antes al final del antiguo paso 2.
- Paso 2 «Preguntas de seguridad»: las cinco preguntas se validan al pulsar «Siguiente»
  (`validateSecurityAnswerSlots`, la misma regla de antes) y no se avanza con errores.
- Paso 3 «Confirmación de datos»: resumen de solo lectura. La contraseña aparece enmascarada y
  las respuestas no se muestran. Botones «Atrás», «Registrar», «Editar datos» (vuelve al paso 1),
  «Limpiar» y «Cancelar».
- Barra de progreso de tres segmentos coherente con «Paso n de 3». Cada paso se abre al inicio
  y el teclado se cierra al cambiar de paso.
- Un rechazo del servicio vuelve al primer paso con errores. Un fallo técnico conserva los datos
  no sensibles, borra la contraseña y las respuestas (A-W7) y vuelve al paso 1.

**Reglas conservadas.** Las validaciones de `registrationValidation.ts` y
`securityQuestionPolicy.ts` no cambian, ni los mensajes literales de HU1 ni el servicio.

**Scripts de dispositivo.** `Invoke-Hu2DeviceTests.ps1` e `Invoke-Hu1DeviceRegression.ps1`
siguen el nuevo orden (solo ASCII). `Invoke-Pbkdf2UpgradeCheck.ps1` **no se cambia**: registra la
cuenta con el APK anterior (`-OldApk`), que conserva el orden antiguo.

**Evidencia.** `RegistrationWizard.test.tsx`: 27 pruebas, entre ellas «Bug 38: registration
sequence of the HU1 prototype» (3) y las de HU1 adaptadas al nuevo orden.

### Bug 39 — Foco de la respuesta de seguridad

**Causa.**

- **Recuperación (HU3).** El identificador se envía con `blurAndSubmit` y queda de solo
  lectura cuando aparecen las preguntas. Ningún campo recibía el foco, el teclado se cerraba y
  las respuestas no tenían secuencia de teclado.
- **Registro (HU1).** Al elegir una pregunta, el foco no pasaba a su respuesta. Además, la
  tecla «siguiente» de una respuesta saltaba a la respuesta siguiente aunque su pregunta aún no
  estuviera elegida.

**Cambio.**

- **Recuperación** (`PasswordRecoveryScreen.tsx`): la primera respuesta toma el foco al
  aparecer las preguntas. «Siguiente» recorre respuesta 1 → respuesta 2 → nueva contraseña →
  confirmación, y esta última cierra el teclado (`done`). Las respuestas siguen visibles y
  editables (no son campos de contraseña).
- **Registro** (`RegistrationWizard.tsx`): al elegir la pregunta i, su respuesta toma el foco
  cuando la lista se cierra (250 ms, el tiempo de la animación del modal). «Siguiente» en una
  respuesta solo salta a la siguiente si esa casilla ya tiene pregunta; si no, cierra el teclado.
  Al cambiar de paso se cancela cualquier foco pendiente.

**Evidencia.**

- `PasswordRecoveryScreen.test.tsx`: «Bug 39: focus of the recovery answers» (3 pruebas).
- `RegistrationWizard.test.tsx`: «Bug 39: focus of the security answers» (2 pruebas).
- Las pruebas registran en qué campo se llama a `focus()`. La aparición real del teclado debe
  comprobarse en un dispositivo (sección 6).

### Bug 40 — Formato monetario y separador decimal (con Task 37)

**Causa.** El campo «Monto» era texto libre que `amountInputFromCents` y `parseAmountInput`
interpretaban (E07-D5). Para escribir decimales había que teclear la coma y, al editar, mover el
cursor. La agrupación de miles no se aplicaba mientras se escribía.

**Cambio (una sola solución para Bug 40 y Task 37).**

- `maskAmountInput()` (`money.ts`) quita todo lo que no sea dígito y los ceros a la izquierda,
  y limita la longitud al máximo de E07-D5. Los dos últimos dígitos son los centavos: «1» →
  «0,01», «1250» → «12,50», «4550075» → «45.500,75». Los miles se separan con «.» y los
  decimales con «,» (D-01).
- `amountInputFromCents()` usa la misma máscara para la edición (HU4-CA10) y para la precarga
  de HU7.
- El formulario aplica la máscara en cada cambio, usa el teclado numérico y deja el cursor al
  final (`selection`): no hace falta moverlo. Borrar quita el último dígito.
- El valor guardado sigue en centavos enteros. Se valida con `parseAmountInput` (E07-D5, sin
  cambios), y el historial, el balance y el análisis lo muestran con `formatMoney` («$4.550,07»).
- Task 31 añade bajo el campo la ayuda «Escribe solo números: los dos últimos son los centavos.».

**Cambio visible para el usuario (E-INC-D2, reemplazada por E-COR-D3 el 2026-11-06; se conserva como historial).** Teclear «45500» ahora da «455,00» (antes,
«45.500,00»). Para 45.500 pesos se escribe «4550000». Con el teclado numérico no se pueden
escribir «-» ni letras, así que los casos «-5» y «abc» de HU4-CA05 ya no pueden ocurrir en el
formulario. «0» sigue mostrando «Ingrese un monto válido», y el servicio sigue rechazando valores
no válidos.

**Evidencia.**

- `money.test.ts`: «Bug 40 and Task 37: continuous decimal mask».
- `MovementFormScreen.test.tsx`: escritura continua, borrado, cursor al final y valor guardado
  455 007 centavos mostrado como «$4.550,07».
- `App.test.tsx` y `ReceiptCaptureScreen.test.tsx`, adaptados.

### Bug 41 — Validación de formato y tamaño de imágenes: **No es un error**

Se verificó el comportamiento actual, sin cambiar el código:

- La galería se abre con `launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 })`
  (`nativeReceiptGateway.ts`), por lo que solo ofrece imágenes.
- Toda imagen elegida, de la cámara o de la galería, pasa por `isSupportedReceiptImage()`
  (`receiptImage.ts`): solo JPG o PNG (por extensión o tipo MIME) y de 5 MB como máximo. Una
  imagen sin tamaño conocido se rechaza.
- Una imagen rechazada muestra el literal de HU7-CA02 («Formato o tamaño de imagen no soportado.
  Usa una imagen JPG o PNG de máximo 5 MB.»), no se procesa y su copia temporal se borra.

**Precisión.** El selector filtra por tipo «foto», no por JPG o PNG. Una imagen GIF o WebP
puede elegirse en el selector, pero se rechaza con el mensaje de HU7-CA02 antes de procesarla.
El resultado cumple HU7-CA02, por eso la incidencia no se reproduce como defecto.

**Evidencia** (Jest, sin cambios):

- `receiptExtraction.test.ts`: `isSupportedReceiptImage` con JPG, PNG en mayúsculas sin MIME,
  GIF, 5 MB + 1 byte y tamaño desconocido.
- `ReceiptCaptureScreen.test.tsx`: «HU7-CA02: rejects an unsupported image» y «an unsupported
  image is discarded right away».

**Pendiente:** comprobarlo en un dispositivo con una imagen GIF o WebP y otra de más de 5 MB.

## 3. Mejoras de presentación (Tasks 27–35)

Cada pantalla se comparó con su prototipo de RQ02v2 y con el código actual. Solo se cambió lo
que difería del prototipo o afectaba la legibilidad o la accesibilidad. Los textos literales de
las HU, las reglas y los servicios no cambian.

| Task | HU | Revisión | Cambio |
|---|---|---|---|
| 27 | HU1 | Distribución, jerarquía, progreso y revisión | Bug 38: secciones, barra de progreso, confirmación y botón «Editar datos» |
| 28 | HU2 | El prototipo agrupa las credenciales y pone el enlace de recuperación bajo la contraseña | Encabezado «Credenciales de acceso»; «Olvidé mi contraseña» bajo la contraseña, alineado a la derecha, antes de «Ingresar» y «Registrar» |
| 29 | HU3 | El prototipo muestra «Paso 1 de 2» y «Paso 2 de 2», y secciones de preguntas y credenciales | Indicador de paso, sección «Preguntas de seguridad» con el rótulo «PREGUNTA DE SEGURIDAD n» sobre cada pregunta, y sección «Credenciales de acceso» para la nueva contraseña |
| 30 | HU5 | La descripción es el título de la tarjeta; una descripción de 250 caracteres estiraba la tarjeta | Título en seminegrita, cortado a 2 líneas; el monto con signo en una línea y se reduce si es muy largo |
| 31 | HU4 | El formulario coincide con el prototipo; el formato monetario es el de Bug 40 | Ayuda del monto que explica los centavos |
| 32 | HU7 | El prototipo marca cada dato extraído como encontrado o no | Marca ✓ o ! con etiqueta de accesibilidad; el marco de la vista previa toma el color del estado. La estrategia OCR no cambia |
| 33 | HU8 | Hoja inferior del prototipo; «Mis categorías» vacía no tenía texto | Asa decorativa de la hoja; estado vacío de «Mis categorías» (propuesta de texto). El cierre con un toque fuera es la Task 36 |
| 34 | HU9 | KPI, dona, líneas y estado vacío coinciden con el prototipo. La leyenda «■ Ingresos» hacía que TalkBack leyera el símbolo | Leyenda con muestras de color; TalkBack lee solo «Ingresos» y «Gastos» |
| 35 | HU10 | Las tarjetas, el estado vacío y el descargo coinciden. El emoji de severidad se leía en voz alta y «Descartar» no decía qué tarjeta descartaba | Emoji de severidad decorativo; etiqueta «Descartar recomendación: <título>» |

**Revisado sin cambios** (ya coincidía con el prototipo): KPI de HU6 y HU9 en una línea
(`adjustsFontSizeToFit`), filtros y estados vacíos de HU5, estados de procesamiento y error de
HU7, y la estructura del formulario de HU4.

**Propuestas no implementadas** (amplían el alcance o no tienen requisito; requieren decisión):

- Botón para mostrar u ocultar la contraseña (ojo) en HU1, HU2 y HU3.
- Leyenda «Datos encriptados con SQLCipher» del prototipo de HU2 y HU3.
- Íconos de sección del prototipo de HU9.

**Evidencia.**

- `LoginScreen.test.tsx` (Task 28: orden de los controles con `testing/renderOrder.ts`).
- `PasswordRecoveryScreen.test.tsx` (Task 29).
- `MovementHistoryScreen.test.tsx` (Task 30).
- `MovementFormScreen.test.tsx` (Task 31).
- `ReceiptCaptureScreen.test.tsx` (Task 32).
- `CategoriesScreen.test.tsx` (Task 33).
- `AnalysisAndRecommendations.test.tsx` (Tasks 34 y 35).

## 4. Task 36 — Cierre de modales con un toque fuera

**Cambio.** El componente nuevo `DismissibleOverlay` pone una capa táctil detrás del
contenido. Un toque en la capa cierra el modal; un toque en el contenido, no. La capa no es
accesible (`accessible={false}`, `importantForAccessibility="no"`): TalkBack recorre solo el
contenido, y el botón Atrás de Android sigue cerrando el modal (`onRequestClose`). Se usa en:

- `MessageDialog`: todos los diálogos, por ejemplo la confirmación de eliminar un movimiento o
  una categoría. Un toque fuera equivale a «Cancelar» o «Aceptar» según el diálogo.
- `SelectField`: listas desplegables. Corrige además que tocar el título de la lista la cerraba.
- `CategoryFormSheet`: formulario de categorías de HU8 y Task 33. No se cierra mientras guarda.

**Evidencia.** `modalDismiss.test.tsx` (3 pruebas) y `CategoriesScreen.test.tsx` (2 pruebas de
Task 36).

## 5. Decisiones registradas

Estado actualizado el 2026-11-06 por el responsable, tras la validación manual en Android 10
(`GFP-evidencias\correcciones`). El historial de estados se conserva en la columna
«Historial».

| ID | Descripción | Origen | Estado | Fecha de aprobación | Implementación y evidencia | Historial |
|---|---|---|---|---|---|---|
| E-INC-D1 | La secuencia del registro sigue el prototipo de HU1: datos personales y de acceso, preguntas de seguridad y confirmación. Revisa la distribución de E03-D1 y A-W6, que dejaban esa revisión abierta si el prototipo era distinto | Encargo del responsable (Bug 38) y prototipo de HU1 | **Aprobada** | 2026-11-06 | Commits `cb39ea3` y `06eda43`; validación manual en Android 10 (`correcciones\A-registro\GC-A1-*`, `GC-A3-*`, `GC-A4-*`) | 2026-11-05: implementada, pendiente de aprobación |
| E-INC-D2 | El monto se escribe con una máscara continua: los dos últimos dígitos son los centavos. Las reglas de E07-D5 y el almacenamiento no cambian | Encargo del responsable (Bug 40 y Task 37) | **Reemplazada** por E-COR-D3 (no vigente) | — | Commit `8ba1f21`; sustituida por `06eda43` (`correcciones-android10.md`, D3) | 2026-11-05: implementada, pendiente de aprobación; 2026-11-06: reemplazada |
| E-INC-D3 | Textos nuevos propuestos, no literales de las HU. Se resuelven texto por texto en la tabla siguiente | Propuesta de Claude | **Aprobada**: 7 textos aprobados y 4 reemplazados; ninguno pendiente | 2026-11-06 | Tabla E-INC-D3 | 2026-11-05: propuesta, pendiente de aprobación; 2026-11-06: resuelta en parte (5 aprobados, 2 pendientes); 2026-11-06: los 2 pendientes, aprobados expresamente por el responsable |

**E-INC-D3, texto por texto.** Los cinco primeros se aprobaron con las capturas de la
validación en Android 10; el estado vacío de «Mis categorías» y «Identificado», por
aprobación expresa del responsable el 2026-11-06. Los reemplazados ya no están en la aplicación porque
las correcciones posteriores usaron el texto del mockup o los retiraron.

| Texto | Pantalla | Estado | Evidencia o motivo |
|---|---|---|---|
| «Datos personales y de acceso» (título del paso 1) | Registro | **Aprobado**, 2026-11-06 | `correcciones\A-registro\GC-A1-paso1-encabezado.png` |
| «Preguntas de seguridad» (título del paso 2) | Registro | **Aprobado**, 2026-11-06 | Escenario GC-A3 validado (`GC-A3-paso2-pregunta-2.png`) |
| «Confirmación de datos» (título del paso 3) | Registro | **Aprobado**, 2026-11-06 | `GC-A4-paso3-confirmacion-1.png` |
| «Editar datos» | Registro, paso 3 | **Aprobado**, 2026-11-06 | `GC-A4-paso3-confirmacion-2.png` |
| «Paso 1 de 2» y «Paso 2 de 2» | Recuperación | **Aprobado**, 2026-11-06 | `correcciones\C-recuperacion\GC-C1-paso1-vacio.png` y `GC-C1-paso2-vacio-1.png` |
| «Identificación oficial», «Información personal», «Credenciales de acceso» (secciones del registro) | Registro | **Reemplazado** por los textos del mockup («Identificación Oficial», «Información Personal», «Credenciales de Acceso»; E-COR-D2) | Commit `06eda43` |
| «Preguntas de seguridad», «Credenciales de acceso» (secciones de HU3) | Recuperación | **Reemplazado** por los textos del mockup («Preguntas de Seguridad», «Credenciales de Acceso») | Commit `06eda43` |
| Nota de la confirmación («Revisa tus datos antes de registrarte…») | Registro, paso 3 | **Reemplazado** por el texto del mockup («Revisa tus datos antes de confirmar») | Commit `06eda43` |
| Ayuda del monto («Escribe solo números: los dos últimos son los centavos.») | Movimiento | **Retirado** junto con E-INC-D2 | Commit `06eda43` |
| «Aún no tienes categorías propias. Usa «+ Nueva categoría» para crear una.» | Categorías | **Aprobado**, 2026-11-06 | Aprobación expresa del responsable (sin captura de HU8 en `correcciones\F-categorias`). Commit `608472c` |
| «Identificado» (etiqueta de accesibilidad de la marca ✓ de HU7) | Captura de factura | **Aprobado**, 2026-11-06 | Aprobación expresa del responsable (solo la lee TalkBack). Commit `e552110` |

## 6. Pendientes

- Compilar el APK Debug en Windows (`Invoke-AndroidBuild.ps1`) y ejecutar
  `Test-ScriptSyntax.ps1`. PowerShell no está disponible en el entorno de Claude.
- Validar en Android 10 y 14 los puntos de la sección G-INC de
  `validacion/guia-pruebas-manuales-finales.md`, en especial:
  - el teclado al elegir una pregunta (el retardo de 250 ms);
  - el foco al aparecer las preguntas de HU3;
  - la máscara del monto con el teclado real;
  - el cierre con un toque fuera;
  - el ajuste de montos largos.
- Repetir `Invoke-Hu2DeviceTests.ps1` e `Invoke-Hu1DeviceRegression.ps1` con el nuevo orden del
  registro.
- E-INC-D1 aprobada, E-INC-D2 reemplazada y E-INC-D3 aprobada por completo (2026-11-06,
  sección 5). No queda ninguna decisión E-INC pendiente.
- Task 47 (QA integrada HU1–HU10): sin cambios; sigue pendiente.
