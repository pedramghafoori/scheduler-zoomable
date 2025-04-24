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

  const whiteboardContentWidth = 20000;
  const whiteboardContentHeight = 20000;

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
        initialScale={1}
        centerOnInit={true}
        minScale={0.2}
        limitToBounds={false}
        wheel={{ step: 0.1 }}
      >
        {({ instance, ...rest }) => {
          if (instance) {
            console.log("Current Zoom Scale:", instance.transformState.scale);
          }
          
          return (
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
                      style={{
                         position: 'absolute',
                         left: `${left}px`, 
                         top: `${top}px`, 
                         width: '800px'
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
          );
        }}
      </TransformWrapper>
    </div>
  );
};

export default Whiteboard; 