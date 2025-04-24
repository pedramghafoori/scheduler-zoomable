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

  /** Begin dragging a session */
  startDrag: (session: Session) => void;

  /** Update the live pointer Y while dragging */
  movePointer: (y: number) => void;

  /** Update the whiteboard scale */
  updateScale: (scale: number) => void;

  /** Indicate pool drag started */
  startPoolDrag: () => void;

  /** Indicate pool drag ended */
  endPoolDrag: () => void;

  /** Finish the drag operation (drop or cancel) */
  endDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  dragSession: null,
  isDragging: false,
  pointerY: null,
  whiteboardScale: 1, // Default scale is 1
  isPoolDragging: false,

  startDrag: (session) =>
    set({
      dragSession: session,
      isDragging: true,
      pointerY: null,
    }),

  movePointer: (y) =>
    set({
      pointerY: y,
    }),

  updateScale: (scale) => set({ whiteboardScale: scale }),

  startPoolDrag: () => set({ isPoolDragging: true }),

  endPoolDrag: () => set({ isPoolDragging: false }),

  endDrag: () =>
    set({
      dragSession: null,
      isDragging: false,
      pointerY: null,
      isPoolDragging: false, // Also reset here
    }),
}));