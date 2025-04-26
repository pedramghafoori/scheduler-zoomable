import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import CourseBlock from './CourseBlock';
import { Course } from '@/lib/types';

interface DraggableCourseBlockProps {
  course: Course;
}

const DraggableCourseBlock = ({ course }: DraggableCourseBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `bank-course-${course.id}`,
    data: {
      type: 'bank-block',
      courseId: course.id,
      course: course
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100,
    cursor: 'grabbing',
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={isDragging ? 'opacity-75 shadow-lg' : ''}
    >
      <CourseBlock 
        courseId={course.id}
      />
    </div>
  );
};

export default DraggableCourseBlock; 