import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { todayIso } from '../../business/dates/localDate';
import { amountInputFromCents, formatMoney } from '../../business/money/money';
import {
  extractReceiptData,
  type ReceiptData,
} from '../../processing/receiptExtraction';
import type { ReceiptGateway } from '../../processing/receiptGateway';
import {
  isSupportedReceiptImage,
  type ReceiptImage,
} from '../../processing/receiptImage';
import { ActionButton } from '../components/ActionButton';
import { COLORS } from '../components/theme';
import type { MovementPrefill } from '../movements/MovementFormScreen';
import { RECEIPT_TEXTS as TEXTS } from './receiptTexts';

type ReceiptCaptureScreenProps = {
  gateway: ReceiptGateway;
  onCancel: () => void;
  onContinue: (prefill: MovementPrefill) => void;
  now?: () => number;
};

type Reading = 'complete' | 'partial' | 'none';

function readingOf(data: ReceiptData): Reading {
  const found = [data.amountCents, data.date, data.merchant].filter(
    value => value !== null,
  ).length;
  if (found === 3) {
    return 'complete';
  }
  return found === 0 ? 'none' : 'partial';
}

const NO_DATA: ReceiptData = { amountCents: null, date: null, merchant: null };

// Flujo de HU7, adaptado de daniela888-li/GFP (6ec6d3c). La imagen se procesa al capturarla o
// elegirla (plan aprobado) y nada se guarda aquí: los datos pasan al formulario de HU4 para
// que el usuario los revise y confirme (HU7-CA05). La copia temporal de la imagen se borra al
// reintentar, cancelar, continuar o salir de la pantalla (plan aprobado: la imagen no se
// conserva).
export function ReceiptCaptureScreen({
  gateway,
  onCancel,
  onContinue,
  now = Date.now,
}: ReceiptCaptureScreenProps) {
  const [image, setImage] = useState<ReceiptImage | null>(null);
  const [data, setData] = useState<ReceiptData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const mounted = useRef(true);
  const current = useRef<string | null>(null);

  // Borra la imagen mostrada, si la hay. La vista previa deja de usarla antes.
  const discard = useCallback(() => {
    const uri = current.current;
    current.current = null;
    if (uri !== null) {
      gateway.discardImage(uri);
    }
  }, [gateway]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      discard();
    };
  }, [discard]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        discard();
        onCancel();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onCancel, discard]);

  async function capture(source: () => Promise<ReceiptImage | null>) {
    setNotice(null);
    let selected: ReceiptImage | null;
    try {
      selected = await source();
    } catch {
      if (mounted.current) {
        setNotice(TEXTS.captureFailed);
      }
      return;
    }
    if (selected === null) {
      return;
    }
    if (!mounted.current) {
      gateway.discardImage(selected.uri);
      return;
    }
    if (!isSupportedReceiptImage(selected)) {
      gateway.discardImage(selected.uri);
      setNotice(TEXTS.invalidImage);
      return;
    }
    discard();
    current.current = selected.uri;
    setImage(selected);
    setProcessing(true);
    let result = NO_DATA;
    try {
      const text = await gateway.recognizeText(selected.uri);
      result = extractReceiptData(text, todayIso(now()));
    } catch {
      // Un fallo del OCR equivale a no haber identificado datos (HU7-CA06).
    }
    if (mounted.current) {
      setData(result);
      setProcessing(false);
    }
  }

  function retry() {
    discard();
    setImage(null);
    setData(null);
    setNotice(null);
  }

  function cancel() {
    discard();
    onCancel();
  }

  function continueToForm() {
    discard();
    onContinue({
      amount:
        data?.amountCents == null ? '' : amountInputFromCents(data.amountCents),
      date: data?.date ?? '',
      description: data?.merchant ?? '',
    });
  }

  const reading = data === null ? null : readingOf(data);

  return (
    <View style={styles.screen} testID="receipt-capture">
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {reading === null ? TEXTS.title : TEXTS.review.title}
        </Text>
        <Text style={styles.subtitle}>
          {reading === null ? TEXTS.subtitle : TEXTS.review[reading]}
        </Text>

        <View style={styles.preview}>
          {image === null ? (
            <Text style={styles.previewText}>{TEXTS.preview}</Text>
          ) : (
            <Image
              resizeMode="cover"
              source={{ uri: image.uri }}
              style={styles.image}
              testID="receipt-preview"
            />
          )}
          {reading !== null && (
            <View style={[styles.badge, badgeStyles[reading]]}>
              <Text style={styles.badgeText} testID="receipt-badge">
                {TEXTS.badges[reading]}
              </Text>
            </View>
          )}
        </View>

        {processing && (
          <View style={styles.processing} testID="receipt-processing">
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.processingText}>{TEXTS.processing}</Text>
          </View>
        )}

        {image === null && (
          <>
            <View style={styles.row}>
              <ActionButton
                label={TEXTS.takePhoto}
                onPress={() => {
                  capture(() => gateway.takePhoto());
                }}
                testID="receipt-take-photo"
                variant="primary"
              />
            </View>
            <View style={styles.row}>
              <ActionButton
                label={TEXTS.pickGallery}
                onPress={() => {
                  capture(() => gateway.pickFromGallery());
                }}
                testID="receipt-pick-gallery"
              />
            </View>
            <View style={styles.row}>
              <ActionButton
                label={TEXTS.cancel}
                onPress={cancel}
                testID="receipt-cancel"
              />
            </View>
          </>
        )}

        {reading !== null && (
          <View style={styles.row}>
            <ActionButton
              label={TEXTS.cancel}
              onPress={cancel}
              testID="receipt-cancel"
            />
            <ActionButton
              label={TEXTS.retry}
              onPress={retry}
              testID="receipt-retry"
            />
            <ActionButton
              label={TEXTS.continue}
              onPress={continueToForm}
              testID="receipt-continue"
              variant="primary"
            />
          </View>
        )}

        {notice !== null && (
          <View accessibilityRole="alert" style={styles.notice}>
            <Text style={styles.noticeText} testID="receipt-notice">
              {notice}
            </Text>
          </View>
        )}

        {reading === 'none' && (
          <View accessibilityRole="alert" style={styles.notice}>
            <Text style={styles.noticeTitle}>{TEXTS.noDataTitle}</Text>
            <Text style={styles.noticeText} testID="receipt-no-data">
              {TEXTS.noData}
            </Text>
          </View>
        )}

        {data !== null && reading !== 'none' && (
          <View style={styles.card} testID="receipt-summary">
            <Text style={styles.cardTitle}>{TEXTS.extracted}</Text>
            <ExtractedRow
              label={TEXTS.amount}
              value={
                data.amountCents === null ? null : formatMoney(data.amountCents)
              }
            />
            <ExtractedRow label={TEXTS.date} value={data.date} />
            <ExtractedRow label={TEXTS.merchant} value={data.merchant} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ExtractedRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <View style={styles.extracted}>
      <Text style={styles.extractedLabel}>{label}</Text>
      <Text style={value === null ? styles.missing : styles.extractedValue}>
        {value ?? TEXTS.notIdentified}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 20 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  subtitle: {
    color: COLORS.mutedText,
    fontSize: 15,
    marginBottom: 16,
    marginTop: 4,
  },
  preview: {
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    height: 220,
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewText: { color: COLORS.mutedText, fontSize: 15 },
  image: { height: '100%', width: '100%' },
  badge: {
    borderRadius: 6,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    top: 10,
  },
  badgeText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  processing: { alignItems: 'center', marginBottom: 16 },
  processingText: { color: COLORS.text, fontSize: 15, marginTop: 8 },
  row: { flexDirection: 'row', marginBottom: 10 },
  notice: {
    backgroundColor: '#FFF4CE',
    borderRadius: 8,
    marginTop: 6,
    padding: 12,
  },
  noticeTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  noticeText: { color: COLORS.text, fontSize: 14, marginTop: 2 },
  card: {
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    padding: 14,
  },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  extracted: { marginTop: 10 },
  extractedLabel: { color: COLORS.mutedText, fontSize: 13 },
  extractedValue: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  missing: { color: COLORS.mutedText, fontSize: 15, fontStyle: 'italic' },
});

const badgeStyles = StyleSheet.create({
  complete: { backgroundColor: '#7BD8A0' },
  partial: { backgroundColor: '#FFC166' },
  none: { backgroundColor: '#F28B82' },
});
