import Layout from "@/components/Layout";
import CourseBank from "@/components/CourseBank";
import PoolNavigator from "@/components/PoolNavigator";
import CourseBlock from "@/components/CourseBlock";
import AddPoolModal from "@/components/AddPoolModal";
import Whiteboard from "@/components/Whiteboard";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, CollisionDetection, pointerWithin, rectIntersection, DroppableContainer, Active } from '@dnd-kit/core';
import type { ClientRect } from '@dnd-kit/core';
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDragStore } from "@/stores/dragStore";
import { Course, DayOfWeek } from "@/lib/types";
import { HOUR_HEIGHT } from "@/lib/constants";
import { useRef, useState } from "react";

/**
 * IMPORTANT: This custom collision detection is crucial for correct course block positioning
 * 
 * Why this is necessary:
 * 1. Course blocks need to snap precisely to 15-minute intervals
 * 2. The position where a course starts should be determined by the center of its top edge, not its corner
 * 3. Using center-point or full-rectangle collision would cause positioning errors due to varying block heights
 * 
 * How it works:
 * - Creates a thin rectangle at the center of the top edge of the dragged course block
 * - Only detects collisions with this thin centered line
 * - Ensures the highlighted drop zone exactly matches where the course will start
 * 
 * DO NOT MODIFY OR REPLACE THIS WITH OTHER COLLISION DETECTION STRATEGIES
 * Using other methods (like closestCenter or pointerWithin) will break the precise interval snapping
 */
const topEdgeCollision: CollisionDetection = ({
  active,
  collisionRect,
  droppableRects,
  droppableContainers,
}) => {
  if (!collisionRect) return [];

  // Create a thin rectangle at the center of the top edge
  const centerX = collisionRect.left + (collisionRect.width / 2);
  const topEdgeRect: ClientRect = {
    left: centerX - 1, // 2px wide centered line
    right: centerX + 1,
    top: collisionRect.top,
    bottom: collisionRect.top + 1, // 1px tall
    width: 2,
    height: 1
  };

  // Find intersecting droppables using the centered top edge
  return droppableContainers
    .filter((container) => {
      const rect = droppableRects.get(container.id);
      if (!rect) return false;
      
      // Check if the centered top edge intersects with this droppable
      return (
        topEdgeRect.left < rect.right &&
        topEdgeRect.right > rect.left &&
        topEdgeRect.top < rect.bottom &&
        topEdgeRect.bottom > rect.top
      );
    })
    .map((container) => ({
      id: container.id,
      data: { droppableContainer: container },
    }));
};

const Index = () => {
  const { createSession, updatePoolPosition, getPool, updateSession } = useScheduleStore((state) => ({
    createSession: state.createSession,
    updatePoolPosition: state.updatePoolPosition,
    getPool: state.getPool,
    updateSession: state.updateSession,
  }));
  const { whiteboardScale, startDragOperation, endDragOperation } = useDragStore((state) => ({ 
    whiteboardScale: state.whiteboardScale,
    startDragOperation: state.startDragOperation,
    endDragOperation: state.endDragOperation,
  }));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const whiteboardContainerRef = useRef<HTMLDivElement>(null);
  const [activeDragItem, setActiveDragItem] = useState<any | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    try {
      const { active } = event;
      setActiveDragItem(active);
      
      if (active.data.current?.type === 'poolCanvas') {
        startDragOperation(null, true); // Start pool drag
      } else {
        startDragOperation(); // Start regular drag
      }
      
      console.log("Drag started:", { active });
    } catch (error) {
      console.error("Error in drag start:", error);
      endDragOperation();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    try {
      const { active, over, delta } = event;
      
      console.log("=== Drag End Debug ===");
      console.log("Active item:", active);
      console.log("Over target:", over);

      if (!active || !over) {
        console.log("No active or over target");
        return;
      }

      const { id: activeId, data: { current: activeData } } = active;
      const { id: overId, data: { current: overData } } = over;

      console.log("Active type:", activeData?.type, "Over type:", overData?.type);

      // Handle pool canvas dragging
      if (activeData?.type === 'poolCanvas') {
        const poolId = activeData.poolId;
        const pool = getPool(poolId);
        
        if (pool) {
          // Use delta to calculate the change in position
          const adjustedDeltaX = delta.x / whiteboardScale;
          const adjustedDeltaY = delta.y / whiteboardScale;
          
          // Add delta to current position
          const newX = (pool.x ?? 0) + adjustedDeltaX;
          const newY = (pool.y ?? 0) + adjustedDeltaY;
          
          console.log('Updating pool position:', {
            poolId,
            oldX: pool.x,
            oldY: pool.y,
            deltaX: adjustedDeltaX,
            deltaY: adjustedDeltaY,
            newX,
            newY
          });
          
          updatePoolPosition(poolId, newX, newY);
        }
      }

      // --- Move an existing grid course block within / between pools ---
      if (
        (activeData?.type === 'grid-course' || activeData?.type === 'bank-block') &&  // dragged item is a block on the grid or from bank
        overData?.type === 'pool-day-interval' &&             // dropped on a 15‑min interval cell
        (activeData.session || activeData.courseId)           // has either a session or courseId
      ) {
        const { poolId: newPoolId, day: newDay, startMinute } = overData;

        if (activeData.type === 'bank-block') {
          // Create new session for bank block
          createSession(
            activeData.courseId,
            newPoolId,
            newDay as DayOfWeek,
            startMinute,
            startMinute + 60 // Default 1 hour duration for new sessions
          );
          console.log("Created new session from bank block");
        } else if (activeData.session) {
          // Update existing session
          const duration = activeData.session.end - activeData.session.start;
          updateSession(activeData.session.id, {
            poolId: newPoolId,
            day: newDay as DayOfWeek,
            start: startMinute,
            end: startMinute + duration,
          });
          console.log("Updated existing session");
        }
      }
      // --- End grid‑course move block ---

      // Handle course dragging to whiteboard
      if (activeData?.type === 'bank-block' || activeData?.type === 'grid-course') {
        const course = activeData.course;
        const session = activeData.session;
        
        if (overId === 'whiteboard-droppable' && course) {
          const allPools = useScheduleStore.getState().pools;
          const dropX = over.rect.left ?? 0;
          const dropY = over.rect.top ?? 0;
          
          // Find closest pool
          let closestPool = null;
          let minDistance = Infinity;
          
          for (const pool of allPools) {
            const poolX = pool.x ?? 0;
            const poolY = pool.y ?? 0;
            const distance = Math.sqrt(
              Math.pow(dropX - poolX, 2) + 
              Math.pow(dropY - poolY, 2)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              closestPool = pool;
            }
          }
          
          if (closestPool) {
            const startHour = closestPool.startHour ?? 8;
            const dropPoint = over.rect.top ?? 0;
            const containerTop = (over.rect.top ?? 0) - (startHour * HOUR_HEIGHT);
            const minutesFromMidnight = Math.floor(((dropPoint - containerTop) / HOUR_HEIGHT) * 60);
            
            const startMinutes = Math.max(
              startHour * 60,
              Math.min(
                ((closestPool.endHour ?? 18) * 60) - 60,
                Math.round(minutesFromMidnight / 30) * 30
              )
            );
            
            if (activeData.type === 'bank-block') {
              createSession(course.id, closestPool.id, 'Monday', startMinutes, startMinutes + 60);
            } else if (activeData.type === 'grid-course' && session) {
              const duration = session.end - session.start;
              updateSession(session.id, {
                poolId: closestPool.id,
                day: 'Monday',
                start: startMinutes,
                end: startMinutes + duration
              });
            }
          }
        }
      }
      console.log("DragEnd handler complete");
    } catch (error) {
      console.error("Error in drag end:", error);
    } finally {
      setActiveDragItem(null);
      endDragOperation();
    }
  };

  return (
    <Layout>
      <DndContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd} 
        onDragCancel={() => {
          setActiveDragItem(null);
          endDragOperation();
        }}
        collisionDetection={topEdgeCollision}
      >
        <CourseBank />
        <PoolNavigator />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <Whiteboard />
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDragItem && (activeDragItem.data.current?.type === 'bank-block' || activeDragItem.data.current?.type === 'grid-course') && (
            <CourseBlock 
              courseId={activeDragItem.data.current.course?.id || activeDragItem.data.current.session?.courseId} 
              session={activeDragItem.data.current.session}
              isGrid={activeDragItem.data.current.type === 'grid-course'}
            />
          )}
        </DragOverlay>
      </DndContext>
    </Layout>
  );
};

export default Index;
