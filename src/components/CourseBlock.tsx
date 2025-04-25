import { forwardRef, useState } from "react";
import { Session, DayOfWeek } from "@/lib/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { formatTime, getContrastText, timeToYPos } from "@/lib/utils";
import { DEFAULT_SESSION_DURATION } from "@/lib/constants";
import { snapToGrid, yPosToTime } from "@/lib/utils";
import { useDraggable } from '@dnd-kit/core';

interface CourseBlockProps {
  courseId: string;
  session?: Session;
  isGrid?: boolean;
  index?: number;
  attributes?: any;
  listeners?: any;
}

const CourseBlock = forwardRef<HTMLDivElement, CourseBlockProps>(
  ({ courseId, session, isGrid = false, index = 0, attributes, listeners }, ref) => {
    const scheduleStore = useScheduleStore();
    const [isResizing, setIsResizing] = useState(false);
    
    const {
      attributes: dragAttributes,
      listeners: dragListeners,
      setNodeRef: setDragNodeRef,
      isDragging,
    } = useDraggable({
      id: isGrid ? `grid-course-${session?.id}` : `bank-course-${courseId}`,
      data: {
        type: isGrid ? 'grid-course' : 'course',
        course: scheduleStore.getCourse(courseId),
        session,
        from: isGrid ? 'grid' : 'bank'
      },
    });

    const course = scheduleStore.getCourse(courseId);
    if (!course) return null;

    const HEADER_HEIGHT = 40;

    const gridStyle = isGrid && session ? {
      position: 'absolute' as const,
      top: `${timeToYPos(session.start) + HEADER_HEIGHT}px`,
      height: `${session.end - session.start}px`,
      width: 'calc(100% - 8px)',
      left: '4px',
      backgroundColor: course.color || '#4f46e5',
      color: getContrastText(course.color || '#4f46e5'),
      zIndex: isDragging ? 1000 : 10,
      cursor: 'grab',
      touchAction: 'none',
      userSelect: 'none' as const,
    } : {};
    
    const bankStyle = !isGrid ? {
      backgroundColor: course.color || '#4f46e5',
      color: getContrastText(course.color || '#4f46e5'),
      height: '60px',
      marginBottom: '8px',
      zIndex: isDragging ? 1000 : 10,
      cursor: 'grab',
      touchAction: 'none',
      userSelect: 'none' as const,
    } : {};

    const onResizeMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!session) return;
      setIsResizing(true);
      const startY = e.clientY;
      const startEnd = session.end;

      const move = (me: MouseEvent) => {
        me.stopPropagation();
        const delta = me.clientY - startY;
        const tentative = startEnd + delta;
        const snapped = yPosToTime(snapToGrid(tentative));
        if (snapped > session.start) {
          scheduleStore.updateSession(session.id, { end: snapped });
        }
      };

      const up = (me: MouseEvent) => {
        me.stopPropagation();
        setIsResizing(false);
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };

      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
      e.stopPropagation();
      dragListeners?.onPointerDown?.(e);
    };

    return (
      <div
        ref={setDragNodeRef}
        {...dragAttributes}
        {...dragListeners}
        className={`course-block-wrapper ${isGrid ? "absolute" : "relative"} rounded-md select-none`}
        style={{ 
          ...gridStyle, 
          ...bankStyle,
          transform: isDragging ? 'scale(1.05)' : undefined,
          opacity: isDragging ? 0.8 : 1,
          transition: 'transform 0.2s, opacity 0.2s',
          cursor: isResizing ? 'ns-resize' : 'grab',
        }}
      >
        <div 
          className={`course-block-body p-2 h-full flex flex-col`}
        >
          <div className="font-medium truncate">{course.title}</div>
          {isGrid && session && (
            <div className="text-xs mt-auto">
              {formatTime(session.start)} - {formatTime(session.end)}
            </div>
          )}
        </div>
        {isGrid && session && !isResizing && (
          <div
            className="absolute bottom-0 left-0 right-0 h-2 bg-black bg-opacity-20 cursor-ns-resize select-none hover:bg-opacity-30 transition-colors"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onResizeMouseDown(e);
            }}
          />
        )}
        {!isGrid && (
          <div 
            className="absolute top-1 right-1 z-20 cursor-pointer p-0.5 bg-black bg-opacity-30 rounded-full leading-none"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scheduleStore.removeCourse(courseId);
            }}
            title="Remove course from bank"
          >
            <span className="text-white hover:text-gray-200 text-xs font-bold">×</span>
          </div>
        )}
      </div>
    );
  }
);

CourseBlock.displayName = "CourseBlock";

export default CourseBlock;