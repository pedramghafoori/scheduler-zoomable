import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { 
  DndContext, 
  DragStartEvent, 
  DragEndEvent,
  CollisionDetection,
  DroppableContainer,
  Collision,
  pointerWithin,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useDragStore } from "@/stores/dragStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useWhiteboardStore } from "@/stores/whiteboardStore";
import { DayOfWeek } from "@/lib/types";
import { DEFAULT_SESSION_DURATION } from "@/lib/constants";
import { clientYToMinutes } from "@/lib/position";
import AddPoolModal from "@/components/AddPoolModal";

interface LayoutProps {
  children: ReactNode;
}

const customCollisionDetection: CollisionDetection = ({
  active,
  droppableContainers,
  pointerCoordinates,
}) => {
  if (!pointerCoordinates) {
    return [];
  }

  // Get the drag offset from the active element
  const activeElement = document.getElementById(active.id as string);
  const offsetY = activeElement?.getAttribute('data-drag-offset-y');
  const dragOffset = offsetY ? parseInt(offsetY, 10) : 0;

  // Adjust the pointer coordinates by the drag offset
  const adjustedY = pointerCoordinates.y - dragOffset;

  // Find the interval that contains the adjusted pointer position
  return droppableContainers
    .filter((container) => {
      if (!container.data.current) return false;
      
      const { top, height } = container.data.current;
      return (
        adjustedY >= top &&
        adjustedY < top + height
      );
    })
    .map((container) => ({
      id: container.id,
      data: {
        droppableContainer: container,
        value: 1
      }
    }));
};

const Layout = ({ children }: LayoutProps) => {
  const { startDragOperation, endDragOperation, pointerY } = useDragStore();
  const { createSession, updateSession, deleteSession, reorderPools, getPool, sessions } = useScheduleStore();
  const { transformState } = useWhiteboardStore();
  const scale = transformState?.scale || 1;

  const handleDragStart = (event: DragStartEvent) => {
    try {
      const { active } = event;
      const { session, courseId, type, pool } = active.data.current || {};

      console.log("=== Drag Start ===", {
        activeId: active.id,
        type,
        courseId,
        session,
        pool
      });

      if (type === "bank-block" && courseId) {
        const tempSession = {
          id: `temp-${courseId}-${Date.now()}`,
          courseId,
          poolId: "",
          day: "Monday" as DayOfWeek,
          start: 0,
          end: DEFAULT_SESSION_DURATION,
        };
        console.log("Created temp session for bank block:", tempSession);
        startDragOperation(tempSession);
      } else if (type === "grid-block" && session) {
        console.log("Starting drag of grid block:", session);
        startDragOperation(session);
      } else {
        // For other drag types (like pool dragging)
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
        console.log("No active or over target - ending drag");
        return;
      }

      const dragData = active.data.current;
      const overData = over.data.current;

      // Handle pool reordering
      if (dragData?.type === "pool" && overData?.type === "pool-slot") {
        reorderPools(active.id as string, over.id as string);
        return;
      }

      // Handle course dragging
      if (dragData?.type === "grid-course" || dragData?.type === "bank-block") {
        // 1) Dropped onto the Course Bank → delete
        if (over.id === "course-bank" && dragData?.type === "grid-course") {
          const session = dragData.session;
          if (session?.id) {
            deleteSession(session.id);
          }
        }
        // 2) Dropped onto a pool day interval
        else if (overData?.type === "pool-day-interval") {
          const { poolId, day, startMinute } = overData;
          
          // Calculate the offset from the pointer position to the top of the dragged element
          const dragRect = active.rect.current;
          const pointerY = (event.activatorEvent as MouseEvent).clientY;
          const offsetY = pointerY - dragRect.initial.top;
          
          // Convert offset to minutes (60 minutes = GRID_HOUR_HEIGHT pixels)
          const offsetMinutes = Math.round((offsetY / 60) * scale);
          
          // Adjust the start minute by subtracting the offset
          const adjustedStartMinute = startMinute - offsetMinutes;
          
          console.log("Drop calculation:", {
            startMinute,
            offsetY,
            offsetMinutes,
            adjustedStartMinute,
            scale
          });
          
          const targetPool = getPool(poolId);
          if (!targetPool) {
            console.error("Target pool not found for ID:", poolId);
            return;
          }

          if (dragData?.type === "bank-block" && dragData.courseId) {
            createSession(
              dragData.courseId,
              poolId,
              day as DayOfWeek,
              adjustedStartMinute,
              adjustedStartMinute + DEFAULT_SESSION_DURATION
            );
          } else if (dragData?.type === "grid-course" && dragData.session) {
            const duration = dragData.session.end - dragData.session.start;
            updateSession(dragData.session.id, {
              poolId,
              day: day as DayOfWeek,
              start: adjustedStartMinute,
              end: adjustedStartMinute + duration
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in drag end:", error);
    } finally {
      endDragOperation();
    }
  };

  return (
    <DndContext 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd} 
      onDragCancel={() => {
        endDragOperation();
      }}
      collisionDetection={pointerWithin}
      modifiers={[restrictToVerticalAxis]}
    >
      <div className="h-screen flex flex-col">
        <header className="bg-white border-b fixed top-0 left-0 right-0 z-30 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Pool-Course Scheduler</h1>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Scheduler
                  </Link>
                </li>
                <li>
                  <Link
                    to="/manage"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Admin
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex pt-16">
          {children}
        </main>
      </div>
    </DndContext>
  );
};

export default Layout;
