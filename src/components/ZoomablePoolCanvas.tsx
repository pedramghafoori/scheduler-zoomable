import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import { Pool, DayOfWeek } from "@/lib/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { Settings } from "lucide-react"; // Icon for options
import { format } from "date-fns"; // For formatting hour labels
import { DraggableSyntheticListeners, DraggableAttributes } from '@dnd-kit/core'; // Import this

// Import shadcn components
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DAYS_OF_WEEK } from "@/lib/constants"; // Import available days

// Define props interface
export interface ZoomablePoolCanvasProps {
  pool: Pool;
  dynamicWidth: number; // Width calculated by parent (DraggablePoolCanvas)
  dragListeners?: DraggableSyntheticListeners; // Add this prop
  dragAttributes?: DraggableAttributes; // Add this prop
}

// Constants
const CANVAS_HEIGHT = 1440; // Represents 24 hours * 60 pixels/hour
const GRID_HOUR_HEIGHT = 60;
const DAY_COLUMN_WIDTH = 200;
const HOUR_LABEL_WIDTH = 60;
const DAY_COLUMN_START = HOUR_LABEL_WIDTH;

const ZoomablePoolCanvas = ({ pool, dynamicWidth, dragListeners, dragAttributes }: ZoomablePoolCanvasProps) => {
  // Store hooks
  const { removePool, updatePoolDays, getSessionsForPoolDay } = useScheduleStore();

  // Popover state for day selection
  const [open, setOpen] = useState(false);
  const [selectedDaysLocal, setSelectedDaysLocal] = useState<DayOfWeek[]>(() =>
    pool.days.map(pd => pd.day)
  );

  // Sync local selected days if pool prop changes
  useEffect(() => {
    setSelectedDaysLocal(pool.days.map(pd => pd.day));
  }, [pool.days]);

  // --- Sort the currently selected days from the prop for rendering order --- 
  const sortedPoolDays = [...pool.days].sort((a, b) =>
    DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day)
  );
  // --- End Sorting --- 

  // Create a Set for efficient lookup of selected days from the prop
  const selectedDaysSetProp = new Set(pool.days.map(pd => pd.day));

  // Popover save handler
  const handleSaveChanges = () => {
    updatePoolDays(pool.id, selectedDaysLocal);
    setOpen(false);
  };

  // Popover checkbox change handler (updates local state)
  const handleCheckedChange = (checked: boolean | 'indeterminate', day: DayOfWeek) => {
    if (checked === true) {
      setSelectedDaysLocal(prev => [...prev, day]);
    } else {
      setSelectedDaysLocal(prev => prev.filter(d => d !== day));
    }
  };

  // Helper to get column X based on the *absolute index* in DAYS_OF_WEEK
  const getColumnXByIndex = (index: number): number => {
    return DAY_COLUMN_START + (index * DAY_COLUMN_WIDTH);
  };

  // Calculate the total number of selected days for dynamic width calculation if needed elsewhere
  // const selectedDayCount = pool.days.length;
  // const calculatedWidth = HOUR_LABEL_WIDTH + (selectedDayCount * DAY_COLUMN_WIDTH);

  return (
    // Main container with rounded corners and shadow
    <div className="flex flex-col bg-white border rounded-lg shadow-md">
      {/* Header with Pool Info, Drag Handle (optional), Options */}
      <div className="bg-gray-50 border-b p-2 flex items-center space-x-2 rounded-t-lg">
        {/* Apply attributes AND listeners to the handle */}
        <div className="p-1 cursor-move touch-none" {...dragListeners} {...dragAttributes}>
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>
        
        {/* Pool Info */}
        <div className="flex-1 flex items-center space-x-4 min-w-0">
          <div className="font-medium truncate">{pool.title}</div>
          <div className="text-sm text-gray-500 truncate">{pool.location}</div>
        </div>

        {/* Options Popover */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              // Stop pointer event from bubbling up to the draggable wrapper
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Displayed Days</h4>
                <p className="text-sm text-muted-foreground">
                  Select which days appear in this pool.
                </p>
              </div>
              <div className="grid gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${pool.id}-${day}`}
                      // Check against local state for responsiveness
                      checked={selectedDaysLocal.includes(day)}
                      onCheckedChange={(checked) => handleCheckedChange(checked, day)}
                    />
                    <Label htmlFor={`${pool.id}-${day}`}>{day}</Label>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveChanges} size="sm">Save Changes</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering drag
            if (window.confirm(`Are you sure you want to delete the pool "${pool.title}"?`)) {
               removePool(pool.id);
            }
          }}
          className="text-red-500 hover:text-red-700 ml-1 flex-shrink-0 p-1"
          // Also stop pointer down here to be safe
          onPointerDown={(e) => e.stopPropagation()} 
        >
          ×
        </button>
      </div>

      {/* Canvas Area */}
      <div className="overflow-hidden relative rounded-b-lg" style={{ height: '400px' }}>
        {/* Use a stable key for Stage if it helps performance/bugs */}
        <Stage
          key={`stage-${pool.id}`}
          width={dynamicWidth} // Use width passed from wrapper
          height={CANVAS_HEIGHT} // Height of the scrollable content
          className="bg-white"
          listening={true} // Enable listening for potential drops
        >
          <Layer>
            {/* Hour Labels Area (Fixed Position) */}
            <Rect x={0} y={0} width={HOUR_LABEL_WIDTH} height={CANVAS_HEIGHT} fill="#f9fafb" />
            {Array.from({ length: 24 }).map((_, hour) => (
              <Text
                key={`hour-label-${hour}`}
                x={5}
                y={hour * GRID_HOUR_HEIGHT + 5}
                text={format(new Date(0, 0, 0, hour), "ha")}
                fontSize={10}
                fill="#6b7280"
                width={HOUR_LABEL_WIDTH - 10}
                align="right"
                listening={false} // Not interactive
              />
            ))}

            {/* Dotted Hour Lines (Span full dynamic width) */}
            {Array.from({ length: 24 }).map((_, i) => (
              <Rect
                key={`hour-line-${i}`}
                x={HOUR_LABEL_WIDTH} // Start after labels
                y={i * GRID_HOUR_HEIGHT}
                width={dynamicWidth - HOUR_LABEL_WIDTH} // Fill remaining width
                height={1}
                fill="#e5e7eb"
                dash={[4, 2]}
                listening={false}
              />
            ))}

            {/* --- Day Columns --- */}
            {DAYS_OF_WEEK.map((dayOfWeek, index) => {
              const isSelected = selectedDaysSetProp.has(dayOfWeek);
              const columnX = getColumnXByIndex(index);
              // Render the column structure but control visibility/opacity
              return (
                <Group
                  key={`day-column-${dayOfWeek}`}
                  x={columnX}
                  y={0}
                  // Hide unselected columns visually OR use opacity
                  visible={isSelected} 
                  // opacity={isSelected ? 1 : 0.2} 
                  listening={isSelected} // Only allow drops on selected days
                  id={`pool-${pool.id}-day-${dayOfWeek}`} // ID for drop detection
                >
                  {/* Vertical Divider Line */}
                  <Rect x={0} y={0} width={1} height={CANVAS_HEIGHT} fill="#e5e7eb" listening={false} />
                  {/* Day Header Text (within the column) */}
                  <Text
                    text={dayOfWeek}
                    x={0} 
                    y={5} 
                    fontSize={14}
                    fill={isSelected ? "#374151" : "#9ca3af"} 
                    width={DAY_COLUMN_WIDTH}
                    align="center"
                    padding={5}
                    listening={false}
                  />
                   {/* Droppable Area Rectangle (Optional: for better visual feedback or specific drop zone) */}
                   {/* 
                   <Rect 
                     x={1} 
                     y={0} 
                     width={DAY_COLUMN_WIDTH - 1} 
                     height={CANVAS_HEIGHT} 
                     fill="rgba(0,0,255,0.0)" // Transparent 
                     // Add drop handling logic here if needed per-day
                   /> 
                   */}
                </Group>
              );
            })}
            {/* --- End Day Columns --- */}

            {/* --- Course Blocks (Render based on sorted selected days) --- */}
            {sortedPoolDays.map((poolDay) => {
              const dayIndex = DAYS_OF_WEEK.indexOf(poolDay.day);
              const blockX = getColumnXByIndex(dayIndex); // Position based on absolute index
              const sessions = getSessionsForPoolDay(pool.id, poolDay.day);
              return sessions.map((session) => (
                <Group key={session.id} x={blockX} y={session.start}>
                  <Rect
                    width={DAY_COLUMN_WIDTH}
                    height={session.end - session.start}
                    fill="#4f46e5"
                    opacity={0.8}
                    cornerRadius={5}
                  />
                  <Text
                    text={session.courseId} // Display course ID or title
                    x={10}
                    y={10}
                    fill="white"
                    fontSize={12}
                    width={DAY_COLUMN_WIDTH - 20}
                    wrap="char"
                    ellipsis={true}
                  />
                </Group>
              ));
            })}
            {/* --- End Course Blocks --- */}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default ZoomablePoolCanvas;