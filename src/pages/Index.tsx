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
      startDragOperation();
      console.log("Drag started:", { active });
      
      if (active.data.current?.type === 'poolCanvas') {
        startDragOperation();
      }
    } catch (error) {
      console.error("Error in drag start:", error);
      endDragOperation();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    try {
      const { active, over } = event;
      
      if (!active || !over) {
        console.log("No active or over target");
        return;
      }

      const { id: activeId, data: { current: activeData } } = active;
      const { id: overId, data: { current: overData } } = over;

      // Handle pool canvas dragging
      if (activeData?.type === 'poolCanvas') {
        const poolId = activeData.poolId;
        const pool = getPool(poolId);
        
        if (pool) {
          const adjustedX = over.rect.left / whiteboardScale;
          const adjustedY = over.rect.top / whiteboardScale;
          updatePoolPosition(poolId, adjustedX, adjustedY);
        }
      }

      // Handle course dragging
      if (activeData?.type === 'course' || activeData?.type === 'grid-course') {
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
            
            if (activeData.type === 'course') {
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
        collisionDetection={closestCenter}
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
