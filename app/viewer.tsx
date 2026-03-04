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
import { getImageUrl, makePageId } from "@/lib/catalog-service";
import type { Category } from "@/lib/catalog-types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_HEIGHT = 44;
const THUMB_STRIP_HEIGHT = 80;
const MAIN_IMAGE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - THUMB_STRIP_HEIGHT - 60;

/**
 * ZoomableImage with proper focal-point pinch zoom.
 *
 * Key insight for consecutive pinch zoom:
 * The focal point from the gesture event (e.focalX/Y) is in *screen* coordinates.
 * To find the corresponding point on the *image*, we must account for the current
 * translation and scale. The formula to convert screen focal to image-space focal:
 *
 *   imageFocal = (screenFocal - containerCenter - currentTranslate) / currentScale
 *
 * Then the new translate to keep that image point under the finger:
 *   newTranslate = screenFocal - containerCenter - imageFocal * newScale
 */
function ZoomableImage({ uri, width, height, onZoomChange }: { uri: string; width: number; height: number; onZoomChange?: (zoomed: boolean) => void }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // The image-space focal point (computed once at pinch begin)
  const imageFocalX = useSharedValue(0);
  const imageFocalY = useSharedValue(0);
  // The screen-space focal point (fixed at pinch begin)
  const screenFocalX = useSharedValue(0);
  const screenFocalY = useSharedValue(0);
  // Base scale at the start of this pinch
  const baseScale = useSharedValue(1);

  const [isZoomed, setIsZoomed] = useState(false);

  const updateZoomState = useCallback((zoomed: boolean) => {
    setIsZoomed(zoomed);
    onZoomChange?.(zoomed);
  }, [onZoomChange]);

  const clampTx = (tx: number, s: number) => {
    "worklet";
    const maxX = (width * (s - 1)) / 2;
    return Math.min(Math.max(tx, -maxX), maxX);
  };

  const clampTy = (ty: number, s: number) => {
    "worklet";
    const maxY = (height * (s - 1)) / 2;
    return Math.min(Math.max(ty, -maxY), maxY);
  };

  const pinchGesture = Gesture.Pinch()
    .onBegin((e) => {
      // Snapshot current state
      baseScale.value = scale.value;

      // Screen focal relative to container center
      const sfx = e.focalX - width / 2;
      const sfy = e.focalY - height / 2;
      screenFocalX.value = sfx;
      screenFocalY.value = sfy;

      // Convert screen focal to image-space focal
      // image point = (screenFocal - translate) / scale
      imageFocalX.value = (sfx - translateX.value) / scale.value;
      imageFocalY.value = (sfy - translateY.value) / scale.value;
    })
    .onUpdate((e) => {
      const newScale = Math.min(Math.max(baseScale.value * e.scale, 1), 5);

      // Keep the same image point under the same screen point:
      // newTranslate = screenFocal - imageFocal * newScale
      const newTx = screenFocalX.value - imageFocalX.value * newScale;
      const newTy = screenFocalY.value - imageFocalY.value * newScale;

      scale.value = newScale;
      translateX.value = clampTx(newTx, newScale);
      translateY.value = clampTy(newTy, newScale);
    })
    .onEnd(() => {
      if (scale.value < 1.1) {
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
    .enabled(isZoomed)
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = clampTx(
          savedTranslateX.value + e.translationX,
          savedScale.value
        );
        translateY.value = clampTy(
          savedTranslateY.value + e.translationY,
          savedScale.value
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
        scale.value = withTiming(1, { duration: 250 });
        savedScale.value = 1;
        translateX.value = withTiming(0, { duration: 250 });
        translateY.value = withTiming(0, { duration: 250 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(updateZoomState)(false);
      } else {
        const targetScale = 2.5;
        // Screen focal relative to center
        const sfx = e.x - width / 2;
        const sfy = e.y - height / 2;
        // Image focal (at scale=1, translate=0): same as screen focal
        const ifx = sfx;
        const ify = sfy;
        // New translate to keep tap point in place
        const newTx = clampTx(sfx - ifx * targetScale, targetScale);
        const newTy = clampTy(sfy - ify * targetScale, targetScale);

        scale.value = withTiming(targetScale, { duration: 250 });
        savedScale.value = targetScale;
        translateX.value = withTiming(newTx, { duration: 250 });
        translateY.value = withTiming(newTy, { duration: 250 });
        savedTranslateX.value = newTx;
        savedTranslateY.value = newTy;
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
  const { categoryId, startPage } = useLocalSearchParams<{ categoryId: string; startPage?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { catalogData, isFavorite, toggleFavorite } = useCatalog();

  const initialIndex = startPage ? parseInt(startPage, 10) : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnyZoomed, setIsAnyZoomed] = useState(false);
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
    const pageId = categoryId ? makePageId(categoryId, pageNum) : "";
    const isPageFav = isFavorite(pageId);
    return (
      <View style={{ width: SCREEN_WIDTH, height: MAIN_IMAGE_HEIGHT, position: "relative" }}>
        <ZoomableImage
          uri={url}
          width={SCREEN_WIDTH}
          height={MAIN_IMAGE_HEIGHT}
          onZoomChange={setIsAnyZoomed}
        />
        {/* Favorite Heart on image top-right - per page */}
        <Pressable
          onPress={() => toggleFavorite(pageId)}
          style={({ pressed }) => [
            styles.imageHeartBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={styles.imageHeartBg}>
            <MaterialIcons
              name={isPageFav ? "favorite" : "favorite-border"}
              size={26}
              color={isPageFav ? "#FF4081" : "#FFFFFF"}
            />
          </View>
        </Pressable>
      </View>
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
        {!isActive && <View style={styles.thumbDimOverlay} />}
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
          scrollEnabled={!isAnyZoomed}
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          initialScrollIndex={initialIndex}
          initialNumToRender={Math.max(1, initialIndex + 1)}
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
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: HEADER_HEIGHT,
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
    lineHeight: 18,
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
  imageHeartBtn: {
    position: "absolute",
    top: 12,
    right: 16,
    zIndex: 10,
  },
  imageHeartBg: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    padding: 8,
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
    borderWidth: 3,
    borderColor: "transparent",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbDimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
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
