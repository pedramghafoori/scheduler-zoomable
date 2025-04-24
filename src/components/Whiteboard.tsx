import React, { useState, useRef } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import { useScheduleStore } from "@/stores/scheduleStore";
import DraggablePoolCanvas from './DraggablePoolCanvas'; // We will create this next
import { useDroppable } from '@dnd-kit/core';

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute top-2 right-2 z-10 flex space-x-1">
      <button onClick={() => zoomIn()} className="bg-gray-200 p-1 rounded text-sm">
        Zoom In
      </button>
      <button onClick={() => zoomOut()} className="bg-gray-200 p-1 rounded text-sm">
        Zoom Out
      </button>
      <button onClick={() => resetTransform()} className="bg-gray-200 p-1 rounded text-sm">
        Reset
      </button>
    </div>
  );
};

const Whiteboard = () => {
  const pools = useScheduleStore((state) => state.pools);

  const { setNodeRef, isOver } = useDroppable({
    id: 'whiteboard-droppable',
    data: { type: 'whiteboard' }
  });

  const whiteboardContentWidth = 3000;
  const whiteboardContentHeight = 2000;

  return (
    <div 
      ref={setNodeRef} 
      className="w-full h-full relative overflow-hidden"
      style={{
        backgroundColor: '#f0f0f0', // Light gray background
        backgroundImage: 
          `radial-gradient(#cccccc 1px, transparent 1px)`,
        backgroundSize: `20px 20px`, // Adjust spacing of dots
      }}
    >
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        minScale={0.2}
        limitToBounds={false} // Allow panning beyond initial view
        wheel={{ step: 0.1 }}
      >
        {({ instance, ...rest }) => (
          <React.Fragment>
            <Controls />
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{
                width: `${whiteboardContentWidth}px`, 
                height: `${whiteboardContentHeight}px`,
              }}
            >
              {pools.map((pool, index) => {
                // Use stored position or calculate default based on index
                const defaultX = (index % 3) * 850 + 50;
                const defaultY = Math.floor(index / 3) * 500 + 50;
                const left = pool.x ?? defaultX;
                const top = pool.y ?? defaultY;

                return (
                  <div 
                    key={pool.id} 
                    style={{
                       position: 'absolute',
                       left: `${left}px`, 
                       top: `${top}px`, 
                       width: '800px' // Keep example fixed width for now
                    }}
                  >
                    <DraggablePoolCanvas pool={pool} />
                  </div>
                );
              })}
              {/* Indicate drop zone */}
              {isOver && (
                <div className="absolute inset-0 bg-blue-100 opacity-50 pointer-events-none">Drop Here</div>
              )}
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </div>
  );
};

export default Whiteboard; 