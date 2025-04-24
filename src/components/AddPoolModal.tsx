import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useScheduleStore } from "@/stores/scheduleStore";
import { DAYS_OF_WEEK, DayOfWeek } from "@/lib/constants";

const AddPoolModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  
  const { addPool } = useScheduleStore();
  
  const handleToggleDay = (day: string) => {
    setSelectedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };
  
  const handleAddPool = () => {
    if (!title.trim()) return;
    
    const days = Object.entries(selectedDays)
      .filter(([_, isSelected]) => isSelected)
      .map(([day]) => day as DayOfWeek); // Cast to DayOfWeek type
    
    if (days.length === 0) return;
    
    addPool(title.trim(), location.trim(), days);
    setIsOpen(false);
    
    // Reset form
    setTitle("");
    setLocation("");
    setSelectedDays({});
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Pool</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Pool</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Pool Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter pool name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
            />
          </div>
          <div className="space-y-2">
            <Label>Available Days</Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={!!selectedDays[day]}
                    onCheckedChange={() => handleToggleDay(day)}
                  />
                  <Label htmlFor={`day-${day}`}>{day}</Label>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleAddPool} className="w-full">
            Add Pool
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPoolModal;
