import type { MovementType } from '../../infrastructure/database/repositories/movementRepository';

// Textos visibles de HU4. Literales de HU4: «Registro de movimiento», «Añade una nueva
// transacción.», «Ingreso», «Gasto», «Guardar movimiento», «Limpiar», «Cancelar»,
// «Actualizar», «La fecha no puede ser futura», «Ingrese un monto válido», «El movimiento
// fue registrado exitosamente», «El movimiento fue actualizado exitosamente» y «Error en
// los campos ingresados». Los demás proceden del prototipo o son propuestas de E07.
export const MOVEMENT_TEXTS = {
  createTitle: 'Registro de movimiento',
  createSubtitle: 'Añade una nueva transacción.',
  editTitle: 'Editar movimiento',
  editSubtitle: 'Modifica los datos registrados.',
  types: {
    expense: 'Gasto',
    income: 'Ingreso',
  } satisfies Record<MovementType, string>,
  labels: {
    type: 'Tipo de movimiento',
    amount: 'Monto',
    date: 'Fecha',
    category: 'Categoría',
    description: 'Descripción (opcional)',
  },
  placeholders: {
    amount: 'Ej: 45.500',
    date: 'DD/MM/AAAA',
    category: 'Selecciona una categoría',
    description: 'Ej: Almuerzo con el equipo',
  },
  buttons: {
    save: 'Guardar movimiento',
    update: 'Actualizar',
    clear: 'Limpiar',
    cancel: 'Cancelar',
    accept: 'Aceptar',
    backToHistory: 'Volver al historial',
    newMovement: '+ Nuevo movimiento',
  },
  accessibility: {
    openCalendar: 'Abrir calendario',
    typeIndicator: (type: MovementType) =>
      type === 'income' ? 'Movimiento de ingreso' : 'Movimiento de gasto',
  },
  descriptionCounter: (length: number, max: number) => `${length}/${max}`,
  errors: {
    form: 'Error en los campos ingresados',
    typeRequired: 'Selecciona el tipo de movimiento',
    amountInvalid: 'Ingrese un monto válido',
    dateRequired: 'Ingresa la fecha',
    dateInvalid: 'Ingresa una fecha válida con el formato DD/MM/AAAA',
    dateFuture: 'La fecha no puede ser futura',
    categoryRequired: 'Selecciona una categoría',
    categoryIncompatible:
      'La categoría no corresponde al tipo de movimiento seleccionado',
    descriptionTooLong: 'La descripción admite máximo 250 caracteres',
  },
  success: {
    title: '¡Operación exitosa!',
    created: 'El movimiento fue registrado exitosamente',
    updated: 'El movimiento fue actualizado exitosamente',
  },
  prefill: {
    partial:
      'No fue posible identificar toda la información. Complete los datos manualmente',
  },
  messages: {
    loadFailed: 'No fue posible cargar los datos. Intenta de nuevo',
    saveFailed: 'No fue posible guardar el movimiento. Intenta de nuevo',
    notFound: 'El movimiento ya no existe.',
  },
} as const;
