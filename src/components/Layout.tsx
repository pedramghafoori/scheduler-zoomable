import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { DndContext, DragStartEvent, DragEndEvent, pointerWithin } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useDragStore } from "@/stores/dragStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { DayOfWeek } from "@/lib/types";
import { DEFAULT_SESSION_DURATION } from "@/lib/constants";
import { clientYToMinutes } from "@/lib/position";
import AddPoolModal from "@/components/AddPoolModal";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { startDragOperation, endDragOperation, pointerY } = useDragStore();
  const { createSession, updateSession, deleteSession, reorderPools, getPool, sessions } = useScheduleStore();

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
      } else if (type === "grid-course" && session) {
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

      console.log("=== Drag End ===");
      console.log("Active:", {
        id: active?.id,
        type: active?.data.current?.type,
        course: active?.data.current?.course,
        session: active?.data.current?.session,
        data: active?.data.current
      });
      console.log("Over:", {
        id: over?.id,
        type: over?.data.current?.type,
        data: over?.data.current
      });

      if (!active || !over) {
        console.log("No active or over target - ending drag");
        return;
      }

      const dragData = active.data.current;
      const overData = over.data.current;

      console.log("Processing drag end:", { dragData, overData });

      // Handle pool reordering
      if (dragData?.type === "pool" && overData?.type === "pool-slot") {
        console.log("Reordering pools:", { activeId: active.id, overId: over.id });
        reorderPools(active.id as string, over.id as string);
        return;
      }

      // Handle course dragging
      if (dragData?.type === "grid-course" || dragData?.type === "bank-block") {
        console.log("Processing course drop:", { dragType: dragData.type });

        // 1) Dropped onto the Course Bank → delete
        if (over.id === "course-bank" && dragData?.type === "grid-course") {
          const session = dragData.session;
          if (session?.id) {
            console.log("Deleting session dropped on bank:", session.id);
            deleteSession(session.id);
          }
        }
        // 2) Dropped onto a pool day interval
        else if (overData?.type === "pool-day-interval") {
          const { poolId, day, startMinute } = overData;
          
          console.log("Drop target info:", { poolId, day, startMinute });
          
          const targetPool = getPool(poolId);
          if (!targetPool) {
            console.error("Target pool not found for ID:", poolId);
            return;
          }

          if (dragData?.type === "bank-block" && dragData.course) {
            console.log("Creating new session from bank block");
            createSession(
              dragData.course.id,
              poolId,
              day as DayOfWeek,
              startMinute,
              startMinute + 60
            );
          } else if (dragData?.type === "grid-course" && dragData.session) {
            const duration = dragData.session.end - dragData.session.start;
            const roundedStart = Math.round(startMinute / 15) * 15;
            const roundedEnd = Math.round((startMinute + duration) / 15) * 15;
            
            console.log("=== Debug Grid Block Move ===");
            console.log("Original session:", dragData.session);
            console.log("Drop target:", { poolId, day, startMinute });
            console.log("Calculated times:", {
              roundedStart,
              roundedEnd,
              duration,
              originalStart: dragData.session.start,
              originalEnd: dragData.session.end
            });
            
            updateSession(dragData.session.id, {
              poolId,
              day: day as DayOfWeek,
              start: roundedStart,
              end: roundedEnd
            });

            // Log the session after update
            console.log("Session after update:", {
              id: dragData.session.id,
              updatedSession: sessions.find(s => s.id === dragData.session.id)
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
