// Textos visibles de HU3. Los textos entre comillas en HU3 son literales («Comenzar
// recuperación», «Actualizar contraseña», «Identificador incorrecto» y «Datos ingresados
// incorrectos»); «Ingresa el número celular con el código de país» es el texto aprobado de
// A-ID2. Los demás son propuestas de E05-D5 (`decisiones-etapa-05.md`).
export const RECOVERY_TEXTS = {
  screenTitle: 'Recuperar contraseña',
  // Task 29: indicador y secciones del prototipo de HU3.
  stepIndicator: (step: number) => `Paso ${step} de 2`,
  sections: {
    questions: 'Preguntas de seguridad',
    password: 'Credenciales de acceso',
  },
  questionCaption: (index: number) => `Pregunta de seguridad ${index}`,
  labels: {
    identifier: 'Identificador',
    newPassword: 'Nueva contraseña',
    confirmation: 'Confirmar nueva contraseña',
  },
  identifierHelp: 'Correo electrónico, número de documento o número de celular',
  questionsTitle: 'Responde las preguntas de seguridad',
  buttons: {
    start: 'Comenzar recuperación',
    update: 'Actualizar contraseña',
    accept: 'Aceptar',
  },
  messages: {
    identifierRequired: 'Ingresa tu identificador.',
    invalidIdentifier: 'Identificador incorrecto',
    phoneCountryCodeRequired: 'Ingresa el número celular con el código de país',
    answerRequired: 'Ingresa la respuesta.',
    confirmationMismatch:
      'La confirmación no coincide con la nueva contraseña.',
    invalidData: 'Datos ingresados incorrectos',
    lockedFor: (minutes: number) =>
      `Superaste los intentos permitidos. La recuperación queda bloqueada durante ${minutes} ${
        minutes === 1 ? 'minuto' : 'minutos'
      }.`,
    challengeExpired:
      'El tiempo para responder las preguntas terminó. Comienza la recuperación de nuevo.',
    passwordUpdated:
      'La contraseña fue actualizada. Inicia sesión con la nueva contraseña.',
    failed: 'No fue posible recuperar la contraseña. Intenta de nuevo',
    verifying: 'Verificando…',
  },
} as const;
