import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
  type StyleProp,
  type ViewInstance,
  type ViewStyle,
} from 'react-native';

const REVEAL_MARGIN = 8;

type FocusedFieldRegistry = {
  focus: (field: ViewInstance) => void;
  blur: (field: ViewInstance) => void;
};

const FocusedFieldContext = createContext<FocusedFieldRegistry | null>(null);

export function useFocusedFieldRegistry(): FocusedFieldRegistry | null {
  return useContext(FocusedFieldContext);
}

type FormScrollViewProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

export function FormScrollView({
  children,
  contentStyle,
  testID,
}: FormScrollViewProps) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const contentRef = useRef<ViewInstance>(null);
  const focusedRef = useRef<ViewInstance | null>(null);
  const viewportRef = useRef({ offset: 0, height: 0 });

  const revealFocusedField = useCallback(() => {
    const field = focusedRef.current;
    const content = contentRef.current;
    const { height } = viewportRef.current;
    if (field === null || content === null || height === 0) {
      return;
    }
    field.measureLayout(
      content,
      (_x, y, _width, fieldHeight) => {
        const { offset } = viewportRef.current;
        const top = Math.max(y - REVEAL_MARGIN, 0);
        const bottom = y + fieldHeight + REVEAL_MARGIN;
        if (top < offset) {
          scrollRef.current?.scrollTo({ y: top, animated: true });
        } else if (bottom > offset + height) {
          scrollRef.current?.scrollTo({
            y: Math.min(bottom - height, top),
            animated: true,
          });
        }
      },
      () => {},
    );
  }, []);

  const registry = useMemo<FocusedFieldRegistry>(
    () => ({
      focus: field => {
        focusedRef.current = field;
        revealFocusedField();
      },
      blur: field => {
        if (focusedRef.current === field) {
          focusedRef.current = null;
        }
      },
    }),
    [revealFocusedField],
  );

  const handleViewportLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportRef.current.height = event.nativeEvent.layout.height;
      revealFocusedField();
    },
    [revealFocusedField],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      viewportRef.current.offset = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  return (
    <FocusedFieldContext.Provider value={registry}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        onLayout={handleViewportLayout}
        onScroll={handleScroll}
        ref={scrollRef}
        scrollEventThrottle={16}
        testID={testID}
      >
        <View
          collapsable={false}
          onLayout={revealFocusedField}
          ref={contentRef}
          style={contentStyle}
        >
          {children}
        </View>
      </ScrollView>
    </FocusedFieldContext.Provider>
  );
}
