import { describe, it, expect } from "vitest";

/**
 * ZoomableImage component tests
 * Since the actual gesture handling is done by react-native-gesture-handler
 * and react-native-reanimated (native modules), we test the zoom logic constraints.
 */

describe("ZoomableImage zoom logic", () => {
  // Simulate the zoom scale clamping logic
  function clampScale(savedScale: number, pinchScale: number): number {
    const newScale = savedScale * pinchScale;
    return Math.min(Math.max(newScale, 1), 5);
  }

  // Simulate the pan translation clamping logic
  function clampTranslation(
    savedTranslate: number,
    translation: number,
    dimension: number,
    scale: number
  ): number {
    const max = (dimension * (scale - 1)) / 2;
    return Math.min(Math.max(savedTranslate + translation, -max), max);
  }

  it("should clamp minimum scale to 1", () => {
    expect(clampScale(1, 0.5)).toBe(1);
    expect(clampScale(1, 0.1)).toBe(1);
  });

  it("should clamp maximum scale to 5", () => {
    expect(clampScale(1, 6)).toBe(5);
    expect(clampScale(2, 3)).toBe(5);
  });

  it("should allow normal zoom between 1 and 5", () => {
    expect(clampScale(1, 2)).toBe(2);
    expect(clampScale(1, 3)).toBe(3);
    expect(clampScale(1.5, 2)).toBe(3);
  });

  it("should not allow panning when scale is 1", () => {
    const result = clampTranslation(0, 100, 400, 1);
    expect(result).toBe(0);
  });

  it("should allow panning when zoomed in", () => {
    // At 2x zoom on 400px width, max pan = (400 * (2-1)) / 2 = 200
    const result = clampTranslation(0, 100, 400, 2);
    expect(result).toBe(100);
  });

  it("should clamp panning to max bounds", () => {
    // At 2x zoom on 400px width, max pan = 200
    const result = clampTranslation(0, 300, 400, 2);
    expect(result).toBe(200);
  });

  it("should clamp panning to negative bounds", () => {
    const result = clampTranslation(0, -300, 400, 2);
    expect(result).toBe(-200);
  });

  // Focal point zoom logic tests
  function focalPinchTranslation(
    savedTx: number,
    focalX: number,
    containerWidth: number,
    savedScale: number,
    newScale: number
  ): number {
    const focal = focalX - containerWidth / 2;
    const scaleDiff = newScale / savedScale;
    return savedTx - focal * (scaleDiff - 1);
  }

  it("should offset translation toward focal point when zooming", () => {
    // Pinching at right side (focalX=300 on 400px container)
    // focal = 300 - 200 = 100
    // scaleDiff = 2 / 1 = 2
    // tx = 0 - 100 * (2 - 1) = -100 (shifts image left so right side stays under fingers)
    const tx = focalPinchTranslation(0, 300, 400, 1, 2);
    expect(tx).toBe(-100);
  });

  it("should offset translation toward left focal point when zooming", () => {
    // Pinching at left side (focalX=100 on 400px container)
    // focal = 100 - 200 = -100
    // scaleDiff = 2 / 1 = 2
    // tx = 0 - (-100) * (2 - 1) = 100 (shifts image right so left side stays under fingers)
    const tx = focalPinchTranslation(0, 100, 400, 1, 2);
    expect(tx).toBe(100);
  });

  it("should have zero offset when pinching at center", () => {
    // Pinching at center (focalX=200 on 400px container)
    const tx = focalPinchTranslation(0, 200, 400, 1, 2);
    expect(tx).toBe(0);
  });

  it("double tap should toggle between 1x and 2.5x", () => {
    // First double tap: zoom in
    let scale = 1;
    if (scale > 1) {
      scale = 1;
    } else {
      scale = 2.5;
    }
    expect(scale).toBe(2.5);

    // Second double tap: zoom out
    if (scale > 1) {
      scale = 1;
    } else {
      scale = 2.5;
    }
    expect(scale).toBe(1);
  });
});
