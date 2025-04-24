import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import { Pool, DayOfWeek } from "@/lib/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDragStore } from "@/stores/dragStore";
import { DraggableAttributes } from "@dnd-kit/core";
import { DraggableSyntheticListeners } from '@dnd-kit/core';
import { Settings } from "lucide-react"; // Icon for options
import { format } from "date-fns"; // For formatting hour labels

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
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  dynamicWidth: number; // Width calculated by parent
}

// Constants
const CANVAS_HEIGHT = 1440;
const GRID_HOUR_HEIGHT = 60;
const HEADER_HEIGHT = 30; // Height for the day headers
const DAY_COLUMN_WIDTH = 200;
const HOUR_LABEL_WIDTH = 60;
const DAY_COLUMN_START = HOUR_LABEL_WIDTH;


const ZoomablePoolCanvas = ({ pool, dragAttributes, dragListeners, dynamicWidth }: ZoomablePoolCanvasProps) => {
  // Store hooks
  const { removePool, updatePoolDays } = useScheduleStore();

  // Popover state
  const [open, setOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(() =>
    pool.days.map(pd => pd.day)
  );

  // Sync local selected days if pool prop changes
  useEffect(() => {
    setSelectedDays(pool.days.map(pd => pd.day));
  }, [pool.days]);

  // --- Sort the currently selected days for consistent rendering order ---
  const sortedPoolDays = [...pool.days].sort((a, b) =>
    DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day)
  );
  // --- End Sorting ---

  // Create a Set for efficient lookup of selected days
  const selectedDaysSet = new Set(pool.days.map(pd => pd.day));

  // Debug log
  useEffect(() => {
    console.log('Pool Canvas Mounted/Updated:', {
      pool,
      sortedDays: sortedPoolDays.map(d => d.day), // Log sorted days
      canvasWidth: dynamicWidth,
      canvasHeight: CANVAS_HEIGHT,
      sessions: pool.days.map(day => useScheduleStore.getState().getSessionsForPoolDay(pool.id, day.day))
    });
  }, [pool, dynamicWidth, sortedPoolDays]); // Add sortedPoolDays dependency

  // Popover save handler
  const handleSaveChanges = () => {
    updatePoolDays(pool.id, selectedDays);
    setOpen(false);
  };

  // Popover checkbox change handler
  const handleCheckedChange = (checked: boolean | 'indeterminate', day: DayOfWeek) => {
    if (checked === true) {
      setSelectedDays(prev => [...prev, day]);
    } else {
      setSelectedDays(prev => prev.filter(d => d !== day));
    }
  };

  // Helper function to calculate the X position of a column based on its index
  const getColumnXByIndex = (index: number): number => {
    // Ensure index is within the valid range for the displayed days
    // No, calculate based on the full week index for consistent spacing
     return DAY_COLUMN_START + (index * DAY_COLUMN_WIDTH);
  };

  return (
    // Main container with rounded corners
    <div className="flex flex-col bg-white border rounded-lg shadow-md">
      {/* Header */}
      <div className="bg-gray-50 border-b p-2 flex items-center space-x-2 rounded-t-lg">
        {/* Drag Handle */}
        <div
          className="p-1 cursor-move touch-none"
          {...dragAttributes}
          {...dragListeners}
        >
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
            <Button variant="ghost" size="sm" className="p-1 h-auto">
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
                      checked={selectedDays.includes(day)}
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
            e.stopPropagation();
            if (window.confirm(`Are you sure you want to delete the pool "${pool.title}"?`)) {
               removePool(pool.id);
            }
          }}
          className="text-red-500 hover:text-red-700 ml-1 flex-shrink-0 p-1"
        >
          ×
        </button>
      </div>

      {/* Canvas Area */}
      <div className="overflow-hidden relative rounded-b-lg" style={{ height: '400px' }}>
        <Stage
          key={`stage-${pool.id}-${pool.days.map(d => d.id).join('-')}`}
          width={dynamicWidth}
          height={CANVAS_HEIGHT + HEADER_HEIGHT}
          className="bg-white"
          listening={false}
        >
          <Layer>
            {/* --- Day Headers Area --- */}
            <Group x={0} y={0}>
              {/* Background for Header Area */}
              <Rect x={0} y={0} width={dynamicWidth} height={HEADER_HEIGHT} fill="#f9fafb" /> 
              {/* Divider line below headers */}
              <Rect x={0} y={HEADER_HEIGHT -1} width={dynamicWidth} height={1} fill="#e5e7eb"/>
              {/* Hour Label Area Placeholder in Header */}
              <Rect x={0} y={0} width={HOUR_LABEL_WIDTH} height={HEADER_HEIGHT} fill="#f9fafb" />
              {/* Day Header Texts */}
              {DAYS_OF_WEEK.map((dayOfWeek, index) => {
                const isSelected = selectedDaysSet.has(dayOfWeek);
                const columnX = getColumnXByIndex(index);
                return (
                    <Group 
                      key={`header-${dayOfWeek}`} 
                      x={columnX} 
                      y={0} 
                      opacity={isSelected ? 1 : 0.3}
                     >
                      <Text 
                        text={dayOfWeek} 
                        x={0} 
                        y={5} 
                        fontSize={14} 
                        fill={isSelected ? "#374151" : "#9ca3af"} 
                        width={DAY_COLUMN_WIDTH} 
                        height={HEADER_HEIGHT - 5}
                        align="center" 
                        verticalAlign="middle"
                        />
                    </Group>
                  );
                })}
            </Group>
            {/* --- End Day Headers Area --- */}


            {/* --- Main Time Grid Group (Offset for Header) --- */}
            <Group x={0} y={HEADER_HEIGHT}> 

               {/* Hour Labels Area */}
               <Rect x={0} y={0} width={HOUR_LABEL_WIDTH} height={CANVAS_HEIGHT} fill="#f9fafb" />
               {/* Hour Labels Text */}
               {Array.from({ length: 24 }).map((_, hour) => ( <Text key={`hour-${hour}`} x={5} y={hour * GRID_HOUR_HEIGHT + 5} text={format(new Date(0, 0, 0, hour), "ha")} fontSize={10} fill="#6b7280" width={HOUR_LABEL_WIDTH - 10} align="right" /> ))}

               {/* Dotted Hour Lines */}
               {Array.from({ length: 24 }).map((_, i) => ( <Group key={`hour-line-group-${i}`}> <Rect x={0} y={i * GRID_HOUR_HEIGHT} width={dynamicWidth} height={1} fill="#e5e7eb" dash={[4, 2]} /> </Group> ))}

               {/* --- Day Columns Dividers (Render all 7, style based on selection) --- */}
               {DAYS_OF_WEEK.map((dayOfWeek, index) => {
                  const isSelected = selectedDaysSet.has(dayOfWeek);
                  // Calculate X based on absolute index
                  const columnX = getColumnXByIndex(index);
                  return (
                    <Group 
                      key={`day-divider-${dayOfWeek}`} 
                      x={columnX} 
                      y={0} // Relative to parent Group (which is already offset)
                      opacity={isSelected ? 1 : 0.3}
                    >
                      {/* Vertical Divider Line */}
                      <Rect x={0} y={0} width={1} height={CANVAS_HEIGHT} fill="#e5e7eb" />
                    </Group>
                  );
              })}
              {/* --- End Day Columns Dividers --- */}

              {/* --- Course Blocks (Iterate ONLY selected days) --- */}
              {sortedPoolDays.map((poolDay) => {
                const dayIndex = DAYS_OF_WEEK.indexOf(poolDay.day);
                // Calculate X based on absolute index relative to the start of the day columns area
                const blockX = getColumnXByIndex(dayIndex); 
                const sessions = useScheduleStore.getState().getSessionsForPoolDay(pool.id, poolDay.day);

                return sessions.map((session) => (
                  // Position relative to the main grid group (already offset by HEADER_HEIGHT)
                  <Group key={session.id} x={blockX} y={session.start} > 
                    <Rect width={DAY_COLUMN_WIDTH} height={session.end - session.start} fill="#4f46e5" opacity={0.8} cornerRadius={5} />
                    <Text text={session.courseId} x={10} y={10} fill="white" fontSize={12} width={DAY_COLUMN_WIDTH - 20} wrap="char" ellipsis={true} />
                  </Group>
                ));
              })}
              {/* --- End Course Blocks --- */}

            </Group> {/* --- End Main Time Grid Group --- */}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default ZoomablePoolCanvas;