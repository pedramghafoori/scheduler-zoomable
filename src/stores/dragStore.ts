import { create } from "zustand";
import { Session } from "@/lib/types";

interface DragState {
  /** The session currently being dragged (null if none) */
  dragSession: Session | null;

  /** True while a drag operation is in progress */
  isDragging: boolean;

  /** Current Y-position of the cursor inside the column (px) */
  pointerY: number | null;

  /** Current zoom scale of the whiteboard */
  whiteboardScale: number;

  /** True if a pool canvas is currently being dragged */
  isPoolDragging: boolean;

  /** Start a drag operation with optional session */
  startDragOperation: (session?: Session) => void;

  /** End any ongoing drag operation */
  endDragOperation: () => void;

  /** Update the live pointer Y while dragging */
  movePointer: (y: number) => void;

  /** Update the whiteboard scale */
  updateScale: (scale: number) => void;

  /** Start pool dragging operation */
  startPoolDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  dragSession: null,
  isDragging: false,
  pointerY: null,
  whiteboardScale: 1,
  isPoolDragging: false,

  startDragOperation: (session = null) => set({
    dragSession: session,
    isDragging: true,
    pointerY: null,
  }),

  endDragOperation: () => set({
    dragSession: null,
    isDragging: false,
    pointerY: null,
    isPoolDragging: false,
  }),

  movePointer: (y) => set({
    pointerY: y,
  }),

  updateScale: (scale) => set({ 
    whiteboardScale: scale 
  }),

  startPoolDrag: () => set({ 
    isPoolDragging: true,
    isDragging: true,
  }),
}));