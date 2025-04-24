import { create } from "zustand";
import { ReactZoomPanPinchRef, StateType } from "react-zoom-pan-pinch";

interface WhiteboardState {
  instanceRef: ReactZoomPanPinchRef | null;
  transformState: StateType | null;
  setInstanceRef: (ref: ReactZoomPanPinchRef | null) => void;
  setTransformState: (state: StateType | null) => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  instanceRef: null,
  transformState: null,
  setInstanceRef: (ref) => set({ instanceRef: ref }),
  setTransformState: (state) => set({ transformState: state }),
})); 