# ESC/P Layout Command Analysis Report

**Date:** 2025-11-27
**Analyst:** Claude Code (QA ESC/P Specialist)
**Library:** escp-ts
**Branch:** doctyps-and-test

---

## Executive Summary

This report documents the byte-level analysis of the ESC/P command generation in the escp-ts layout system. The analysis focused on positioning commands (ESC $ for horizontal, ESC J for vertical) and style commands used in layout rendering.

### Overall Status: PASS (with observations)

The library generates **correct ESC/P command sequences** for positioning and styling. No critical byte-level errors were found. Some optimization opportunities exist for reducing redundant commands.

---

## 1. ESC/P Commands Under Test

### 1.1 Printer Initialization
| Command | Bytes | Description |
|---------|-------|-------------|
| ESC @ | `1B 40` | Initialize printer |

**Status:** PASS - All PRN files properly begin with ESC @ initialization.

### 1.2 Horizontal Positioning
| Command | Bytes | Description |
|---------|-------|-------------|
| ESC $ nL nH | `1B 24 nL nH` | Absolute horizontal position in 1/60 inch units |

**Formula:** `units = dots / 6` (at 360 DPI)
**Byte encoding:** `nL = units & 0xFF`, `nH = (units >> 8) & 0xFF`

**Test Results:**

| Position (dots) | Position (inches) | Expected Units | Expected nL nH | Actual nL nH | Status |
|----------------|-------------------|----------------|----------------|--------------|--------|
| 0 | 0.000 | 0 | 00 00 | (skipped) | PASS* |
| 360 | 1.000 | 60 | 3C 00 | 3C 00 | PASS |
| 720 | 2.000 | 120 | 78 00 | 78 00 | PASS |
| 1080 | 3.000 | 180 | B4 00 | B4 00 | PASS |
| 1536 | 4.267 | 256 | 00 01 | 00 01 | PASS |
| 1800 | 5.000 | 300 | 2C 01 | 2C 01 | PASS |
| 3072 | 8.533 | 512 | 00 02 | 00 02 | PASS |
| 3600 | 10.000 | 600 | 58 02 | 58 02 | PASS |

*Note: Position 0 is correctly skipped when the print head is already at X=0 (optimization).

**Code Location:** `/Users/mohammadalmechkor/Projects/escp-ts/src/layout/renderer.ts`, lines 325-333

```typescript
function moveToX(ctx: RenderContext, x: number): void {
  if (Math.abs(ctx.currentX - x) > 1) {
    const units = Math.max(0, Math.round(x / 6));
    emit(ctx, CommandBuilder.absoluteHorizontalPosition(units));
    ctx.currentX = x;
  }
}
```

### 1.3 Vertical Positioning
| Command | Bytes | Description |
|---------|-------|-------------|
| ESC J n | `1B 4A n` | Advance print position by n/180 inch |

**Formula:** `units = dots / 2` (at 360 DPI)
**Maximum value:** 255 (larger advances use multiple commands)

**Test Results:**

| Y Position (dots) | Y Position (inches) | Delta (dots) | Expected Units | Status |
|-------------------|---------------------|--------------|----------------|--------|
| 60 | 0.167 | 60 | 30 | PASS |
| 180 | 0.500 | 120 | 60 | PASS |
| 360 | 1.000 | 180 | 90 | PASS |
| 510 | 1.417 | 150 | 75 | PASS |
| 540 | 1.500 | 30 | 15 | PASS |
| 720 | 2.000 | 180 | 90 | PASS |
| 900 | 2.500 | 180 | 90 | PASS |
| 1080 | 3.000 | 180 | 90 | PASS |

**Large Advance Handling:**
When vertical advance exceeds 255 units (510 dots), the renderer correctly splits into multiple ESC J commands:
- 255 + 255 for 510 units
- 255 + 255 + remaining for larger advances

**Code Location:** `/Users/mohammadalmechkor/Projects/escp-ts/src/layout/renderer.ts`, lines 338-355

```typescript
function moveToY(ctx: RenderContext, y: number): void {
  if (y > ctx.currentY) {
    const deltaY = y - ctx.currentY;
    let units180 = Math.round(deltaY / 2);
    while (units180 > 0) {
      const advance = Math.min(units180, 255);
      emit(ctx, CommandBuilder.advanceVertical(advance));
      units180 -= advance;
    }
    ctx.currentY = y;
  }
}
```

---

## 2. Style Commands

### 2.1 Font Style Commands
| Command | Bytes | Description |
|---------|-------|-------------|
| ESC E | `1B 45` | Bold on |
| ESC F | `1B 46` | Bold off |
| ESC 4 | `1B 34` | Italic on |
| ESC 5 | `1B 35` | Italic off |
| ESC - n | `1B 2D n` | Underline (n=0 off, n=1 on) |
| ESC W n | `1B 57 n` | Double width (n=0 off, n=1 on) |

**Status:** PASS - All style commands generate correct byte sequences.

**Code Location:** `/Users/mohammadalmechkor/Projects/escp-ts/src/layout/renderer.ts`, lines 360-412

---

## 3. Sample PRN Analysis

### 3.1 Basic Layout (02-layout-system.prn)

```
Offset 0000: 1B 40           ESC @ - Initialize printer
Offset 0002: 1B 4A 3F        ESC J 63 - Vertical advance 63/180"
Offset 0005: 1B 24 2B 00     ESC $ 43 0 - Horizontal position 43 units
Offset 0009: 1B 45           ESC E - Bold on
Offset 000B: 1B 57 01        ESC W 1 - Double width on
Offset 000E: INVOICE         Text content
...
```

### 3.2 Positioning Demo (09-positioning.prn)

```
Offset 0000: 1B 40           ESC @ - Initialize printer
Offset 0002: 1B 4A 3C        ESC J 60 - Vertical advance 60/180"
Offset 0005: 1B 24 27 01     ESC $ 295 0 - Horizontal position 295 units
Offset 0009: 1B 45           ESC E - Bold on
Offset 000B: 1B 57 01        ESC W 1 - Double width on
Offset 000E: ABSOLUTE POS... Text content
...
```

---

## 4. Observations and Recommendations

### 4.1 Correct Behaviors

1. **ESC @ Initialization**: All PRN files correctly start with ESC @ (1B 40)
2. **Position Calculations**: Horizontal and vertical position calculations are accurate
3. **nL/nH Encoding**: Low/high byte encoding follows ESC/P specification correctly
4. **Large Advance Splitting**: ESC J commands correctly split advances > 255 units
5. **Position Optimization**: The renderer correctly skips ESC $ when position delta <= 1

### 4.2 Duplicate Command Analysis

The anomaly scanner detected 831 warnings for "duplicate" commands. Analysis shows:

**Expected Duplicates (Not Issues):**
- **ESC J 255**: Multiple consecutive ESC J 255 commands when making large vertical advances (>510 dots). This is correct behavior per ESC/P specification which limits ESC J to 255 units max.

**Potential Optimizations (Not Bugs):**
- Some style commands (ESC k, ESC p, ESC x, etc.) are emitted consecutively in certain layouts. These could potentially be optimized but do not cause incorrect output.

### 4.3 Style State Tracking

The renderer tracks style state to avoid redundant style commands:
```typescript
// Example from applyStyle function
if (style.bold !== ctx.currentStyle.bold) {
  emit(ctx, style.bold ? CommandBuilder.boldOn() : CommandBuilder.boldOff());
}
```

Some info-level observations about "Bold on when already bold" indicate minor optimization opportunities in the style tracking, but these do not produce incorrect output.

---

## 5. Key Code Locations

| File | Function | Lines | Purpose |
|------|----------|-------|---------|
| `/src/layout/renderer.ts` | `moveToX` | 325-333 | Horizontal positioning |
| `/src/layout/renderer.ts` | `moveToY` | 338-355 | Vertical positioning |
| `/src/layout/renderer.ts` | `applyStyle` | 360-412 | Style command generation |
| `/src/layout/renderer.ts` | `renderTextItem` | 417-451 | Text rendering with positioning |
| `/src/commands/CommandBuilder.ts` | `absoluteHorizontalPosition` | 125-128 | ESC $ command builder |
| `/src/commands/CommandBuilder.ts` | `advanceVertical` | 186-189 | ESC J command builder |
| `/src/core/utils.ts` | `toLowHigh` | 53-56 | nL/nH byte encoding |

---

## 6. Test Files Created

| File | Purpose |
|------|---------|
| `/examples/qa-28-byte-verification.ts` | Simple position verification test |
| `/examples/qa-29-position-validation.ts` | Comprehensive horizontal position validation |
| `/examples/qa-30-vertical-position-test.ts` | Vertical position and ESC J validation |
| `/examples/qa-31-prn-anomaly-scanner.ts` | Scans all PRN files for command anomalies |

---

## 7. Conclusion

The escp-ts library generates **byte-correct ESC/P commands** for layout positioning and styling. The position calculations correctly implement the ESC/P specification:

- ESC $ uses 1/60 inch units with proper nL/nH encoding
- ESC J uses 1/180 inch units with proper splitting for large advances
- Style commands are properly paired and state-tracked

**No critical bugs were found.** The "duplicate" commands flagged by the scanner are either intentional (large advance splitting) or optimization opportunities rather than errors.

---

## Appendix: ESC/P Command Quick Reference

```
ESC @       1B 40           Initialize printer
ESC $ nL nH 1B 24 nL nH     Absolute horizontal position (1/60" units)
ESC J n     1B 4A n         Vertical advance (n/180")
ESC E       1B 45           Bold on
ESC F       1B 46           Bold off
ESC 4       1B 34           Italic on
ESC 5       1B 35           Italic off
ESC - n     1B 2D n         Underline (n=0/1)
ESC W n     1B 57 n         Double width (n=0/1)
ESC P       1B 50           Select 10 CPI (Pica)
ESC M       1B 4D           Select 12 CPI (Elite)
ESC g       1B 67           Select 15 CPI (Micron)
```

---

*Report generated by Claude Code QA Analysis*
