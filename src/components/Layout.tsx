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
  const { startDrag, endDrag, pointerY } = useDragStore();
  const { createSession, updateSession, deleteSession, reorderPools, getPool } = useScheduleStore();

  const handleDragStart = (event: DragStartEvent) => {
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
      startDrag(tempSession);
    } else if (type === "grid-block" && session) {
      console.log("Starting drag of grid block:", session);
      startDrag(session);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("=== Drag End ===");
    console.log("Active:", {
      id: active?.id,
      type: active?.data.current?.type,
      course: active?.data.current?.course,
      session: active?.data.current?.session
    });
    console.log("Over:", {
      id: over?.id,
      type: over?.data.current?.type,
      data: over?.data.current
    });

    if (!active || !over) {
      console.log("No active or over target - ending drag");
      endDrag();
      return;
    }

    const dragData = active.data.current;
    const overData = over.data.current;

    // Handle pool reordering
    if (dragData?.type === "pool" && overData?.type === "pool-slot") {
      console.log("Reordering pools:", { activeId: active.id, overId: over.id });
      reorderPools(active.id as string, over.id as string);
      endDrag();
      return;
    }

    // Handle course dragging
    if (dragData?.type === "grid-block" || dragData?.type === "bank-block") {
      console.log("Processing course drop:", { dragType: dragData.type });

      // 1) Dropped onto the Course Bank → delete
      if (over.id === "course-bank" && dragData?.type === "grid-block") {
        const session = dragData.session;
        if (session?.id) {
          console.log("Deleting session dropped on bank:", session.id);
          deleteSession(session.id);
        }
      }
      // 2) Dropped onto a pool day interval
      else if (overData?.type === "pool-day-interval") {
        const { poolId, day, startMinute } = overData;
        console.log("Drop target info:", {
          poolId,
          day,
          startMinute,
          rawOverData: overData
        });

        const targetPool = getPool(poolId);
        if (!targetPool) {
          console.error("Target pool not found for ID:", poolId);
          return;
        }
        console.log("Found target pool:", targetPool);

        if (dragData?.type === "bank-block" && dragData.course) {
          // New course from bank - create 1-hour session starting at the interval
          console.log("Creating new session from bank:", {
            courseId: dragData.course.id,
            poolId,
            day,
            startMinute,
            course: dragData.course
          });
          
          const newSessionId = createSession(
            dragData.course.id,
            poolId,
            day as DayOfWeek, // Ensure day is treated as DayOfWeek
            startMinute,
            startMinute + 60 // Default 1-hour duration
          );
          console.log("Created new session with ID:", newSessionId);

        } else if (dragData?.type === "grid-block" && dragData.session) {
          // Moving existing course - maintain its duration
          const duration = dragData.session.end - dragData.session.start;
          console.log("Moving existing session:", {
            sessionId: dragData.session.id,
            poolId,
            day,
            startMinute,
            duration,
            newEndMinute: startMinute + duration,
            originalSession: dragData.session
          });
          
          updateSession(dragData.session.id, {
            poolId,
            day: day as DayOfWeek, // Ensure day is treated as DayOfWeek
            start: startMinute,
            end: startMinute + duration
          });
        }
      }
      // Handle drops on whiteboard background
      else if (over.id === "whiteboard-droppable" && dragData.course) {
        console.log("Dropped on whiteboard background");
        // ... existing whiteboard handling code ...
      }
    }

    console.log("=== Ending Drag ===");
    endDrag();
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
      modifiers={[]}
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
