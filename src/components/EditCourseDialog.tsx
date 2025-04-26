import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Course } from "@/lib/types";
import { ColorPicker } from "@/components/ui/color-picker";

interface EditCourseDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (courseId: string, updates: Partial<Course>) => void;
}

const EditCourseDialog = ({ course, open, onOpenChange, onSave }: EditCourseDialogProps) => {
  const [name, setName] = useState("");
  const [totalHours, setTotalHours] = useState(1);
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    if (course) {
      setName(course.name);
      setTotalHours(course.totalHours);
      setColor(course.color);
    }
  }, [course]);

  const handleSave = () => {
    if (!course || !name.trim() || totalHours <= 0) return;
    
    onSave(course.id, {
      name: name.trim(),
      totalHours,
      color,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Course Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter course name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Total Hours</Label>
            <Input
              id="hours"
              type="number"
              min={1}
              value={totalHours}
              onChange={(e) => setTotalHours(parseInt(e.target.value) || 1)}
            />
          </div>
          <ColorPicker
            label="Course Color"
            value={color}
            onChange={setColor}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseDialog; 