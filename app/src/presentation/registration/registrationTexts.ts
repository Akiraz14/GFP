// Textos visibles de HU1 y de las decisiones A-W1 a A-W9. Los mensajes entre comillas
// son literales de HU1 o textos aprobados por el responsable.
export const REGISTRATION_TEXTS = {
  screenTitle: 'Registrar usuario',
  stepIndicator: (step: number) => `Paso ${step} de 3`,
  // Bug 38: secuencia del prototipo de HU1 (datos, preguntas, confirmación).
  stepTitles: [
    'Datos personales y de acceso',
    'Preguntas de seguridad',
    'Confirmación de datos',
  ],
  sections: {
    identification: 'Identificación oficial',
    personal: 'Información personal',
    access: 'Credenciales de acceso',
  },
  summary: {
    document: 'Documento',
    fullName: 'Nombre completo',
    note: 'Revisa tus datos antes de registrarte. Si algo no es correcto, pulsa «Editar datos».',
  },
  labels: {
    documentTypeCode: 'Tipo de documento',
    documentNumber: 'Documento',
    firstName: 'Primer nombre',
    middleName: 'Segundo nombre (opcional)',
    lastName: 'Primer apellido',
    secondLastName: 'Segundo apellido (opcional)',
    phoneCountryCode: 'Código de país',
    phoneNumber: 'Número celular',
    email: 'Correo electrónico',
    password: 'Contraseña',
    securityQuestion: (index: number) => `Pregunta de seguridad ${index}`,
    securityAnswer: (index: number) => `Respuesta ${index}`,
  },
  selectPlaceholder: 'Seleccionar',
  buttons: {
    back: 'Atrás',
    next: 'Siguiente',
    edit: 'Editar datos',
    register: 'Registrar',
    clear: 'Limpiar',
    cancel: 'Cancelar',
    confirmClear: 'Borrar',
    accept: 'Aceptar',
  },
  messages: {
    fieldError: 'Error en los campos ingresados',
    emailError: 'Verificar correo',
    alreadyRegistered: 'El usuario se encuentra registrado',
    registered: 'El registro fue exitoso',
    clearConfirmation: '¿Deseas borrar todos los datos ingresados?',
    registrationFailed:
      'No fue posible completar el registro. Intenta de nuevo',
    registering: 'Registrando…',
  },
} as const;

export const DATABASE_OPEN_ERROR_MESSAGE =
  'No fue posible abrir la base de datos. Reinicia la aplicación.';
