import { useRef, useEffect, useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Pool, DayOfWeek } from "@/lib/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDragStore } from "@/stores/dragStore";
import CourseBlock from "./CourseBlock";
import { DragStartEvent, DragEndEvent, DraggableAttributes } from "@dnd-kit/core";
import { DraggableSyntheticListeners } from '@dnd-kit/core';
import HourLabels from "./HourLabels";

export interface PoolCanvasProps {
  pool: Pool;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
}

const PoolCanvas = ({ pool, dragAttributes, dragListeners }: PoolCanvasProps) => {
  const { dragSession } = useDragStore();
  const { removePool } = useScheduleStore();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b p-2 flex items-center space-x-2">
        <div 
          className="p-1 cursor-move"
          {...dragAttributes} 
          {...dragListeners}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>
        <div className="flex-1 flex items-center space-x-4 min-w-0">
          <div className="font-medium truncate">{pool.title}</div>
          <div className="text-sm text-gray-500 truncate">{pool.location}</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Are you sure you want to delete the pool "${pool.title}"? This will also remove all sessions in this pool.`)) {
              removePool(pool.id);
            }
          }}
          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
        >
          ×
        </button>
      </div>
      <div className="flex flex-1">
        <div className="sticky left-0 z-10 bg-white">
          <HourLabels />
        </div>
        <div className="flex-1 grid" style={{ 
          gridTemplateColumns: `repeat(${pool.days.length}, minmax(0, 1fr))`,
          width: '100%'
        }}>
          {pool.days.map((poolDay) => (
            <PoolDayColumn 
              key={poolDay.id} 
              poolId={pool.id}
              day={poolDay.day}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface PoolDayColumnProps {
  poolId: string;
  day: DayOfWeek;
}

const PoolDayColumn = ({ poolId, day }: PoolDayColumnProps) => {
  const { getSessionsForPoolDay } = useScheduleStore();
  const { dragSession } = useDragStore();
  const sessions = getSessionsForPoolDay(poolId, day);
  const blockAreaRef = useRef<HTMLDivElement>(null);
  
  const { setNodeRef, isOver } = useDroppable({
    id: `${poolId}-${day}`,
    data: {
      type: "pool-day",
      poolId,
      day,
    },
  });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (blockAreaRef.current && dragSession) {
        const rect = blockAreaRef.current.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        console.log("mousemove – relativeY:", relativeY);
        useDragStore.getState().movePointer(relativeY);
      }
    },
    [dragSession]
  );

  useEffect(() => {
    if (isOver && dragSession) {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [isOver, dragSession, handleMouseMove]);

  return (
    <div 
      ref={setNodeRef}
      className={`pool-day relative border-r last:border-r-0 h-full ${isOver ? 'bg-gray-50' : ''}`}
    >
      <div className="pool-header sticky top-0 bg-gray-100 p-2 text-center font-medium border-b">
        {day}
      </div>
      <div className="relative h-full" style={{ minHeight: '900px'}} ref={blockAreaRef}>
        {sessions.map((session) => (
          <CourseBlock
            key={session.id}
            courseId={session.courseId}
            session={session}
            isGrid={true}
          />
        ))}
      </div>
    </div>
  );
};

export default PoolCanvas;
