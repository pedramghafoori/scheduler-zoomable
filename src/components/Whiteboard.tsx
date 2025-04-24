import { useRef, useState } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDraggable } from '@dnd-kit/core';
import ZoomablePoolCanvas from "./ZoomablePoolCanvas";
import { Pool } from "@/lib/types";

const WHITEBOARD_WIDTH = 3000;
const WHITEBOARD_HEIGHT = 2000;
const DAY_COLUMN_WIDTH = 200;
const HOUR_LABEL_WIDTH = 60;
const DAY_COLUMN_START = HOUR_LABEL_WIDTH;

const Whiteboard = () => {
  const { pools } = useScheduleStore();
  const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);

  return (
    <div className="flex-1 overflow-hidden bg-gray-100">
      <TransformWrapper
        ref={transformComponentRef}
        initialScale={1}
        minScale={0.1}
        maxScale={3}
        limitToBounds={false} // Allow panning beyond initial bounds
        wheel={{ step: 0.1 }}
        panning={{ velocityDisabled: true }} // Smoother panning
      >
        {({ zoomIn, zoomOut, resetTransform, centerView }) => (
          <>
            {/* Controls - kept for convenience */}
            <div className="absolute top-2 right-2 z-20 flex space-x-2 bg-white p-1 rounded shadow">
              <button onClick={() => zoomIn()} className="p-1">+</button>
              <button onClick={() => zoomOut()} className="p-1">-</button>
              <button onClick={() => resetTransform()} className="p-1">Reset</button>
            </div>
            
            <TransformComponent 
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ 
                width: `${WHITEBOARD_WIDTH}px`, 
                height: `${WHITEBOARD_HEIGHT}px`,
                background: `radial-gradient(circle, #e0e0e0 1px, transparent 1px)`, // Dot grid
                backgroundSize: `20px 20px`
              }}
            >
              {pools.map((pool) => (
                <DraggablePoolCanvas key={pool.id} pool={pool} transformRef={transformComponentRef} />
              ))}
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

interface DraggablePoolCanvasProps {
  pool: Pool;
  transformRef: React.RefObject<ReactZoomPanPinchRef | null>;
}

// Helper component to integrate dnd-kit with each pool canvas
const DraggablePoolCanvas = ({ pool, transformRef }: DraggablePoolCanvasProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: pool.id,
    data: { 
      type: 'pool-canvas', 
      pool: pool, 
      transformRef: transformRef 
    },
  });

  // --- Calculate Precise Dynamic Width --- 
  const preciseWidth = HOUR_LABEL_WIDTH + (pool.days.length * DAY_COLUMN_WIDTH);
  // Apply a minimum width only if NO days are selected, otherwise use precise width
  const finalWidth = pool.days.length > 0 ? preciseWidth : HOUR_LABEL_WIDTH + 50; // Min width = label + buffer
  // --- End Calculate Precise Dynamic Width --- 

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    position: 'absolute' as const,
    left: `${pool.x}px`,
    top: `${pool.y}px`,
    width: `${finalWidth}px`, // Use precise finalWidth
    zIndex: 10,
  } : {
    position: 'absolute' as const,
    left: `${pool.x}px`,
    top: `${pool.y}px`,
    width: `${finalWidth}px`, // Use precise finalWidth
    zIndex: 5,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ZoomablePoolCanvas 
        pool={pool} 
        dragAttributes={attributes} 
        dragListeners={listeners} 
        dynamicWidth={finalWidth} // Pass the calculated width
      />
    </div>
  );
}

export default Whiteboard; 