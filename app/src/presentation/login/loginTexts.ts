// Textos visibles de HU2. Los textos entre comillas en HU2 son literales («Ingresar»,
// «Registrar», «Olvidé mi contraseña», «Verificar identificación» y «El campo
// identificación o contraseña son incorrectos»); «Ingresa el número celular con el código
// de país» es el texto aprobado de A-ID2. Los demás son propuestas de E04-D5.
export const LOGIN_TEXTS = {
  screenTitle: 'Iniciar sesión',
  labels: {
    identifier: 'Identificador',
    password: 'Contraseña',
  },
  identifierHelp: 'Correo electrónico, número de documento o número de celular',
  buttons: {
    login: 'Ingresar',
    register: 'Registrar',
    accept: 'Aceptar',
  },
  links: {
    forgotPassword: 'Olvidé mi contraseña',
  },
  messages: {
    identifierRequired: 'Ingresa tu identificador.',
    passwordRequired: 'Ingresa tu contraseña.',
    identifierFormat: 'Verificar identificación',
    invalidCredentials: 'El campo identificación o contraseña son incorrectos',
    phoneCountryCodeRequired: 'Ingresa el número celular con el código de país',
    lockedFor: (minutes: number) =>
      `Superaste los intentos permitidos. El acceso queda bloqueado durante ${minutes} ${
        minutes === 1 ? 'minuto' : 'minutos'
      }.`,
    failed: 'No fue posible iniciar sesión. Intenta de nuevo',
    signingIn: 'Ingresando…',
  },
} as const;

export function lockMinutes(milliseconds: number): number {
  return Math.max(Math.ceil(milliseconds / 60_000), 1);
}
