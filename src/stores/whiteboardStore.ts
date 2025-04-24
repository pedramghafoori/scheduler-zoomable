import { create } from "zustand";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

interface WhiteboardState {
  instanceRef: ReactZoomPanPinchRef | null;
  setInstanceRef: (ref: ReactZoomPanPinchRef | null) => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  instanceRef: null,
  setInstanceRef: (ref) => set({ instanceRef: ref }),
})); 