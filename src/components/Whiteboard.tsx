import React, { useState, useRef, useEffect } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
  ReactZoomPanPinchRef,
  StateType
} from "react-zoom-pan-pinch";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDragStore } from "@/stores/dragStore";
import DraggablePoolCanvas from './DraggablePoolCanvas'; // We will create this next
import { useDroppable } from '@dnd-kit/core';
import MiniMap from './MiniMap';
import { useWhiteboardStore } from "@/stores/whiteboardStore";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const instanceRef = useWhiteboardStore((state) => state.instanceRef);
  const whiteboardContentWidth = 20000;
  const whiteboardContentHeight = 20000;
  const APP_HEADER_HEIGHT = 112; // Need header height for viewport calculation

  const handleReset = () => {
    if (instanceRef) {
      const targetScale = 1;
      const targetX = whiteboardContentWidth / 2;
      const targetY = whiteboardContentHeight / 2;

      // Calculate viewport center
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight - APP_HEADER_HEIGHT;
      const viewportCenterX = viewportWidth / 2;
      const viewportCenterY = viewportHeight / 2;

      // Calculate target transform to center the point
      const targetPositionX = viewportCenterX - (targetX * targetScale);
      const targetPositionY = viewportCenterY - (targetY * targetScale);

      // Set transform to center the middle point at scale 1
      instanceRef.setTransform(targetPositionX, targetPositionY, targetScale, 600, 'easeOutQuad');
    } else {
      resetTransform();
    }
  };

  return (
    <div className="absolute top-14 right-2 z-50 flex space-x-1">
      <button onClick={() => zoomIn()} className="bg-gray-200 hover:bg-gray-300 p-1 rounded text-sm shadow">
        Zoom In
      </button>
      <button onClick={() => zoomOut()} className="bg-gray-200 hover:bg-gray-300 p-1 rounded text-sm shadow">
        Zoom Out
      </button>
      <button onClick={handleReset} className="bg-gray-200 hover:bg-gray-300 p-1 rounded text-sm shadow">
        Reset
      </button>
    </div>
  );
};

const Whiteboard = () => {
  const pools = useScheduleStore((state) => state.pools);
  const { updateScale, isPoolDragging } = useDragStore((state) => ({
    updateScale: state.updateScale,
    isPoolDragging: state.isPoolDragging,
  }));
  const { setInstanceRef, setTransformState } = useWhiteboardStore((state) => ({
    setInstanceRef: state.setInstanceRef,
    setTransformState: state.setTransformState,
  }));
  const transformWrapperRef = useRef<ReactZoomPanPinchRef | null>(null);
  const instanceRef = useWhiteboardStore((state) => state.instanceRef);

  const { setNodeRef, isOver } = useDroppable({
    id: 'whiteboard-droppable',
    data: { type: 'whiteboard' }
  });

  const whiteboardContentWidth = 20000;
  const whiteboardContentHeight = 20000;
  const miniMapSize = 150;
  const APP_HEADER_HEIGHT = 112; // Define header height here

  useEffect(() => {
    if (transformWrapperRef.current) {
      setInstanceRef(transformWrapperRef.current);
    }
    return () => setInstanceRef(null);
  }, [setInstanceRef]);

  // Effect to center view on mount
  useEffect(() => {
    // Define the centering function (could be extracted)
    const centerOnLoad = () => {
      if (instanceRef) {
        const targetScale = 1;
        const targetX = whiteboardContentWidth / 2;
        const targetY = whiteboardContentHeight / 2;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight - APP_HEADER_HEIGHT; // Now accessible
        const viewportCenterX = viewportWidth / 2;
        const viewportCenterY = viewportHeight / 2;
        const targetPositionX = viewportCenterX - (targetX * targetScale);
        const targetPositionY = viewportCenterY - (targetY * targetScale);

        console.log("Centering on load...");
        // Set transform immediately (0 animation time)
        instanceRef.setTransform(targetPositionX, targetPositionY, targetScale, 0);
      } else {
        // Instance ref might not be ready immediately on mount
        // Retry after a short delay
        console.log("Instance ref not ready on mount, retrying centering...");
        setTimeout(centerOnLoad, 100); // Retry after 100ms
      }
    };

    centerOnLoad(); // Initial attempt

  }, [instanceRef]); // Re-run if instanceRef changes (e.g., becomes available)

  return (
    <div 
      ref={setNodeRef} 
      className="w-full h-full relative overflow-hidden"
      style={{
        backgroundColor: '#f0f0f0', 
        backgroundImage: 
          `radial-gradient(#cccccc 1px, transparent 1px)`,
        backgroundSize: `20px 20px`, 
      }}
    >
      <TransformWrapper
        ref={transformWrapperRef}
        initialScale={1}
        centerOnInit={true}
        minScale={0.2}
        limitToBounds={false}
        wheel={{ step: 0.1, disabled: isPoolDragging }}
        panning={{ disabled: isPoolDragging }}
        pinch={{ disabled: isPoolDragging }}
        doubleClick={{ disabled: isPoolDragging }}
        onTransformed={(ref, state) => {
          if (!isPoolDragging) {
            setTransformState(state);
            updateScale(state.scale);
          }
        }}
      >
        <React.Fragment>
          <Controls />
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{
              width: `${whiteboardContentWidth}px`, 
              height: `${whiteboardContentHeight}px`,
              backgroundColor: '#f0f0f0',
              backgroundImage:
                `radial-gradient(#cccccc 1px, transparent 1px)`,
              backgroundSize: `20px 20px`,
            }}
          >
            {pools.map((pool, index) => {
              const defaultX = (index % 3) * 850 + 50;
              const defaultY = Math.floor(index / 3) * 500 + 50;
              const left = pool.x ?? defaultX;
              const top = pool.y ?? defaultY;

              return (
                <div 
                  key={pool.id} 
                  id={`pool-wrapper-${pool.id}`}
                  style={{
                     position: 'absolute',
                     left: `${left}px`, 
                     top: `${top}px`,
                  }}
                >
                  <DraggablePoolCanvas pool={pool} />
                </div>
              );
            })}
            {isOver && (
              <div className="absolute inset-0 bg-blue-100 opacity-50 pointer-events-none">Drop Here</div>
            )}
          </TransformComponent>
        </React.Fragment>
      </TransformWrapper>
      
      <MiniMapWrapper />
    </div>
  );
};

// Helper component to access store state for MiniMap props
const MiniMapWrapper = () => {
  const pools = useScheduleStore((state) => state.pools);
  const transformState = useWhiteboardStore((state) => state.transformState);
  const whiteboardContentWidth = 20000;
  const whiteboardContentHeight = 20000;
  const miniMapSize = 150;

  if (!transformState) return null;

  return (
    <MiniMap 
      pools={pools}
      transformState={transformState}
      whiteboardWidth={whiteboardContentWidth}
      whiteboardHeight={whiteboardContentHeight}
      miniMapSize={miniMapSize}
    />
  );
}

export default Whiteboard; 