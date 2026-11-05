# Decisiones de la Etapa 11 (HU9 Consultar análisis financiero)

Fuentes:

- HU9 del documento de historias de usuario
  `RQ02v2 Historia de Usuario Gestion_Financiera_Personal_16092026_V1` (criterios literales en `trazabilidad.md`);
- su prototipo, páginas 47 a 50 de la copia PDF revisada.

**Estado:** propuesta. Ninguna decisión está aprobada por el responsable.

## Resumen

| Decisión | Resolución propuesta |
|---|---|
| E11-D1 | Dona y líneas, como el prototipo, con `react-native-svg` 15.16.0 (dependencia nativa nueva, exacta, pendiente de aprobación). Es compatible por declaración de la librería; falta la compilación en Windows. El dibujo sin curvas suavizadas difiere del prototipo |
| E11-D2 | «Cambiar tipo de gráfico»: botones «Por categoría» y «Evolución», un gráfico a la vez |
| E11-D3 | Hasta 62 días se agrupa por semana desde el inicio del rango; más, por mes |
| E11-D4 | Moneda local, `$1.250,00`, aunque HU9 muestre `$1,250.00`: prevalece HU6-CA02 |
| E11-D5 | El botón de compartir del prototipo no se implementa: ninguna historia lo define |
| E11-D6 | El estado vacío usa «+ Nuevo movimiento» en lugar de «Registrar movimiento» (E07-D2) |
