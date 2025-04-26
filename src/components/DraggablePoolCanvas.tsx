import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import ZoomablePoolCanvas from './ZoomablePoolCanvas';
import { Pool } from '@/lib/types';
import { DraggableSyntheticListeners } from '@dnd-kit/core';
import { useDragStore } from "@/stores/dragStore";

// Constants
const DAY_COLUMN_WIDTH = 200;
const HOUR_LABEL_WIDTH = 60;
// Remove unused dimension constants
// const DEFAULT_POOL_WIDTH = 800; 
// const DEFAULT_POOL_HEIGHT = 430;
// const MIN_POOL_WIDTH = 200;
// const MIN_POOL_HEIGHT = 200;

interface DraggablePoolCanvasProps {
  pool: Pool;
}

const DraggablePoolCanvas = ({ pool }: DraggablePoolCanvasProps) => {
  const whiteboardScale = useDragStore((state) => state.whiteboardScale);

  // Draggable hook for the main pool movement
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({
    id: `pool-${pool.id}`,
    data: {
      type: 'poolCanvas',
      poolId: pool.id,
    },
  });

  // Remove resize draggable hook
  /*
  const { attributes: resizeAttributes, listeners: resizeListeners, setNodeRef: resizeNodeRef, isDragging: isResizing } = useDraggable({
    id: `pool-resize-${pool.id}`,
    data: {
      type: 'poolResizeHandle',
      poolId: pool.id,
    },
  });
  */

  // Determine width based on days (height is now handled internally by ZoomablePoolCanvas)
  const currentWidth = HOUR_LABEL_WIDTH + (pool.days.length * DAY_COLUMN_WIDTH);
  const minWidth = HOUR_LABEL_WIDTH + 50; // Keep min width fallback
  const finalWidth = pool.days.length > 0 ? currentWidth : minWidth;

  // Style for the main container
  const style: React.CSSProperties = transform ? {
    // Apply the raw dnd-kit transform directly
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    width: `${finalWidth}px`,
    zIndex: isDragging ? 20 : 10,
    position: 'relative',
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : undefined,
  } : {
    width: `${finalWidth}px`,
    zIndex: 10,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col"> 
      <ZoomablePoolCanvas
        pool={pool}
        dynamicWidth={finalWidth} // Pass width
        // containerHeight prop is removed
        dragListeners={listeners}
        dragAttributes={attributes}
      />
      {/* Remove Resize Handle */}
      {/* 
      <div
        ref={resizeNodeRef}
        {...resizeListeners}
        {...resizeAttributes}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nwse-resize rounded-tl-lg z-20 hover:bg-blue-700 transition-colors"
        title="Resize Pool"
        style={{ opacity: isResizing ? 0.7 : 1 }}
      >
      </div>
      */}
    </div>
  );
};

export default DraggablePoolCanvas;