// Textos visibles de HU7, tomados de daniela888-li/GFP (6ec6d3c). Título, botones y mensajes
// son literales de HU7; el subtítulo es el literal de los elementos visuales de HU7
// (E-CONS-D3); los estados de revisión proceden del prototipo.
export const RECEIPT_TEXTS = {
  title: 'Movimiento con foto',
  subtitle: 'Toma una fotografía o elige una foto de tu galería.',
  preview: 'Vista previa',
  takePhoto: 'Tomar fotografía',
  pickGallery: 'Seleccionar de la galería',
  cancel: 'Cancelar',
  retry: 'Reintentar',
  continue: 'Continuar',
  processing: 'Procesando imagen con OCR…',
  invalidImage:
    'Formato o tamaño de imagen no soportado. Usa una imagen JPG o PNG de máximo 5 MB.',
  invalidImageTitle: 'Formato o tamaño de imagen no soportado',
  allowedImages: 'Usa una imagen JPG o PNG de máximo 5 MB.',
  noData:
    'No se pudo leer la información de la imagen. Por favor, intente con otra imagen o continúe para ingresar los datos manualmente',
  noDataTitle: 'No se pudo procesar',
  captureFailed:
    'No fue posible abrir la cámara o la galería. Intenta de nuevo',
  review: {
    title: 'Revisar movimiento',
    complete: 'Todos los datos leídos correctamente',
    partial: 'Se han recuperado algunos datos',
    none: 'La factura debe verse clara y legible',
  },
  badges: {
    complete: 'COMPLETADO',
    partial: 'INCOMPLETO',
    none: 'IMAGEN BORROSA',
  },
  extracted: 'Datos extraídos',
  amount: 'Monto',
  date: 'Fecha',
  merchant: 'Comercio / Descripción',
  notIdentified: 'No identificado',
  identified: 'Identificado',
} as const;
