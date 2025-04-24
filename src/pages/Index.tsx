import Layout from "@/components/Layout";
import CourseBank from "@/components/CourseBank";
import PoolNavigator from "@/components/PoolNavigator";
import AddPoolModal from "@/components/AddPoolModal";
import Whiteboard from "@/components/Whiteboard";
import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDragStore } from "@/stores/dragStore";
import { Course, DayOfWeek } from "@/lib/types";
import { HOUR_HEIGHT } from "@/lib/constants";
import { useRef } from "react";

const Index = () => {
  const { createSession, pools, updatePoolPosition, getPool } = useScheduleStore((state) => ({
    createSession: state.createSession,
    pools: state.pools,
    updatePoolPosition: state.updatePoolPosition,
    getPool: state.getPool,
  }));
  const { whiteboardScale, startPoolDrag, endPoolDrag } = useDragStore((state) => ({ 
    whiteboardScale: state.whiteboardScale,
    startPoolDrag: state.startPoolDrag,
    endPoolDrag: state.endPoolDrag,
  }));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const whiteboardContainerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log("Drag started:", { active });
    if (active.data.current?.type === 'poolCanvas') {
      startPoolDrag();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    console.log("Drag ended:", { active, over, delta, whiteboardScale });

    if (active?.data.current?.type === 'poolCanvas') {
       endPoolDrag();
    }

    if (!active) {
      console.log("Drag cancelled or invalid active element");
      return;
    }

    // --- Pool Movement Logic --- 
    if (active.data.current?.type === 'poolCanvas') {
      const poolId = active.data.current.poolId as string;
      const draggedPool = getPool(poolId); // Use getPool

      if (draggedPool) {
        const adjustedDeltaX = delta.x / whiteboardScale;
        const adjustedDeltaY = delta.y / whiteboardScale;

        const newX = (draggedPool.x ?? 0) + adjustedDeltaX;
        const newY = (draggedPool.y ?? 0) + adjustedDeltaY;
        
        // Note: Position update happens *after* drag end
        console.log(`Updating position for pool ${poolId} to x: ${newX}, y: ${newY} (scale: ${whiteboardScale})`);
        updatePoolPosition(poolId, newX, newY);
      } else {
          console.warn(`Could not find dragged pool with ID: ${poolId}`);
      }
    }
    // --- Course Dragging Logic --- 
    else if (active.data.current?.type === 'course' && active.data.current?.from === 'bank') {
      if (!over) {
         console.log("Dropped course into empty space");
         return;
      }
      const course = active.data.current.course as Course;
      const overId = over.id.toString();
      if (overId.startsWith('pool-') && overId.includes('-day-')) {
        const parts = overId.split('-day-');
        const poolId = parts[0];
        const day = parts[1] as DayOfWeek;
        let droppedY = 0;
        const activeTop = active.rect.current?.translated?.top;
        const overTop = over.rect.current?.translated?.top;

        if (activeTop !== undefined && overTop !== undefined) {
           droppedY = activeTop - overTop + delta.y; 
           console.log("Calculated droppedY (approx):", droppedY);
        } else {
            console.warn("Could not get translated rect tops for drop calculation.");
        }

        const startMinutes = Math.max(0, Math.min(1440 - 60, Math.round(droppedY / HOUR_HEIGHT) * HOUR_HEIGHT));
        const endMinutes = startMinutes + 60; 

        console.log(`Attempting to create session for ${course.title} in ${poolId} on ${day} at ${startMinutes}`);
        
        createSession(course.id, poolId, day, startMinutes, endMinutes);
        
      } else {
        console.log("Dropped course onto non-day target or whiteboard background");
      }
    }
    // --- Unhandled --- 
    else {
        console.log("Unhandled drag end type:", active.data.current?.type);
    }
  };

  return (
    <Layout>
      <DndContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd} 
        collisionDetection={closestCenter}
      >
        <CourseBank />
        <PoolNavigator />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <Whiteboard />
          </div>
        </div>
      </DndContext>
    </Layout>
  );
};

export default Index;
