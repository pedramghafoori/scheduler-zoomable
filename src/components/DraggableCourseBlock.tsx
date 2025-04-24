import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import CourseBlock from './CourseBlock'; // The actual visual component
import { Course } from '@/lib/types';

interface DraggableCourseBlockProps {
  course: Course;
  // Add index or other identifiers if needed, depends on CourseBlock props
}

const DraggableCourseBlock = ({ course }: DraggableCourseBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    // Use a unique ID including course ID and maybe indicate it's from the bank
    id: `bank-course-${course.id}`,
    data: { // Data passed during drag
      type: 'course',
      course: course,
      from: 'bank' // Indicate origin
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100, // High z-index while dragging
    cursor: 'grabbing',
  } : undefined;

  // Render the actual CourseBlock, applying the draggable props
  // The div wrapper gets the draggable listeners and styles
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      // Add visual feedback for dragging state if desired
      className={isDragging ? 'opacity-75 shadow-lg' : ''}
    >
      <CourseBlock courseId={course.id} index={0} /* Pass necessary props */ />
    </div>
  );
};

export default DraggableCourseBlock; 