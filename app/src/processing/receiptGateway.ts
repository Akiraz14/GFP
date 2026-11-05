import type { ReceiptImage } from './receiptImage';

// Acceso a cámara, galería, OCR y borrado de la copia temporal de la imagen (HU7). `null`
// significa que el usuario canceló la captura.
export interface ReceiptGateway {
  takePhoto(): Promise<ReceiptImage | null>;
  pickFromGallery(): Promise<ReceiptImage | null>;
  recognizeText(uri: string): Promise<string>;
  // La imagen no se conserva después del procesamiento (plan aprobado). Nunca falla: un
  // archivo que no se pudo borrar se elimina al iniciar la app.
  discardImage(uri: string): Promise<void>;
}
