import type { CategoryType } from '../../infrastructure/database/categoryCatalogs';

// Textos visibles de HU8. Literales de HU8: «Categorías», «Gestiona tus etiquetas de
// ingresos y gastos», «Nueva categoría», «Nombre de la categoría», «Tipo de categoría»,
// «Ingreso», «Gasto», «Ícono», «Guardar», «Cancelar», «Editar», «Eliminar», «Confirmar»,
// «La categoría ya existe», «¿Está seguro de eliminar esta categoría?» y la advertencia de
// reasignación. Los demás proceden del prototipo o son propuestas de E06-D6.
export const CATEGORY_TEXTS = {
  screenTitle: 'Categorías',
  screenSubtitle: 'Gestiona tus etiquetas de ingresos y gastos',
  sections: {
    system: 'Categorías del sistema',
    own: 'Mis categorías',
  },
  emptyOwn: 'Aún no tienes categorías personalizadas.',
  types: {
    income: 'Ingreso',
    expense: 'Gasto',
  } satisfies Record<CategoryType, string>,
  buttons: {
    newCategory: '+ Nueva categoría',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    accept: 'Aceptar',
    back: 'Volver',
    openCategories: 'Categorías',
  },
  form: {
    createTitle: 'Nueva categoría',
    editTitle: 'Editar categoría',
    subtitle: 'Personaliza tus ingresos y gastos.',
    nameLabel: 'Nombre de la categoría',
    namePlaceholder: 'Ej: Mascotas',
    typeLabel: 'Tipo de categoría',
    iconLabel: 'Ícono',
  },
  accessibility: {
    locked: 'Categoría del sistema: no se puede editar ni eliminar',
    edit: (name: string) => `Editar ${name}`,
    delete: (name: string) => `Eliminar ${name}`,
    icon: (label: string) => `Ícono ${label}`,
  },
  messages: {
    duplicate: 'La categoría ya existe',
    nameRequired: 'Ingresa el nombre de la categoría.',
    nameTooLong: (max: number) => `El nombre admite máximo ${max} caracteres.`,
    typeRequired: 'Selecciona el tipo de categoría.',
    iconRequired: 'Selecciona un ícono.',
    deleteQuestion: '¿Está seguro de eliminar esta categoría?',
    deleteWarning:
      "Los movimientos asociados a esta categoría serán reasignados automáticamente a la categoría 'Otros'.",
    loadFailed: 'No fue posible cargar las categorías. Intenta de nuevo',
    saveFailed: 'No fue posible guardar la categoría. Intenta de nuevo',
    deleteFailed: 'No fue posible eliminar la categoría. Intenta de nuevo',
    notEditable: 'Esta categoría no se puede modificar.',
    notFound: 'La categoría ya no existe.',
  },
} as const;
