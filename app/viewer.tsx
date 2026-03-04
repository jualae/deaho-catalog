import { useEffect, useState, useRef, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useCatalog } from "@/lib/catalog-context";
import { getImageUrl } from "@/lib/catalog-service";
import type { Category } from "@/lib/catalog-types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_HEIGHT = 44;
const THUMB_STRIP_HEIGHT = 80;
const MAIN_IMAGE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - THUMB_STRIP_HEIGHT - 60;

function ZoomableImage({ uri, width, height }: { uri: string; width: number; height: number }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  // Store the focal point offset accumulated during pinch
  const focalOffsetX = useSharedValue(0);
  const focalOffsetY = useSharedValue(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const updateZoomState = useCallback((zoomed: boolean) => {
    setIsZoomed(zoomed);
  }, []);

  // Helper to clamp translation within bounds
  const clampTranslation = (tx: number, ty: number, s: number) => {
    "worklet";
    const maxX = (width * (s - 1)) / 2;
    const maxY = (height * (s - 1)) / 2;
    return {
      x: Math.min(Math.max(tx, -maxX), maxX),
      y: Math.min(Math.max(ty, -maxY), maxY),
    };
  };

  const pinchGesture = Gesture.Pinch()
    .onBegin((e) => {
      // Reset focal offset at the start of each pinch
      focalOffsetX.value = 0;
      focalOffsetY.value = 0;
    })
    .onUpdate((e) => {
      // Calculate new scale
      const newScale = Math.min(Math.max(savedScale.value * e.scale, 1), 5);

      // Focal point relative to the center of the container
      const focalX = e.focalX - width / 2;
      const focalY = e.focalY - height / 2;

      // How much scale changed from the saved scale
      const scaleDiff = newScale / savedScale.value;

      // Translate so that the focal point stays under the fingers:
      // newTranslate = savedTranslate - focal * (scaleDiff - 1)
      const newTx = savedTranslateX.value - focalX * (scaleDiff - 1);
      const newTy = savedTranslateY.value - focalY * (scaleDiff - 1);

      const clamped = clampTranslation(newTx, newTy, newScale);

      scale.value = newScale;
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      if (scale.value < 1.1) {
        // Snap back to 1x
        scale.value = withTiming(1, { duration: 200 });
        savedScale.value = 1;
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(updateZoomState)(false);
      } else {
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        runOnJS(updateZoomState)(true);
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        const maxX = (width * (savedScale.value - 1)) / 2;
        const maxY = (height * (savedScale.value - 1)) / 2;
        translateX.value = Math.min(
          Math.max(savedTranslateX.value + e.translationX, -maxX),
          maxX
        );
        translateY.value = Math.min(
          Math.max(savedTranslateY.value + e.translationY, -maxY),
          maxY
        );
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (savedScale.value > 1) {
        // Zoom out to 1x
        scale.value = withTiming(1, { duration: 250 });
        savedScale.value = 1;
        translateX.value = withTiming(0, { duration: 250 });
        translateY.value = withTiming(0, { duration: 250 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(updateZoomState)(false);
      } else {
        // Zoom in to 2.5x centered on the tap point
        const targetScale = 2.5;
        const focalX = e.x - width / 2;
        const focalY = e.y - height / 2;

        // Translate so the tapped point stays in place
        const newTx = -focalX * (targetScale - 1);
        const newTy = -focalY * (targetScale - 1);
        const clamped = clampTranslation(newTx, newTy, targetScale);

        scale.value = withTiming(targetScale, { duration: 250 });
        savedScale.value = targetScale;
        translateX.value = withTiming(clamped.x, { duration: 250 });
        translateY.value = withTiming(clamped.y, { duration: 250 });
        savedTranslateX.value = clamped.x;
        savedTranslateY.value = clamped.y;
        runOnJS(updateZoomState)(true);
      }
    });

  const composed = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(doubleTapGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width, height, alignItems: "center", justifyContent: "center" }]}>
        <Animated.View style={animatedStyle}>
          <Image
            source={{ uri }}
            style={{ width: width - 20, height: height - 20 }}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function ViewerScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { catalogData } = useCatalog();

  const [currentIndex, setCurrentIndex] = useState(0);
  const mainListRef = useRef<FlatList>(null);
  const thumbListRef = useRef<FlatList>(null);

  const category = catalogData?.categories.find(
    (c: Category) => c.id === categoryId
  );

  const pages = category?.pages ?? [];

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index ?? 0;
        setCurrentIndex(idx);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  useEffect(() => {
    if (thumbListRef.current && pages.length > 0) {
      try {
        thumbListRef.current.scrollToIndex({
          index: currentIndex,
          animated: true,
          viewPosition: 0.5,
        });
      } catch {}
    }
  }, [currentIndex, pages.length]);

  const goToPage = useCallback(
    (index: number) => {
      if (mainListRef.current) {
        mainListRef.current.scrollToIndex({ index, animated: true });
      }
    },
    []
  );

  if (!catalogData || !category) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  const renderMainImage = ({ item: pageNum }: { item: number }) => {
    const url = getImageUrl(catalogData, pageNum);
    return (
      <ZoomableImage
        uri={url}
        width={SCREEN_WIDTH}
        height={MAIN_IMAGE_HEIGHT}
      />
    );
  };

  const renderThumb = ({ item: pageNum, index }: { item: number; index: number }) => {
    const url = getImageUrl(catalogData, pageNum);
    const isActive = index === currentIndex;
    return (
      <Pressable
        onPress={() => goToPage(index)}
        style={({ pressed }) => [
          styles.thumbItem,
          isActive && { borderColor: "#FF6F00" },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Image
          source={{ uri: url }}
          style={styles.thumbImage}
          resizeMode="cover"
        />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backText}>목록</Text>
        </Pressable>
        <Text style={styles.catName} numberOfLines={1}>
          {category.name}
        </Text>
        <View style={styles.indicator}>
          <Text style={styles.indicatorText}>
            {currentIndex + 1} / {pages.length}
          </Text>
        </View>
      </View>

      {/* Thumbnail Strip */}
      <View style={styles.thumbStrip}>
        <FlatList
          ref={thumbListRef}
          data={pages}
          renderItem={renderThumb}
          keyExtractor={(item) => `thumb-${item}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbContent}
          getItemLayout={(_, index) => ({
            length: 60,
            offset: 60 * index,
            index,
          })}
        />
      </View>

      {/* Main Image Viewer */}
      <View style={styles.mainArea}>
        <FlatList
          ref={mainListRef}
          data={pages}
          renderItem={renderMainImage}
          keyExtractor={(item) => `page-${item}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
        />

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <Pressable
            onPress={() => goToPage(currentIndex - 1)}
            style={[styles.navArrow, styles.navLeft]}
          >
            <MaterialIcons name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
        )}
        {currentIndex < pages.length - 1 && (
          <Pressable
            onPress={() => goToPage(currentIndex + 1)}
            style={[styles.navArrow, styles.navRight]}
          >
            <MaterialIcons name="chevron-right" size={28} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
  header: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: HEADER_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  backBtn: {
    backgroundColor: "#333333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  catName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  indicator: {
    backgroundColor: "#333333",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  indicatorText: {
    color: "#999999",
    fontSize: 12,
  },
  thumbStrip: {
    backgroundColor: "#1A1A1A",
    paddingVertical: 8,
    height: THUMB_STRIP_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  thumbContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  thumbItem: {
    width: 54,
    height: 60,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  mainArea: {
    flex: 1,
    position: "relative",
  },
  navArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -30,
    width: 44,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  navLeft: {
    left: 10,
  },
  navRight: {
    right: 10,
  },
});
