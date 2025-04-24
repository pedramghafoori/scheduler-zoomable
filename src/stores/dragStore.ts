import { create } from "zustand";
import { Session } from "@/lib/types";

interface DragState {
  /** The session currently being dragged (null if none) */
  dragSession: Session | null;

  /** True while a drag operation is in progress */
  isDragging: boolean;

  /** Current Y-position of the cursor inside the column (px) */
  pointerY: number | null;

  /** Begin dragging a session */
  startDrag: (session: Session) => void;

  /** Update the live pointer Y while dragging */
  movePointer: (y: number) => void;

  /** Finish the drag operation (drop or cancel) */
  endDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  dragSession: null,
  isDragging: false,
  pointerY: null,

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

  endDrag: () =>
    set({
      dragSession: null,
      isDragging: false,
      pointerY: null,
    }),
}));