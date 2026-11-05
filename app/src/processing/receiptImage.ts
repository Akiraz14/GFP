// Validación de la imagen del comprobante (HU7-CA02). Tomado de daniela888-li/GFP (6ec6d3c).

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

export type ReceiptImage = {
  uri: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
};

export function isSupportedReceiptImage(image: ReceiptImage): boolean {
  const name = (image.fileName ?? image.uri).toLowerCase();
  const validFormat =
    /\.(jpe?g|png)$/.test(name) ||
    image.mimeType === 'image/jpeg' ||
    image.mimeType === 'image/png';
  return (
    validFormat &&
    image.sizeBytes !== null &&
    image.sizeBytes <= RECEIPT_MAX_BYTES
  );
}
