# Estructura de `src/`

Separación de responsabilidades según el diagrama C4 — Nivel 3 (Componentes) de la
Propuesta comercial N.° 001. Cada carpeta corresponde a un grupo del diagrama.
Los nombres de las carpetas están en inglés según `docs/nomenclatura.md`; hasta la
Etapa 02 se llamaban `presentacion/`, `negocio/`, `servicios/`, `procesamiento/`,
`analisis/` e `infraestructura/`. Su contenido se incorpora en las etapas que
implementen cada componente.

| Carpeta           | Grupo C4          | Componentes del diagrama                                                                     |
| ----------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `presentation/`   | Presentación      | Pantallas, Componentes UI, Navegación                                                        |
| `business/`       | Lógica de Negocio | Gestión de Ingresos, Gestión de Gastos, Gestión de Categorías, Gestión de Recomendaciones    |
| `services/`       | Servicios         | Autenticación, Gestión de Sesión, Validaciones, Sincronización Local                         |
| `processing/`     | Procesamiento     | Captura de Imagen, Preprocesamiento, OCR, Extracción de Datos                                |
| `analysis/`       | Análisis          | Cálculo de Métricas, Generación de Reportes, Comparación de Periodos, Visualización de Datos |
| `infrastructure/` | Infraestructura   | Acceso a Datos, Cifrado de Datos, Gestión de Errores, Logs y Auditoría                       |
