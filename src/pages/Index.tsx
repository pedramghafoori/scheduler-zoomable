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
  const { createSession, updatePoolPosition, getPool } = useScheduleStore((state) => ({
    createSession: state.createSession,
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

    const activeType = active.data.current?.type;

    // --- Pool Movement Logic --- 
    if (activeType === 'poolCanvas') {
      const poolId = active.data.current.poolId as string;
      const draggedPool = getPool(poolId); 

      if (draggedPool) {
        const adjustedDeltaX = delta.x / whiteboardScale;
        const adjustedDeltaY = delta.y / whiteboardScale;

        const newX = (draggedPool.x ?? 0) + adjustedDeltaX;
        const newY = (draggedPool.y ?? 0) + adjustedDeltaY;
        
        console.log(`Updating position for pool ${poolId} to x: ${newX}, y: ${newY} (scale: ${whiteboardScale})`);
        updatePoolPosition(poolId, newX, newY);
      } else {
          console.warn(`Could not find dragged pool with ID: ${poolId}`);
      }
    }
    // --- Course Dragging Logic --- 
    else if (activeType === 'course' && active.data.current?.from === 'bank') {
      if (!over) {
         console.log("Dropped course into empty space");
         return; 
      }
      
      const course = active.data.current.course as Course;
      const overId = over.id.toString();
      
      // Check if dropped onto a valid pool day column
      if (overId.startsWith('pool-') && overId.includes('-day-')) {
        const parts = overId.split('-day-');
        const poolId = parts[0].replace('pool-',''); // Extract pool ID
        const day = parts[1] as DayOfWeek;
        
        // Approximate drop position calculation (may need refinement based on Konva structure)
        let droppedY = 0;
        const activeRect = active.rect.current?.translated;
        const overRect = over.rect;

        if (activeRect && overRect) {
            // This calculation might be overly simplistic depending on how Konva reports coordinates
            // It assumes overRect.top is the top of the drop zone relative to viewport
            // and activeRect.top is the top of the dragged item relative to viewport
            // We need the drop position *relative* to the Konva stage/layer origin
            // This needs access to the Konva stage container's position/scroll or more context.
            // For now, using a simplified approach based on delta - NEEDS REVIEW/TESTING
           
            // Placeholder: Use delta.y for now, assuming drop is relative to start pos
            // This is likely WRONG if the drop target (over) is scrolled within its container
            // A more robust solution involves getting coordinates relative to the Konva stage. 
            console.warn("Drop Y calculation using delta.y - may be inaccurate with scrolling.");
            droppedY = delta.y; // Simplified - LIKELY INCORRECT

            // Attempt using translated rects if available (still might be viewport relative)
             const activeTop = activeRect.top;
             // over.rect might not have translated. Need coordinates relative to whiteboard
             const overTop = overRect.top; // This might be viewport top
             console.log("Drop debug:", { activeTop, overTop, deltaY: delta.y });
             droppedY = (activeTop ?? 0) + delta.y - (overTop ?? 0); // Example using potentially viewport-relative coords
             console.log("Calculated droppedY (viewport relative?):", droppedY);
        } else {
            console.warn("Could not get translated rect tops for drop calculation.");
            droppedY = delta.y; // Fallback - LIKELY INCORRECT
        }
        
        // TODO: Refine droppedY calculation to be relative to the Konva stage/timeline start
        // This likely involves getting the drop event coordinates relative to the Stage container
        // and potentially adjusting for the stage's offsetY (startHour).
        const startMinutes = Math.max(0, Math.min(1440 - 60, Math.round(droppedY / HOUR_HEIGHT) * 30)); // Snap to 30 min?
        const endMinutes = startMinutes + 60; 

        console.log(`Attempting to create session for ${course.title} in ${poolId} on ${day} at ${startMinutes}`);
        
        // createSession(course.id, poolId, day, startMinutes, endMinutes);
        console.log("Session creation temporarily disabled pending Y calculation fix.");

      } else {
        console.log("Dropped course onto non-day target or whiteboard background:", overId);
      }
    }
    // --- Unhandled --- 
    else {
        console.log("Unhandled drag end type:", activeType);
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
