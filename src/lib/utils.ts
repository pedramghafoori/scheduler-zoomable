import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { GRID_START_HOUR } from "./constants";

/** Merge Tailwind + clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Minutes → "HH:MM" */
export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

/** Choose white/black text based on luminance */
export const getContrastText = (hexColor: string): string => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

/** Minutes since GRID_START_HOUR → y-pos (1 min === 1 px) */
export const timeToYPos = (minutes: number): number =>
  minutes - GRID_START_HOUR * 60;

/** y-pos → absolute minutes */
export const yPosToTime = (yPos: number): number =>
  GRID_START_HOUR * 60 + Math.max(0, yPos);

/** Floor‑snap to 15‑minute grid */
export const snapToGrid = (minutes: number): number =>
  Math.floor(minutes / 15) * 15;

/** Transparent 1×1 gif for custom drag ghost */
export const createDragImage = (): HTMLImageElement => {
  const img = new Image();
  img.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  return img;
};

/** Remaining unscheduled hours for a course */
export const getRemainingHours = (
  totalHours: number,
  scheduledMinutes: number
): number => Math.max(0, totalHours - scheduledMinutes / 60);
