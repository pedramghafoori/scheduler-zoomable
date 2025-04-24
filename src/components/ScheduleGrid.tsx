import { useScheduleStore } from "@/stores/scheduleStore";
import { useDragStore } from "@/stores/dragStore";
import { DragEndEvent, DragStartEvent, DraggableAttributes } from "@dnd-kit/core";
import { DraggableSyntheticListeners } from '@dnd-kit/core';
import HourLabels from "./HourLabels";
import PoolCanvas, { PoolCanvasProps } from "./PoolCanvas";
import { DEFAULT_SESSION_DURATION } from "@/lib/constants";
import { createDragImage } from "@/lib/utils";
import { DayOfWeek, Pool } from "@/lib/types";
import { clientYToMinutes } from "@/lib/position";
import { DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

// Define props for the PoolWrapper children
interface PoolWrapperChildProps {
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
}

const PoolWrapper = ({ pool, children }: { pool: Pool, children: React.ReactElement<PoolCanvasProps & PoolWrapperChildProps> }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: pool.id,
    data: { type: "pool", pool }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div 
      ref={setNodeRef}
      className="relative"
      style={style}
    >
      {/* Removed handle div */}
      {/* Pass drag props to children */}
      {React.cloneElement(children, { dragAttributes: attributes, dragListeners: listeners })}
    </div>
  );
};

const DroppableSlot = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({
    id,
    data: { type: "pool-slot" }
  });

  return (
    <div ref={setNodeRef} className="w-full">
      {children}
    </div>
  );
};

const isPool = (obj: any): obj is Pool => {
  return obj && 
    typeof obj.title === 'string' && 
    typeof obj.location === 'string' && 
    Array.isArray(obj.days) &&
    typeof obj.id === 'string';
};

const ScheduleGrid = () => {
  const { pools, createSession, updateSession, deleteSession } = useScheduleStore();
  const { startDrag, endDrag, dragSession } = useDragStore();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { session, courseId, type } = active.data.current || {};
    
    console.log("Grid drag start:", { type, courseId, session });
    
    if (type === "bank-block" && courseId) {
      // Create a temporary session for dragging from bank
      const tempSession = {
        id: `temp-${courseId}-${Date.now()}`,
        courseId,
        poolId: "", // Empty string means it's in the bank
        day: "Monday" as DayOfWeek, // Default day
        start: 0,
        end: DEFAULT_SESSION_DURATION,
      };
      
      startDrag(tempSession); // Assume middle of the block (60px/2)
    } else if (type === "grid-block" && session) {
      startDrag(session);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log("Grid drag end:", { 
      activeId: active?.id,
      activeType: active?.data.current?.type,
      overId: over?.id,
      overType: over?.data.current?.type
    });
    
    if (!active || !over) {
      endDrag();
      return;
    }
    
    const dragData = active.data.current;

    // 1) Dropped onto the Course Bank → delete
    if (over.id === "course-bank" && dragData?.type === "grid-block") {
      const session = dragData.session;
      if (session?.id) {
        console.log("Deleting session:", session.id);
        deleteSession(session.id);
      }
      endDrag();
      return;
    }

    // 2) Dropped onto a pool/day column
    if (over.data.current?.type === "pool-day") {
      const { poolId, day } = over.data.current;
      // RectEntry from dnd‑kit always has `.current`, but TS may infer ClientRect.
      const { pointerY } = useDragStore.getState();   // ← live relative Y
      const start = clientYToMinutes(pointerY ?? 0);  // 1-arg helper

      if (dragData?.type === "bank-block") {
        console.log("Creating session from bank‑block");
        createSession(
          dragData.courseId,
          poolId,
          day,
          start,
          start + DEFAULT_SESSION_DURATION
        );
      } else if (dragData?.type === "grid-block") {
        const { session } = dragData;
        const duration = session.end - session.start;
        console.log("Moving grid‑block", { sessionId: session.id, start });
        updateSession(session.id, {
          poolId,
          day,
          start,
          end: start + duration,
        });
      }
      endDrag();
      return;
    }

    // 3) Any other drop target → just end
    endDrag();
  };

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex min-w-full">
        <div className="flex-1 min-w-0 flex flex-col">
          {pools.map((pool) => (
            <div key={pool.id} className="w-full rounded-lg shadow-sm mb-4 last:mb-0 p-5 border border-black">
              <DroppableSlot id={pool.id}>
                <PoolWrapper pool={pool}>
                  <PoolCanvas 
                    pool={pool}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                </PoolWrapper>
              </DroppableSlot>
            </div>
          ))}
        </div>
      </div>
      {dragSession && isPool(dragSession) && (
        <DragOverlay>
          <div className="opacity-50 bg-white">
            <PoolCanvas pool={dragSession} />
          </div>
        </DragOverlay>
      )}
    </div>
  );
};

export default ScheduleGrid;
