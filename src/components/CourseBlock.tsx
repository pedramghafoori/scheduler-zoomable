import { forwardRef, useState, useEffect, useRef } from "react";
import { Session, DayOfWeek } from "@/lib/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { formatTime, getContrastText, timeToYPos } from "@/lib/utils";
import { DEFAULT_SESSION_DURATION } from "@/lib/constants";
import { snapToGrid, yPosToTime } from "@/lib/utils";
import { useDraggable } from '@dnd-kit/core';
import { useWhiteboardStore } from "@/stores/whiteboardStore";
import { cn } from "@/lib/utils";
import { clientYToMinutes } from "@/lib/position";

interface CourseBlockProps {
  courseId: string;
  session?: Session;
  isGrid?: boolean;
  index?: number;
  attributes?: any;
  listeners?: any;
  isResizable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const CourseBlock = forwardRef<HTMLDivElement, CourseBlockProps>(
  ({ courseId, session, isGrid = false, index = 0, attributes, listeners, isResizable = false, className = "", style = {} }, ref) => {
    const scheduleStore = useScheduleStore();
    const { transformState } = useWhiteboardStore();
    const scale = transformState?.scale || 1;
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartY = useRef(0);
    const sessionStartY = useRef(0);
    const isResizeActive = useRef(false);
    
    const {
      attributes: dragAttributes,
      listeners: dragListeners,
      setNodeRef: setDragNodeRef,
      isDragging,
    } = useDraggable({
      id: isGrid ? `grid-course-${session?.id}` : `bank-course-${courseId}`,
      data: {
        type: isGrid ? 'grid-course' : 'bank-block',
        courseId,
        session,
      },
      disabled: isResizing
    });

    const course = scheduleStore.getCourse(courseId);
    if (!course) return null;

    // Reset resize state when component unmounts or session changes
    useEffect(() => {
      return () => {
        setIsResizing(false);
        isResizeActive.current = false;
      };
    }, [session?.id]);

    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (!session?.id || isResizeActive.current) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      let clientY: number;
      if ('touches' in e) {
        clientY = e.touches[0].clientY;
      } else {
        clientY = e.clientY;
      }
      
      isResizeActive.current = true;
      setIsResizing(true);
      resizeStartY.current = clientY;
      sessionStartY.current = session.end;

      // Add global event listeners
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp, true);
      window.addEventListener('touchmove', handleMouseMove as any);
      window.addEventListener('touchend', handleMouseUp, true);
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!session?.id || !isResizeActive.current) return;

      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const delta = (clientY - resizeStartY.current) / scale;
      const newEndMinutes = sessionStartY.current + Math.round(delta);
      const newEnd = Math.round(newEndMinutes / 15) * 15;

      if (newEnd > session.start) {
        scheduleStore.updateSession(session.id, { 
          ...session,
          end: newEnd 
        });
      }
    };

    const handleMouseUp = () => {
      if (!isResizeActive.current) return;
      
      isResizeActive.current = false;
      setIsResizing(false);

      // Remove global event listeners
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, true);
      window.removeEventListener('touchmove', handleMouseMove as any);
      window.removeEventListener('touchend', handleMouseUp, true);
    };

    const gridStyle = isGrid ? {
      position: 'relative' as const,
      height: '100%',
      width: '100%',
      backgroundColor: course.color || '#4f46e5',
      color: getContrastText(course.color || '#4f46e5'),
      zIndex: isDragging ? 1000 : 10,
      cursor: isResizing ? 'ns-resize' : 'grab',
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

    return (
      <div className="relative w-full h-full">
        <div
          ref={setDragNodeRef}
          {...(isResizing ? {} : { ...dragAttributes, ...dragListeners })}
          className={cn(
            "course-block-wrapper relative rounded-md select-none",
            className,
            isResizing ? "pointer-events-none" : ""
          )}
          style={{ 
            ...gridStyle, 
            ...bankStyle,
            transform: isDragging ? 'scale(1.05)' : undefined,
            opacity: isDragging ? 0.8 : 1,
            transition: 'transform 0.2s, opacity 0.2s',
            height: isGrid ? 'calc(100% - 8px)' : '60px',
            cursor: isResizing ? 'ns-resize' : 'grab',
            ...style,
          }}
        >
          <div className={`course-block-body p-2 h-full flex flex-col`}>
            <div className="font-medium truncate">{course.name}</div>
            {isGrid && session && (
              <div className="text-xs mt-auto">
                {formatTime(session.start)} - {formatTime(session.end)}
              </div>
            )}
          </div>
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

        {isGrid && session && (
          <div
            className="absolute bottom-0 left-0 right-0 h-4 bg-black bg-opacity-20 cursor-ns-resize select-none hover:bg-opacity-30 transition-colors"
            style={{
              zIndex: 50,
            }}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
          />
        )}
      </div>
    );
  }
);

CourseBlock.displayName = "CourseBlock";

export default CourseBlock;