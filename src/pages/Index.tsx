import Layout from "@/components/Layout";
import CourseBank from "@/components/CourseBank";
import PoolNavigator from "@/components/PoolNavigator";
import CourseBlock from "@/components/CourseBlock";
import AddPoolModal from "@/components/AddPoolModal";
import Whiteboard from "@/components/Whiteboard";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, pointerWithin } from '@dnd-kit/core';
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDragStore } from "@/stores/dragStore";
import { Course, DayOfWeek } from "@/lib/types";
import { HOUR_HEIGHT } from "@/lib/constants";
import { useRef, useState } from "react";

const Index = () => {
  const { createSession, updatePoolPosition, getPool, updateSession } = useScheduleStore((state) => ({
    createSession: state.createSession,
    updatePoolPosition: state.updatePoolPosition,
    getPool: state.getPool,
    updateSession: state.updateSession,
  }));
  const { whiteboardScale, startPoolDrag, endPoolDrag } = useDragStore((state) => ({ 
    whiteboardScale: state.whiteboardScale,
    startPoolDrag: state.startPoolDrag,
    endPoolDrag: state.endPoolDrag,
  }));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const whiteboardContainerRef = useRef<HTMLDivElement>(null);
  const [activeDragItem, setActiveDragItem] = useState<any | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDragItem(active);
    console.log("Drag started:", { active });
    if (active.data.current?.type === 'poolCanvas') {
      startPoolDrag();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over, delta } = event;
    
    console.log("=== Drag End Debug ===");
    console.log("Active item:", {
      id: active?.id,
      type: active?.data.current?.type,
      from: active?.data.current?.from,
      course: active?.data.current?.course,
      session: active?.data.current?.session
    });
    console.log("Over target:", {
      id: over?.id,
      rect: over?.rect
    });
    console.log("Over data:", over?.data.current);

    if (!active || !over) {
      console.log("Drag cancelled or invalid active element");
      return;
    }

    const activeType = active.data.current?.type;
    const course = active.data.current?.course;
    const session = active.data.current?.session;
    const overId = over.id.toString();

    // --- Pool Movement Logic --- 
    if (activeType === 'poolCanvas') {
      endPoolDrag();
      const poolId = active.data.current.poolId as string;
      const draggedPool = getPool(poolId); 

      if (draggedPool) {
        const adjustedDeltaX = delta.x / whiteboardScale;
        const adjustedDeltaY = delta.y / whiteboardScale;
        const newX = (draggedPool.x ?? 0) + adjustedDeltaX;
        const newY = (draggedPool.y ?? 0) + adjustedDeltaY;
        updatePoolPosition(poolId, newX, newY);
      }
    }
    // --- Course Movement Logic --- 
    else if ((activeType === 'course' || activeType === 'grid-course' || activeType === 'bank-block') && over) {
      console.log("Processing course drop:", {
        activeType,
        course,
        session,
        overId,
        overRect: over.rect
      });

      // Handle drops on pool day intervals
      if (overId.startsWith('pool-')) {
        let poolId: string;
        let day: DayOfWeek;
        
        console.log("Attempting to parse interval ID:", overId);
        
        // Extract pool ID and day from the interval ID
        // Format is: pool-{poolId}-day-{day}-minute-{minute}
        const parts = overId.split('-day-');
        if (parts.length === 2) {
          poolId = parts[0].replace('pool-', '');
          // Extract just the day name (everything before -minute-)
          day = parts[1].split('-minute-')[0] as DayOfWeek;
          
          console.log("Parsed drop target:", { 
            poolId, 
            day, 
            originalId: overId,
            startMinute: over.data.current?.startMinute 
          });
        } else {
          console.error("Invalid interval ID format:", overId);
          return;
        }

        const targetPool = getPool(poolId);
        if (!targetPool) {
          console.error("Target pool not found for ID:", poolId);
          return;
        }
        console.log("Found target pool:", targetPool);

        // Get the start minute from the over data
        const startMinute = over.data.current?.startMinute;
        if (typeof startMinute !== 'number') {
          console.error("Invalid start minute:", startMinute);
          return;
        }
        
        if ((activeType === 'course' || activeType === 'bank-block') && course) {
          // New course from bank
          console.log("Creating new session:", {
            courseId: course.id,
            poolId,
            day,
            startMinute,
            endMinute: startMinute + 60
          });
          createSession(course.id, poolId, day, startMinute, startMinute + 60);
        } else if (activeType === 'grid-course' && session) {
          // Moving existing course
          const duration = session.end - session.start;
          console.log("Moving existing session:", {
            sessionId: session.id,
            poolId,
            day,
            startMinute,
            duration,
            endMinute: startMinute + duration
          });
          updateSession(session.id, {
            poolId,
            day,
            start: startMinute,
            end: startMinute + duration
          });
        }
      }
      // Handle drops on whiteboard background
      else if (overId === 'whiteboard-droppable' && course) {
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
          
          if (activeType === 'course') {
            // New course from bank
            createSession(course.id, closestPool.id, 'Monday', startMinutes, startMinutes + 60);
          } else if (activeType === 'grid-course' && session) {
            // Moving existing course
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
  };

  return (
    <Layout>
      <DndContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd} 
        collisionDetection={pointerWithin}
      >
        <CourseBank />
        <PoolNavigator />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <Whiteboard />
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeDragItem && (activeDragItem.data.current?.type === 'course' || activeDragItem.data.current?.type === 'grid-course') && (
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
