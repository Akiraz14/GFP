import TextRecognition from '@react-native-ml-kit/text-recognition';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import NativeGfpFiles from '../infrastructure/native/NativeGfpFiles';
import { rowsFromLines } from './receiptExtraction';
import type { ReceiptGateway } from './receiptGateway';
import type { ReceiptImage } from './receiptImage';

function toImage(response: ImagePickerResponse): ReceiptImage | null {
  if (response.didCancel) {
    return null;
  }
  if (response.errorCode !== undefined) {
    throw new Error(`image capture failed: ${response.errorCode}`);
  }
  const asset = response.assets?.[0];
  if (asset?.uri === undefined) {
    return null;
  }
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? null,
    mimeType: asset.type ?? null,
    sizeBytes: asset.fileSize ?? null,
  };
}

// Borra las copias temporales que quedaron de una ejecución anterior (por ejemplo, si la app
// se cerró durante el procesamiento).
export async function clearTemporaryReceiptImages(): Promise<void> {
  try {
    await NativeGfpFiles?.clearTemporaryImages();
  } catch {
    // Se reintenta en el próximo inicio.
  }
}

// La imagen se procesa en el dispositivo con ML Kit y no sale de él. La foto de la cámara se
// reduce a 2048 px y calidad 0,8 para que quede por debajo de 5 MB (E-CONS-D4); la de la
// galería se valida tal como está (HU7-CA02). Adaptado de daniela888-li/GFP (6ec6d3c).
export const nativeReceiptGateway: ReceiptGateway = {
  async takePhoto() {
    return toImage(
      await launchCamera({
        mediaType: 'photo',
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.8,
        saveToPhotos: false,
      }),
    );
  },
  async pickFromGallery() {
    return toImage(
      await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }),
    );
  },
  async recognizeText(uri) {
    const result = await TextRecognition.recognize(uri);
    const lines = result.blocks.flatMap(block => block.lines);
    return lines.length > 0 ? rowsFromLines(lines) : result.text;
  },
  async discardImage(uri) {
    try {
      await NativeGfpFiles?.deleteTemporaryImage(uri);
    } catch {
      // Se borra en el próximo inicio con clearTemporaryReceiptImages().
    }
  },
};
