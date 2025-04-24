import React from 'react';
import { useScheduleStore } from "@/stores/scheduleStore";
import { useWhiteboardStore } from "@/stores/whiteboardStore";
import { useDragStore } from "@/stores/dragStore";
import { Button } from "@/components/ui/button";
import AddPoolModal from "@/components/AddPoolModal";
import { Pool } from '@/lib/types'; // Import Pool type

// Constants (should match those used in Pool/Canvas components)
const DAY_COLUMN_WIDTH = 200;
const HOUR_LABEL_WIDTH = 60;
const GRID_HOUR_HEIGHT = 60;
const POOL_HEADER_HEIGHT_APPROX = 40;
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 18;
const APP_HEADER_HEIGHT = 112; // Combined height of fixed headers in Layout.tsx

const calculatePoolDimensions = (pool: Pool) => {
  // Width calculation (matching DraggablePoolCanvas)
  const width = HOUR_LABEL_WIDTH + (pool.days.length * DAY_COLUMN_WIDTH);
  const minWidth = HOUR_LABEL_WIDTH + 50;
  const finalWidth = pool.days.length > 0 ? width : minWidth;
  
  // Height calculation (matching ZoomablePoolCanvas)
  const startHour = pool.startHour ?? DEFAULT_START_HOUR;
  const endHour = pool.endHour ?? DEFAULT_END_HOUR;
  const hoursToShow = Math.max(1, endHour - startHour);
  const stageContentHeight = hoursToShow * GRID_HOUR_HEIGHT;
  const finalHeight = stageContentHeight + POOL_HEADER_HEIGHT_APPROX;
  
  return { width: finalWidth, height: finalHeight };
};

const PoolNavigator = () => {
  const pools = useScheduleStore((state) => state.pools);
  const instanceRef = useWhiteboardStore((state) => state.instanceRef);
  const whiteboardScale = useDragStore((state) => state.whiteboardScale);

  const navigateToPool = (poolId: string) => {
    const instance = instanceRef; 
    const pool = pools.find(p => p.id === poolId); // Find pool data

    if (!instance || !pool) {
      console.warn("Cannot navigate: Missing instance or pool data.", { instance, pool });
      return;
    }
    
    // 1. Calculate Pool Dimensions
    const { width: poolWidth, height: poolHeight } = calculatePoolDimensions(pool);
    
    // 2. Calculate Pool Center (use defaults for position if needed)
    const poolX = pool.x ?? 0;
    const poolY = pool.y ?? 0;
    const poolCenterX = poolX + poolWidth / 2;
    const poolCenterY = poolY + poolHeight / 2;

    // 3. Calculate Viewport Center
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - APP_HEADER_HEIGHT;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2; // Adjusting for headers implicitly
    
    // 4. Calculate Target Transform
    const currentScale = whiteboardScale;
    const targetPositionX = viewportCenterX - (poolCenterX * currentScale);
    const targetPositionY = viewportCenterY - (poolCenterY * currentScale);

    console.log(`Navigating to pool ${poolId} [${poolCenterX}, ${poolCenterY}]`);
    console.log(`Viewport center [${viewportCenterX}, ${viewportCenterY}]`);
    console.log(`Target transform [${targetPositionX}, ${targetPositionY}], scale ${currentScale}`);

    // 5. Call setTransform
    instance.setTransform(targetPositionX, targetPositionY, currentScale, 600, 'easeOutQuad'); 
  };

  return (
    <div 
      className={`absolute top-[calc(theme(spacing.32)+(100vh-theme(spacing.32)-theme(spacing.8))/2+theme(spacing.6))] left-4 z-10 w-64 h-[calc((100vh-theme(spacing.32)-theme(spacing.8))/2-theme(spacing.2))] border bg-white rounded-lg shadow-md flex flex-col overflow-hidden`}
    >
      {/* Header with Title */}
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="font-bold text-lg">Pools</h2>
      </div>
      
      {/* Pool List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2"> 
        {pools.length === 0 && (
          <p className="text-sm text-gray-500 italic">No pools created yet.</p>
        )}
        {pools.map((pool) => (
          <Button 
            key={pool.id}
            variant="outline"
            size="sm"
            className="w-full justify-start truncate"
            onClick={() => navigateToPool(pool.id)}
            title={`Go to ${pool.title}`}
          >
            {pool.title}
          </Button>
        ))}
      </div>

      {/* Footer with Add Pool Button */}
      <div className="p-4 border-t flex-shrink-0">
        <AddPoolModal />
      </div>
    </div>
  );
};

export default PoolNavigator;
