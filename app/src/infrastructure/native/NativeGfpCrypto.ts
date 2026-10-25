import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  pbkdf2HmacSha256(
    passwordHex: string,
    saltHex: string,
    iterations: number,
    keyLengthBytes: number,
  ): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('GfpCrypto');
