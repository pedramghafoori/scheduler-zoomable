import { useState } from "react";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDroppable } from "@dnd-kit/core";
import CourseBlock from "./CourseBlock";
import DraggableCourseBlock from "./DraggableCourseBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getRemainingHours } from "@/lib/utils";
import { Settings } from "lucide-react";
import EditCourseDialog from "@/components/EditCourseDialog";
import { Course } from "@/lib/types";
import { ColorPicker } from "@/components/ui/color-picker";

const CourseBank = () => {
  const { courses, getScheduledMinutesForCourse, addCourse, updateCourse } = useScheduleStore();
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseTotalHours, setNewCourseTotalHours] = useState(1);
  const [selectedColor, setSelectedColor] = useState("#ef4444");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: "course-bank",
    data: {
      type: "bank",
    },
  });

  const handleAddCourse = () => {
    if (newCourseTitle.trim() && newCourseTotalHours > 0) {
      addCourse(newCourseTitle.trim(), newCourseTotalHours, selectedColor);
      setNewCourseTitle("");
      setNewCourseTotalHours(1);
      setSelectedColor("#ef4444");
      setIsAddingCourse(false);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className={`absolute top-32 left-4 z-10 w-64 h-[calc((100vh-theme(spacing.32)-theme(spacing.8))/2)] border bg-white rounded-lg shadow-md flex flex-col overflow-hidden ${isOver ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="p-4 border-b flex-shrink-0">
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
                <h3 className="font-medium">{course.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {remainingHours} h remaining
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditingCourse(course)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {remainingBlocks > 0 && (
                <DraggableCourseBlock course={course} />
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
              <ColorPicker
                label="Course Color"
                value={selectedColor}
                onChange={setSelectedColor}
              />
              <Button onClick={handleAddCourse} className="w-full">
                Add Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <EditCourseDialog
        course={editingCourse}
        open={editingCourse !== null}
        onOpenChange={(open) => !open && setEditingCourse(null)}
        onSave={updateCourse}
      />
    </div>
  );
};

export default CourseBank;
