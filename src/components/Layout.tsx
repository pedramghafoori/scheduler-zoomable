import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { DndContext, DragStartEvent, DragEndEvent, pointerWithin } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useDragStore } from "@/stores/dragStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { DayOfWeek } from "@/lib/types";
import { DEFAULT_SESSION_DURATION } from "@/lib/constants";
import { clientYToMinutes } from "@/lib/position";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { startDrag, endDrag, pointerY } = useDragStore();
  const { createSession, updateSession, deleteSession, reorderPools } = useScheduleStore();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { session, courseId, type, pool } = active.data.current || {};

    console.log("Layout handleDragStart:", { type, courseId, session, pool });

    if (type === "bank-block" && courseId) {
      const tempSession = {
        id: `temp-${courseId}-${Date.now()}`,
        courseId,
        poolId: "", // indicates "in the bank"
        day: "Monday" as DayOfWeek,
        start: 0,
        end: DEFAULT_SESSION_DURATION,
      };
      startDrag(tempSession);
    } else if (type === "grid-block" && session) {
      startDrag(session);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("Layout handleDragEnd:", {
      activeId: active?.id,
      activeType: active?.data.current?.type,
      overId: over?.id,
      overType: over?.data.current?.type,
      pointerY
    });

    if (!active || !over) {
      endDrag();
      return;
    }

    const dragData = active.data.current;
    const overData = over.data.current;

    // Handle pool reordering
    if (dragData?.type === "pool" && overData?.type === "pool-slot") {
      reorderPools(active.id as string, over.id as string);
      endDrag();
      return;
    }

    // Handle course dragging
    if (dragData?.type === "grid-block" || dragData?.type === "bank-block") {
      // 1) Dropped onto the Course Bank → delete
      if (over.id === "course-bank" && dragData?.type === "grid-block") {
        const session = dragData.session;
        if (session?.id) {
          console.log("Deleting session dropped on bank:", session.id);
          deleteSession(session.id);
        }
      }
      // 2) Dropped onto a pool/day column
      else if (overData?.type === "pool-day") {
        const { poolId, day } = overData;
        const start = clientYToMinutes(pointerY ?? 0);

        if (dragData?.type === "bank-block") {
          console.log("Creating session from bank‑block:", {
            courseId: dragData.courseId,
            poolId,
            day,
            start,
            end: start + DEFAULT_SESSION_DURATION
          });
          
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
      }
    }

    endDrag();
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
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
        <main className="flex-1 flex">{children}</main>
      </div>
    </DndContext>
  );
};

export default Layout;
