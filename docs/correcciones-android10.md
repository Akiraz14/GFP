# Correcciones visuales y funcionales detectadas en Android 10

**Fecha:** 2026-11-06  
**Rama:** `main`, desde `5d394b0` (incidencias y mejoras)  
**Fuentes:**

- Mockups del proyecto: `hu1-formulario-registro-movil*.png`, `hu2-formulario-iniciar-sesion.png`, `hu3-formulario-recuperar-contraseña*.png`, `hu4-registro-movimiento.png`, `hu7-captura-gasto-foto.png`, `hu8-Categorías — *.png`, `hu9-Análisis financiero · *.png` y `hu10-Recomendaciones financieras · *.png`.
- Capturas de las pruebas manuales en `GFP-evidencias\incidencias` (`GI-HU*.png`).
- Las historias RQ02v2 y las decisiones anteriores.

**Estado:** implementado y verificado con Jest. **La validación visual en Android 10 y la compilación Debug no se ejecutaron**: no hay emulador ni Android SDK en el entorno de Claude. Ninguna incidencia está cerrada hasta esa validación (sección 5).

## 1. Decisiones

| ID | Decisión | Origen |
|---|---|---|
| E-COR-D1 | A13: bajo cada campo del registro se muestra solo el mensaje concreto, sin el prefijo «Error en los campos ingresados». «Verificar correo» se conserva para el correo mal formado (HU1). Cambia la presentación literal del criterio de HU1 | Responsable, 2026-11-06 |
| E-COR-D2 | Textos del mockup que sustituyen literales de las historias: «Registro de Usuario», «Iniciar Sesión», «¿Olvidaste tu contraseña?», «Crear Cuenta», «Recuperar Contraseña», «Comenzar Recuperación» y los rótulos en mayúsculas iniciales del registro | Encargo del responsable (B6, B8, C6, C7) y mockups |
| E-COR-D3 | Monto: los dígitos son pesos enteros («45500» → «$45.500») y los decimales solo empiezan con un separador explícito. Tanto «,» como «.» escritos por el usuario abren los decimales («45500,50» y «45500.50» → «45.500,50»). La pantalla siempre usa «.» para los miles y «,» para los decimales (D-01). Admite 12 enteros y 2 decimales. Reemplaza E-INC-D2. El almacenamiento en centavos y `parseAmountInput` (E07-D5) no cambian | Encargo del responsable (D3) |
| E-COR-D4 | Los íconos se dibujan con `react-native-svg` (D-04, ya instalada) en `components/Icon.tsx`. No se añade ninguna dependencia | Restricción de no incorporar dependencias |
| E-COR-D5 | Ayuda (?) del registro y de la recuperación: diálogo con instrucciones breves. El mockup muestra el botón, pero no su contenido, así que los textos son propuesta | Propuesta, pendiente de aprobación |
| E-COR-D6 | Placeholders sin texto en el mockup (propuesta): «Ingresa tu primer nombre», «Ingresa tu primer apellido», «Ej. 3001234567», «Escribe tu respuesta», «Repite la nueva contraseña». El mockup escribe «SQLCypher»; se usa el nombre real, «SQLCipher» | Propuesta |
| E-COR-D7 | Recuperación: en el paso 2 el identificador ya no se muestra, como en el mockup. El botón de regresar del encabezado vuelve al paso 1, y el botón Atrás de Android sigue llevando al inicio de sesión | Mockup de HU3 |
| E-COR-D8 | La confirmación del registro muestra las respuestas de seguridad (A12). La contraseña sigue enmascarada | Encargo del responsable |

## 2. Matriz de trazabilidad

«Jest» significa verificado con pruebas automatizadas. Ninguna fila se ha visto en Android 10.

| ID | Problema | Corrección | Archivos | Evidencia | Estado |
|---|---|---|---|---|---|
| A1 | Sin regresar ni ayuda | `ScreenHeader` con ← (paso anterior; en el paso 1, inicio de sesión) y ? (diálogo de ayuda) | `RegistrationWizard.tsx`, `ScreenHeader.tsx` | Jest «A1, A2, A4, A5, A10», «A1: back goes…» | Corregida, pendiente de Android 10 |
| A2 | Título «Registrar usuario» | «Registro de Usuario», centrado | `registrationTexts.ts` | Jest | Ídem |
| A3 | Conservar la barra azul | Se conserva (`StepProgress`) | `StepProgress.tsx` | Jest «Bug 38» | Conservada |
| A4 | Subtítulo del paso sin centrar | «Paso n de 3» y el título del paso, centrados | `RegistrationWizard.tsx` | Jest | Corregida, pendiente de Android 10 |
| A5 | Falta «Únete a GFP» | Tarjeta con el texto completo del mockup y (*) en rojo; en el paso 3, «Revisa tus datos antes de confirmar», también del mockup | `registrationTexts.ts` | Jest | Ídem |
| A6 | Sin segmentación | `SectionCard` con ícono para Identificación Oficial, Información Personal y Credenciales de Acceso | `SectionCard.tsx` | Jest «A6, A8, A9» | Ídem |
| A7 | Preguntas sin textos ni agrupación | Recuadro por pareja: «PREGUNTA DE SEGURIDAD n», «Obligatorio *», «Selecciona una pregunta» (texto en una línea con «…»), «Tu respuesta» e intro de la sección | `RegistrationWizard.tsx` | Jest «A7» | Ídem |
| A8 | Sin placeholders | Placeholders del mockup (y E-COR-D6), asteriscos rojos, «(opcional)» a la derecha y ayuda del correo | `TextField.tsx`, `registrationTexts.ts` | Jest «A6, A8, A9» | Ídem |
| A9 | «Cancelar» azul | Variante `danger`: fondo rojo claro y texto rojo, con la misma forma | `ActionButton.tsx` | Jest | Ídem |
| A10 | Falta la nota verde | `SecurityNote` (escudo y «Datos encriptados con SQLCipher») | `SecurityNote.tsx` | Jest | Ídem |
| A11 | Confirmación sin recuadros | Cada segmento en un `SectionCard` | `RegistrationWizard.tsx` | Jest «step 3 shows a boxed…» | Ídem |
| A12 | Faltan las respuestas | Pregunta y «Tu respuesta» por cada una (E-COR-D8) | `RegistrationWizard.tsx` | Jest | Ídem |
| A13 | Prefijo genérico recargado | Solo el mensaje concreto (E-COR-D1) | `registrationMessages.ts` | Jest «A13» y pruebas de HU1 adaptadas | Ídem |
| — | (Mockup) ojo en la contraseña | Mostrar y ocultar | `TextField.tsx` | Jest | Ídem |
| B1 | Título sin centrar ni subtítulo | Centrado, con «Ingresa a tu cuenta financiera personal» | `LoginScreen.tsx` | Jest «E-COR: login» | Ídem |
| B2 | Sin regresar ni ayuda | Se mantiene sin ellos | — | Jest (ausencia) | Conservado |
| B3 | Sin sección ni candado | Tarjeta «Credenciales de Acceso» con candado | `LoginScreen.tsx` | Jest | Corregida, pendiente de Android 10 |
| B4 | Sin asteriscos | (*) rojo en Identificador y Contraseña | `TextField.tsx` | Jest | Ídem |
| B5 | Sin ojo | Mostrar u ocultar la contraseña | `TextField.tsx` | Jest | Ídem |
| B6 | Texto del enlace | «¿Olvidaste tu contraseña?» | `loginTexts.ts` | Jest | Ídem |
| B7 | Ícono en «Ingresar» | Ícono de usuario | `LoginScreen.tsx` | Jest | Ídem |
| B8 | «Registrar» | «Crear Cuenta» con el ícono de tarjeta del mockup | `loginTexts.ts` | Jest | Ídem |
| B9 | Falta la nota verde | `SecurityNote` | `LoginScreen.tsx` | Jest | Ídem |
| — | (Mockup) placeholder del identificador | «Correo, Documento o Celular» en lugar de la ayuda bajo el campo | `loginTexts.ts` | Jest | Ídem |
| C1 | Sin regresar ni ayuda | `ScreenHeader` (E-COR-D7, E-COR-D5) | `PasswordRecoveryScreen.tsx` | Jest «E-COR: recovery» | Ídem |
| C2 | Título y paso sin centrar | Centrados | ídem | Jest | Ídem |
| C3 | Sin barra de pasos | `StepProgress` de 2 segmentos | ídem | Jest | Ídem |
| C4 | Falta el texto de ayuda | «Ingresa tu identificador para buscar tu cuenta.» | `recoveryTexts.ts` | Jest | Ídem |
| C5 | Sin asterisco | (*) rojo | `TextField.tsx` | Jest | Ídem |
| C6, C7 | Capitalización | «Comenzar Recuperación» | `recoveryTexts.ts` | Jest | Ídem |
| C8 | Falta la nota verde | `SecurityNote` | `PasswordRecoveryScreen.tsx` | Jest | Ídem |
| — | (Mockup) paso 2 | Recuadros de preguntas («Obligatorio *») y de credenciales, ojos, placeholders y ayuda de la confirmación | ídem | Jest | Ídem |
| D1 | Flecha dinámica | Eliminada (`TypeIndicator`) | `MovementFormScreen.tsx` | Jest «D1, D2, D7» | Ídem |
| D2 | Tipos sin ícono | Punto de color antes de «Gasto» (rojo) e «Ingreso» (verde), como en el mockup | ídem | Jest | Ídem |
| D3 | Entrada de importes | Máscara E-COR-D3 con teclado `decimal-pad`. El cursor queda tras el dígito editado (`applyAmountEdit`) y la coma final se ignora al guardar | `money.ts`, `MovementFormScreen.tsx` | Jest «E-COR-D3» (6) y «D3» (2) | Corregida, **requiere Android 10** (teclado y cursor reales) |
| D4 | Color del monto | Verde para ingreso y rojo para gasto (texto y $) | `MovementFormScreen.tsx` | Jest «D4, D5, D6» | Corregida, pendiente de Android 10 |
| D5 | Sin símbolo $ | Prefijo «$» | `TextField.tsx` | Jest | Ídem |
| D6 | Error arriba | Recuadro con ícono justo encima de «Guardar movimiento» | `MovementFormScreen.tsx` | Jest (orden) | Ídem |
| D7 | «Cancelar» azul | Variante `danger` | ídem | Jest | Ídem |
| E1 | Sin aviso de formatos | Recuadro amarillo «Usa una imagen JPG o PNG de máximo 5 MB.». Si se rechaza una imagen, el título de HU7-CA02 con ícono de alerta | `ReceiptCaptureScreen.tsx`, `receiptTexts.ts` | Jest «E-COR: HU7» y «HU7-CA02» | Ídem |
| E2 | Sin íconos de cámara | Cámara en la vista previa y en «Tomar fotografía» | ídem | Jest | Ídem |
| F1 | Modal de categoría abajo | Centrado verticalmente (y sin el asa de hoja inferior de la Task 33) | `CategoryFormSheet.tsx` | Jest «F1, F2» | Ídem |
| F2 | Tipos sin ícono | Flecha de entrada verde (Ingreso) y de salida roja (Gasto), las mismas de los KPI del mockup de HU9 | ídem | Jest | Ídem |
| F3 | Sin alerta y título sin centrar | `CategoryDeleteDialog` con ícono de alerta y título centrado | `CategoryDeleteDialog.tsx` | Jest «F3-F6» | Ídem |
| F4 | Advertencia sin recuadro | Recuadro amarillo con ícono | ídem | Jest | Ídem |
| F5 | Recuento sin centrar | Centrado. La concordancia ya era correcta: «1 movimiento será reasignado.» y «N movimientos serán reasignados.» | ídem | Jest | Ídem |
| F6 | «Confirmar» azul | Variante `destructive` (rojo) | ídem | Jest | Ídem |
| G1 | Sin calendario | Ícono en «Período de análisis» | `AnalysisScreen.tsx` | Jest «G1-G4» | Ídem |
| G2 | Botones sin agrupar | Tarjeta con los periodos y el rango | ídem | Jest | Ídem |
| G3, G4 | Sin íconos | Resumen, gráfico circular (y evolución) | ídem | Jest | Ídem |
| G5 | Categoría seleccionada confusa | Nombre y porcentaje en su renglón, valor alineado a la derecha | ídem | Jest «G5» | Ídem |
| G6 | Líneas en lugar de ondas | `WaveChart`: curvas de Bézier suaves con los mismos datos | `charts.tsx` | Jest «G6, G7» | Corregida, **requiere Android 10** (aspecto) |
| G7 | Tendencia sin color ni ícono | Recuadro verde con flecha ascendente o rojo con flecha descendente | `AnalysisScreen.tsx` | Jest | Corregida, pendiente de Android 10 |
| H1 | Sin estrellas | Ícono `sparkles` | `RecommendationsScreen.tsx` | Jest «H1» | Ídem |

**Scripts de dispositivo actualizados** (solo ASCII), sin ejecutar: `Invoke-Hu2DeviceTests.ps1` («Crear Cuenta», «¿Olvidaste tu contraseña?», «Número de Documento (DNI/NIT)»), `Invoke-Hu1DeviceRegression.ps1` (mensajes sin prefijo y nuevo rótulo) y `lib\DeviceUi.ps1`. `Invoke-Pbkdf2UpgradeCheck.ps1` no cambia porque usa el APK anterior.

**Diferencias que quedan frente a los mockups** (no pedidas; requieren decisión):

- El inicio de sesión del mockup tiene regresar y ayuda; se descartan por B2.
- Los rótulos de la recuperación son «Nueva Contraseña» y «Confirmar Nueva Contraseña» (el mockup dice «Contraseña» y «Confirmar Contraseña»), y el botón «Actualizar contraseña» conserva el literal de HU3.
- El fondo de las pantallas sigue siendo blanco (el mockup usa gris claro).
- En el registro se mantiene la lista de requisitos de la contraseña en lugar de la línea de ayuda del mockup.
- En el formulario de movimientos se mantiene el rótulo «Monto» (el mockup dice «Monto numérico»).

## 3. Pruebas

| Verificación | Resultado (entorno de Claude, copia limpia) |
|---|---|
| `npm ci` | Código 0 |
| `npm run typecheck` | Código 0 |
| `npm run lint` | Código 0 |
| `npm run format:check` | Código 0 |
| Jest | 39 suites, **651 aprobadas, 0 fallidas** (antes 633) |
| Compilación Android Debug | **No ejecutada** (sin Android SDK) |
| Validación visual y funcional en Android 10 | **No ejecutada** (sin emulador) |

## 4. Evidencias

Las capturas nuevas van en `C:\Users\juanz\Akiraz\Study\GFP Proyecto\GFP-evidencias\correcciones\<módulo>\`, con los módulos `A-registro`, `B-inicio-sesion`, `C-recuperacion`, `D-movimiento`, `E-foto`, `F-categorias`, `G-analisis` y `H-recomendaciones`. Las capturas de `incidencias` no se tocan. La guía de PowerShell está en `validacion/guia-pruebas-manuales-finales.md`, sección G-COR.

## 5. Pendientes

- Compilar el APK Debug, instalarlo y recorrer G-COR en el AVD `Pixel_4_Android_10`.
- Comparar cada captura con su mockup y con la captura `GI-*` de origen.
- Comprobar en el dispositivo, sobre todo:
  - el cursor y el teclado `decimal-pad` del monto (según el teclado puede mostrar «,» o «.»; los dos abren los decimales);
  - el foco de las respuestas (Bug 39);
  - la altura del modal de categoría con el teclado abierto;
  - el aspecto de las ondas.
- Ejecutar `Test-ScriptSyntax.ps1` y los scripts de dispositivo actualizados.
- Aprobar E-COR-D1 a E-COR-D8.
- No marcar nada en Azure DevOps hasta esa validación.
