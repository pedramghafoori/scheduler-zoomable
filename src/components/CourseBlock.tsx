import { forwardRef, useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Session, DayOfWeek } from "@/lib/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { formatTime, getContrastText, timeToYPos, createDragImage } from "@/lib/utils";
import { DEFAULT_SESSION_DURATION } from "@/lib/constants";
import { snapToGrid, yPosToTime } from "@/lib/utils";

interface CourseBlockProps {
  courseId: string;
  session?: Session;
  isGrid?: boolean;
  index?: number;
}

const CourseBlock = forwardRef<HTMLDivElement, CourseBlockProps>(
  ({ courseId, session, isGrid = false, index = 0 }, ref) => {
    const scheduleStore = useScheduleStore();
    const [isResizing, setIsResizing] = useState(false);
    
    // Create session object for bank items that don't have one yet
    const blockSession: Session = session || {
      id: `temp-${courseId}-${index}`,
      courseId,
      poolId: "", // Empty string means it's in the bank
      day: "Monday" as DayOfWeek, // Default day
      start: 0,
      end: DEFAULT_SESSION_DURATION,
    };
    
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: blockSession.id,
      data: {
        type: isGrid ? "grid-block" : "bank-block",
        session: blockSession,
        courseId,
      },
    });
    
    // Set up custom drag image
    useEffect(() => {
      if (isDragging) {
        const dragImg = createDragImage();
        document.body.appendChild(dragImg);
        dragImg.classList.add("hidden"); // Make invisible
        
        if ("setDragImage" in window.DataTransfer.prototype) {
          // This will be ignored in some browsers, but we handle it with dnd-kit anyway
          const event = new DragEvent("dragstart");
          Object.defineProperty(event, "dataTransfer", {
            value: { setDragImage: () => {} },
            writable: true,
          });
        }
        
        return () => {
          document.body.removeChild(dragImg);
        };
      }
    }, [isDragging]);

    const course = scheduleStore.getCourse(courseId);
    if (!course) return null;

    // Styling for grid blocks
    const gridStyle = isGrid && session ? {
      position: 'absolute' as const,
      top: `${timeToYPos(session.start)}px`,
      height: `${session.end - session.start}px`,
      width: 'calc(100% - 8px)',
      left: '4px',
      backgroundColor: course.color,
      color: getContrastText(course.color),
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      zIndex: isDragging ? 50 : 1,
    } : {};
    
    // For bank blocks
    const bankStyle = !isGrid ? {
      backgroundColor: course.color,
      color: getContrastText(course.color),
      height: '60px', // 1 hour height
      marginBottom: '8px',
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      zIndex: isDragging ? 50 : 1,
    } : {};

    const onResizeMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!session) return; // only grid blocks
      setIsResizing(true);
      const startY = e.clientY;
      const startEnd = session.end;

      const move = (me: MouseEvent) => {
        const delta = me.clientY - startY;
        const tentative = startEnd + delta;
        const snapped = yPosToTime(snapToGrid(tentative));
        if (snapped > session.start) {
          scheduleStore.updateSession(session.id, { end: snapped });
        }
      };

      const up = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };

      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };

    return (
      <div
        className={`course-block-wrapper ${isGrid ? "absolute" : "relative"}`}
        style={{ ...gridStyle, ...bankStyle }}
      >
        <div
          ref={(el) => {
            setNodeRef(el);
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          {...attributes}
          {...listeners}
          className={`course-block-body p-2 h-full flex flex-col ${
            isDragging ? "opacity-50" : ""
          } cursor-move`}
        >
          <div className="font-medium">{course.title}</div>
          {isGrid && session && (
            <div className="text-xs mt-auto">
              {formatTime(session.start)} - {formatTime(session.end)}
            </div>
          )}
        </div>
        {isGrid && session && (
          <div
            className="absolute bottom-0 left-0 right-0 h-2 bg-black bg-opacity-20 cursor-ns-resize select-none hover:bg-opacity-30 transition-colors"
            onMouseDown={onResizeMouseDown}
            style={{ pointerEvents: 'auto' }}
          />
        )}
        <div 
          className="absolute top-1 right-1 z-20 cursor-pointer"
          onClick={(e) => {
            console.log('Delete button clicked for course:', courseId);
            e.stopPropagation();
            scheduleStore.removeCourse(courseId);
            console.log('Course removed:', courseId);
          }}
        >
          <span className="text-white hover:text-gray-200 text-xl font-bold">×</span>
        </div>
      </div>
    );
  }
);

CourseBlock.displayName = "CourseBlock";

export default CourseBlock;