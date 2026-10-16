# Estructura de `src/`

Separación de responsabilidades según el diagrama C4 — Nivel 3 (Componentes) de la
Propuesta comercial N.° 001. Cada carpeta corresponde a un grupo del diagrama.
En la Etapa 01 las carpetas están vacías: su contenido se incorpora en las etapas
que implementen cada componente.

| Carpeta            | Grupo C4          | Componentes del diagrama                                                                     |
| ------------------ | ----------------- | -------------------------------------------------------------------------------------------- |
| `presentacion/`    | Presentación      | Pantallas, Componentes UI, Navegación                                                        |
| `negocio/`         | Lógica de Negocio | Gestión de Ingresos, Gestión de Gastos, Gestión de Categorías, Gestión de Recomendaciones    |
| `servicios/`       | Servicios         | Autenticación, Gestión de Sesión, Validaciones, Sincronización Local                         |
| `procesamiento/`   | Procesamiento     | Captura de Imagen, Preprocesamiento, OCR, Extracción de Datos                                |
| `analisis/`        | Análisis          | Cálculo de Métricas, Generación de Reportes, Comparación de Periodos, Visualización de Datos |
| `infraestructura/` | Infraestructura   | Acceso a Datos, Cifrado de Datos, Gestión de Errores, Logs y Auditoría                       |
