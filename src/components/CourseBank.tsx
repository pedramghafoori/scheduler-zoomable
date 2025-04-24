import { useState } from "react";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDroppable } from "@dnd-kit/core";
import CourseBlock from "./CourseBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getRemainingHours } from "@/lib/utils";

const CourseBank = () => {
  const { courses, getScheduledMinutesForCourse, addCourse } = useScheduleStore();
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseTotalHours, setNewCourseTotalHours] = useState(1);

  const { setNodeRef, isOver } = useDroppable({
    id: "course-bank",
    data: {
      type: "bank",
    },
  });

  const handleAddCourse = () => {
    if (newCourseTitle.trim() && newCourseTotalHours > 0) {
      addCourse(newCourseTitle.trim(), newCourseTotalHours);
      setNewCourseTitle("");
      setNewCourseTotalHours(1);
      setIsAddingCourse(false);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className={`w-64 border-r bg-sidebar flex flex-col sticky top-0 h-screen ${isOver ? 'bg-red-50' : ''}`}
    >
      <div className="p-4 border-b bg-white">
        <h2 className="font-bold text-lg">Course Bank</h2>
        <p className="text-xs text-gray-500 mt-1">
          Drag courses to schedule them or drop scheduled courses here to delete
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {courses.map((course) => {
          const scheduledMinutes = getScheduledMinutesForCourse(course.id);
          const remainingHours = getRemainingHours(course.totalHours, scheduledMinutes);
          const remainingBlocks = Math.floor(remainingHours);

          return (
            <div key={course.id} className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{course.title}</h3>
                <span className="text-sm text-gray-500">
                  {remainingHours} h remaining
                </span>
              </div>
              
              {remainingBlocks > 0 && (
                <div>
                  <CourseBlock 
                    key={course.id}
                    courseId={course.id}
                    index={0}
                  />
                </div>
              )}
              
              {remainingBlocks === 0 && (
                <div className="text-sm text-gray-500 italic">
                  All hours scheduled
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t bg-white">
        <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
          <DialogTrigger asChild>
            <Button className="w-full">Add Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="Enter course title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Total Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min={1}
                  value={newCourseTotalHours}
                  onChange={(e) => setNewCourseTotalHours(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button onClick={handleAddCourse} className="w-full">
                Add Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CourseBank;
