// Textos visibles de HU3. Los textos entre comillas en HU3 son literales («Comenzar
// recuperación», con la capitalización del mockup por decisión del responsable, E-COR-D2;
// «Actualizar contraseña», «Identificador incorrecto» y «Datos ingresados incorrectos»); «Ingresa el número celular con el código de país» es el texto aprobado de
// A-ID2. Los demás son propuestas de E05-D5 (`decisiones-etapa-05.md`).
export const RECOVERY_TEXTS = {
  screenTitle: 'Recuperar Contraseña',
  stepIndicator: (step: number) => `Paso ${step} de 2`,
  identifierIntro: 'Ingresa tu identificador para buscar tu cuenta.',
  sections: {
    questions: 'Preguntas de Seguridad',
    password: 'Credenciales de Acceso',
  },
  questionCaption: (index: number) => `Pregunta de seguridad ${index}`,
  requiredTag: 'Obligatorio *',
  labels: {
    identifier: 'Identificador',
    newPassword: 'Nueva Contraseña',
    confirmation: 'Confirmar Nueva Contraseña',
  },
  placeholders: {
    identifier: 'Correo, Documento o Celular',
    answer: 'Escribe tu respuesta',
    newPassword: 'Crea una contraseña segura',
    confirmation: 'Repite la nueva contraseña',
  },
  hints: { confirmation: 'Confirma la contraseña ingresada.' },
  questionsTitle: 'Responde las preguntas y define tu nueva clave.',
  help: 'Ingresa tu correo, número de documento o número celular. Luego responde dos de tus preguntas de seguridad y define una nueva contraseña.',
  buttons: {
    start: 'Comenzar Recuperación',
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
