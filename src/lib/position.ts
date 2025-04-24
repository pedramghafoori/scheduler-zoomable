import { GRID_START_HOUR } from "@/lib/constants";
import { snapToGrid } from "@/lib/utils";

/** Convert absolute clientY + columnTop → snapped start-minutes */
export function clientYToMinutes(relY: number): number {
  const snapped = snapToGrid(relY);      // 15-min snapping
  return GRID_START_HOUR * 60 + snapped;
}