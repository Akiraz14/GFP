// Registro central de rutas (G-07). Las rutas de historias no implementadas apuntan a
// una pantalla provisional, sin funcionalidad, que se sustituye al implementar la
// historia. La aplicación empieza en el inicio de sesión (HU2); las rutas con datos
// financieros exigen una sesión válida (HU2-CA10, E04-D3).
export const ROUTES = {
  register: 'register',
  login: 'login',
  passwordRecovery: 'passwordRecovery',
  movementForm: 'movementForm',
  movementHistory: 'movementHistory',
  receiptCapture: 'receiptCapture',
  categories: 'categories',
  financialAnalysis: 'financialAnalysis',
  recommendations: 'recommendations',
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];

export type RouteDefinition = {
  story: string;
  title: string;
  implemented: boolean;
  requiresSession: boolean;
};

export const ROUTE_DEFINITIONS: Record<RouteName, RouteDefinition> = {
  register: {
    story: 'HU1',
    title: 'Registrar usuario',
    implemented: true,
    requiresSession: false,
  },
  login: {
    story: 'HU2',
    title: 'Iniciar sesión',
    implemented: true,
    requiresSession: false,
  },
  passwordRecovery: {
    story: 'HU3',
    title: 'Recuperar contraseña',
    implemented: false,
    requiresSession: false,
  },
  movementForm: {
    story: 'HU4',
    title: 'Registro de movimiento',
    implemented: false,
    requiresSession: true,
  },
  movementHistory: {
    story: 'HU5',
    title: 'Historial',
    implemented: false,
    requiresSession: true,
  },
  receiptCapture: {
    story: 'HU7',
    title: 'Movimiento con foto',
    implemented: false,
    requiresSession: true,
  },
  categories: {
    story: 'HU8',
    title: 'Categorías',
    implemented: false,
    requiresSession: true,
  },
  financialAnalysis: {
    story: 'HU9',
    title: 'Análisis financiero',
    implemented: false,
    requiresSession: true,
  },
  recommendations: {
    story: 'HU10',
    title: 'Recomendaciones',
    implemented: false,
    requiresSession: true,
  },
};

export const INITIAL_ROUTE: RouteName = ROUTES.login;
export const AUTHENTICATED_HOME_ROUTE: RouteName = ROUTES.movementHistory;
