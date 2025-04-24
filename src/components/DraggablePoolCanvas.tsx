import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import ZoomablePoolCanvas from './ZoomablePoolCanvas'; // We will create this next
import { Pool } from '@/lib/types';
import { DraggableSyntheticListeners } from '@dnd-kit/core'; // Import this

// Constants from ZoomablePoolCanvas (or a shared constants file)
const DAY_COLUMN_WIDTH = 200;
const HOUR_LABEL_WIDTH = 60;

interface DraggablePoolCanvasProps {
  pool: Pool;
  // Add any other props needed by ZoomablePoolCanvas if DraggablePoolCanvas wraps it directly
  // Example: If pool position is handled by Whiteboard, it might not be needed here
}

const DraggablePoolCanvas = ({ pool }: DraggablePoolCanvasProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pool-${pool.id}`, // Unique draggable ID for the pool
    data: { // Data to identify this draggable item
      type: 'poolCanvas',
      poolId: pool.id,
    },
  });

  // Calculate width based on the number of *currently selected* days in the pool
  // This logic should match what ZoomablePoolCanvas expects/uses
  const dynamicWidth = HOUR_LABEL_WIDTH + (pool.days.length * DAY_COLUMN_WIDTH);
  const minWidth = HOUR_LABEL_WIDTH + 50; // Fallback minimum width if no days are selected
  const finalWidth = pool.days.length > 0 ? dynamicWidth : minWidth;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    // If pools are positioned absolutely by Whiteboard, we might not need left/top here
    // position: 'relative' as const, // Changed from absolute
    width: `${finalWidth}px`,
    zIndex: isDragging ? 20 : 10, // Increase z-index while dragging
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
  } : {
    // position: 'relative' as const,
    width: `${finalWidth}px`,
    zIndex: 10,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ZoomablePoolCanvas
        pool={pool}
        dynamicWidth={finalWidth}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
};

export default DraggablePoolCanvas; 