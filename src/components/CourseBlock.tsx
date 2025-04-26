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
import EditCourseModal from './EditCourseModal';

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const resizeStartY = useRef(0);
    const sessionStartY = useRef(0);
    const isResizeActive = useRef(false);
    
    const {
      attributes: dragAttributes,
      listeners: dragListeners,
      setNodeRef,
      isDragging,
      transform,
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

    const handleEditClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsEditModalOpen(true);
    };

    const gridStyle = isGrid ? {
      position: 'relative' as const,
      height: '100%',
      width: '100%',
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

    // Reset resize state when component unmounts or session changes
    useEffect(() => {
      return () => {
        setIsResizing(false);
        isResizeActive.current = false;
      };
    }, [session?.id]);

    // Commenting out resize functionality
    /*
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
      window.addEventListener('mousemove', handleMouseMove, { capture: true });
      window.addEventListener('mouseup', handleMouseUp, { capture: true });
      window.addEventListener('touchmove', handleMouseMove as any, { capture: true });
      window.addEventListener('touchend', handleMouseUp, { capture: true });
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!session?.id || !isResizeActive.current) return;

      e.preventDefault();
      e.stopPropagation();

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

    const handleMouseUp = (e: MouseEvent | TouchEvent) => {
      if (!isResizeActive.current) return;
      
      e.preventDefault();
      e.stopPropagation();

      isResizeActive.current = false;
      setIsResizing(false);

      // Remove global event listeners
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      window.removeEventListener('touchmove', handleMouseMove as any, { capture: true });
      window.removeEventListener('touchend', handleMouseUp, { capture: true });
    };
    */

    return (
      <>
        <div className="relative w-full h-full">
          <div
            ref={setNodeRef}
            {...(isResizing ? {} : { ...dragAttributes, ...dragListeners })}
            className={cn(
              "course-block-wrapper relative rounded-md select-none",
              className
            )}
            style={{ 
              ...gridStyle, 
              ...bankStyle,
              transform: isDragging ? `translate3d(${transform?.x}px, ${transform?.y}px, 0) scale(1.05)` : undefined,
              opacity: isDragging ? 0.8 : 1,
              transition: 'transform 0.2s, opacity 0.2s',
              height: isGrid ? '100%' : '60px',
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
            {isGrid && session && (
              <>
                <button
                  className="absolute top-1 right-1 z-20 p-1 rounded-full bg-black bg-opacity-30 hover:bg-opacity-40 transition-colors"
                  onClick={handleEditClick}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  title="Edit course duration"
                >
                  <svg 
                    className="w-3 h-3 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                    />
                  </svg>
                </button>
                {/* Commenting out resize handle
                <div
                  className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize"
                  onMouseDown={handleResizeStart}
                  onTouchStart={handleResizeStart}
                  style={{ touchAction: 'none' }}
                />
                */}
              </>
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
        </div>
        {isEditModalOpen && (
          <EditCourseModal
            onClose={() => setIsEditModalOpen(false)}
            courseId={courseId}
          />
        )}
      </>
    );
  }
);

CourseBlock.displayName = "CourseBlock";

export default CourseBlock;