// Textos visibles de HU2. Literales de HU2: «Ingresar», «Verificar identificación» y «El
// campo identificación o contraseña son incorrectos». «Crear Cuenta» y «¿Olvidaste tu
// contraseña?» reemplazan a «Registrar» y «Olvidé mi contraseña» por decisión del
// responsable (E-COR-D2, mockup de HU2). «Ingresa el número celular con el código de país»
// es el texto aprobado de A-ID2. Los demás son propuestas de E04-D5.
export const LOGIN_TEXTS = {
  screenTitle: 'Iniciar Sesión',
  subtitle: 'Ingresa a tu cuenta financiera personal',
  sectionTitle: 'Credenciales de Acceso',
  labels: {
    identifier: 'Identificador',
    password: 'Contraseña',
  },
  identifierPlaceholder: 'Correo, Documento o Celular',
  buttons: {
    login: 'Ingresar',
    register: 'Crear Cuenta',
    accept: 'Aceptar',
  },
  links: {
    forgotPassword: '¿Olvidaste tu contraseña?',
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
