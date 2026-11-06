import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type DismissibleOverlayProps = {
  // Se llama al tocar fuera del contenido (Task 36).
  onDismiss: () => void;
  // Sin cierre por toque exterior, por ejemplo mientras se guarda.
  disabled?: boolean;
  style: StyleProp<ViewStyle>;
  children: ReactNode;
  testID: string;
};

// Fondo de los modales. El área exterior es un `Pressable` hermano del contenido, detrás de
// él: un toque dentro del contenido nunca llega al fondo, y un toque fuera lo cierra. Lectores
// de pantalla: el fondo no es enfocable; se cierra con el botón Atrás o las acciones del modal.
export function DismissibleOverlay({
  onDismiss,
  disabled = false,
  style,
  children,
  testID,
}: DismissibleOverlayProps) {
  return (
    <View style={style}>
      <Pressable
        accessible={false}
        disabled={disabled}
        importantForAccessibility="no"
        onPress={onDismiss}
        style={StyleSheet.absoluteFill}
        testID={testID}
      />
      {children}
    </View>
  );
}
