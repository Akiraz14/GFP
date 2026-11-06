// Textos visibles de HU1 y de las decisiones A-W1 a A-W9. Los mensajes entre comillas
// son literales de HU1 o textos aprobados por el responsable.
export const REGISTRATION_TEXTS = {
  screenTitle: 'Registro de Usuario',
  stepIndicator: (step: number) => `Paso ${step} de 3`,
  stepTitles: [
    'Datos personales y de acceso',
    'Preguntas de seguridad',
    'Confirmación de datos',
  ],
  intro: {
    title: 'Únete a GFP',
    text: 'Ingresa tus datos personales y de seguridad para configurar una cuenta completamente protegida.',
    requiredPrefix: ' Los campos marcados con ',
    requiredSuffix: ' son obligatorios.',
  },
  confirmationIntro: {
    title: 'Revisa tus datos antes de confirmar',
    text: 'Verifica que la información sea correcta. Una vez confirmes, podrás continuar con la activación de tu cuenta.',
  },
  sections: {
    identification: 'Identificación Oficial',
    personal: 'Información Personal',
    access: 'Credenciales de Acceso',
    security: 'Preguntas de Seguridad',
  },
  securityIntro:
    'Estas preguntas te ayudarán a recuperar el acceso a tu cuenta en caso de olvidar tu contraseña de forma segura.',
  requiredTag: 'Obligatorio *',
  summary: {
    document: 'Documento',
    fullName: 'Nombre completo',
  },
  help: 'Completa los tres pasos: tus datos personales y de acceso, cinco preguntas de seguridad distintas y la confirmación de tus datos. Los campos marcados con (*) son obligatorios.',
  labels: {
    documentTypeCode: 'Tipo de Documento',
    documentNumber: 'Número de Documento (DNI/NIT)',
    firstName: 'Primer Nombre',
    middleName: 'Segundo Nombre',
    lastName: 'Primer Apellido',
    secondLastName: 'Segundo Apellido',
    phoneCountryCode: 'Código de País',
    phoneNumber: 'Número Celular',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    securityQuestion: (index: number) => `Pregunta de seguridad ${index}`,
    securityAnswer: (index: number) => `Respuesta ${index}`,
    chooseQuestion: 'Selecciona una pregunta',
    yourAnswer: 'Tu respuesta',
  },
  placeholders: {
    documentNumber: 'Ej. 10203040 o 900.123.456-7',
    firstName: 'Ingresa tu primer nombre',
    middleName: 'Ingresa tu segundo nombre (si aplica)',
    lastName: 'Ingresa tu primer apellido',
    secondLastName: 'Ingresa tu segundo apellido (si aplica)',
    phoneNumber: 'Ej. 3001234567',
    email: 'carlos.mendoza@email.com',
    password: 'Crea una contraseña segura',
    answer: 'Escribe la respuesta secreta aquí',
  },
  hints: {
    email: 'Usaremos este correo para verificaciones importantes.',
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
