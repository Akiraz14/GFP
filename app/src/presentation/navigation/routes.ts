// Registro central de rutas (G-07). Las rutas de historias no implementadas apuntan a
// una pantalla provisional, sin funcionalidad, que se sustituye al implementar la
// historia. Mientras HU2 no exista, la aplicación empieza en el registro (HU1).
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
};

export const ROUTE_DEFINITIONS: Record<RouteName, RouteDefinition> = {
  register: { story: 'HU1', title: 'Registrar usuario', implemented: true },
  login: { story: 'HU2', title: 'Iniciar sesión', implemented: false },
  passwordRecovery: {
    story: 'HU3',
    title: 'Recuperar contraseña',
    implemented: false,
  },
  movementForm: {
    story: 'HU4',
    title: 'Registro de movimiento',
    implemented: false,
  },
  movementHistory: {
    story: 'HU5',
    title: 'Historial',
    implemented: false,
  },
  receiptCapture: {
    story: 'HU7',
    title: 'Movimiento con foto',
    implemented: false,
  },
  categories: { story: 'HU8', title: 'Categorías', implemented: false },
  financialAnalysis: {
    story: 'HU9',
    title: 'Análisis financiero',
    implemented: false,
  },
  recommendations: {
    story: 'HU10',
    title: 'Recomendaciones',
    implemented: false,
  },
};

export const INITIAL_ROUTE: RouteName = ROUTES.register;
