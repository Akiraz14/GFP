import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// Borrado de las copias temporales que `react-native-image-picker` deja en la caché de la app
// al tomar o elegir una foto (HU7: la imagen no se conserva tras el procesamiento). Solo borra
// archivos con el prefijo de esa biblioteca dentro de la caché de la app.
export interface Spec extends TurboModule {
  deleteTemporaryImage(uri: string): Promise<boolean>;
  clearTemporaryImages(): Promise<number>;
}

export default TurboModuleRegistry.get<Spec>('GfpFiles');
