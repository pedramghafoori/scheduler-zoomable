import { GRID_START_HOUR } from "@/lib/constants";
import { snapToGrid } from "@/lib/utils";

/** Convert absolute clientY + columnTop → snapped start-minutes */
export function clientYToMinutes(relY: number, scale: number = 1): number {
  const scaledY = relY / scale;  // Account for zoom level
  const snapped = snapToGrid(scaledY);      // 15-min snapping
  return GRID_START_HOUR * 60 + snapped;
}