import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import { Pool, DayOfWeek } from "@/lib/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { Settings } from "lucide-react"; // Icon for options
import { format } from "date-fns"; // For formatting hour labels
import { DraggableSyntheticListeners, DraggableAttributes } from '@dnd-kit/core'; // Import this
import { Input } from "@/components/ui/input"; // Import Input
import { useDroppable } from "@dnd-kit/core"; // Import useDroppable
import CourseBlock from "@/components/CourseBlock"; // Add CourseBlock import

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
const POOL_HEADER_HEIGHT_APPROX = 40; // Approximate height of the header div above the canvas
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 22;

const ZoomablePoolCanvas = ({ pool, dynamicWidth, dragListeners, dragAttributes }: ZoomablePoolCanvasProps) => {
  // Store hooks
  const { removePool, updatePoolDays, getSessionsForPoolDay, updatePoolTimeRange, getCourse } = useScheduleStore();

  // Popover state for day and time selection
  const [open, setOpen] = useState(false);
  const [selectedDaysLocal, setSelectedDaysLocal] = useState<DayOfWeek[]>(() =>
    pool.days.map(pd => pd.day)
  );
  // Add local state for hours
  const [startHourLocal, setStartHourLocal] = useState<number>(pool.startHour ?? DEFAULT_START_HOUR);
  const [endHourLocal, setEndHourLocal] = useState<number>(pool.endHour ?? DEFAULT_END_HOUR);

  // Sync local state if pool prop changes
  useEffect(() => {
    setSelectedDaysLocal(pool.days.map(pd => pd.day));
    setStartHourLocal(pool.startHour ?? DEFAULT_START_HOUR);
    setEndHourLocal(pool.endHour ?? DEFAULT_END_HOUR);
  }, [pool.days, pool.startHour, pool.endHour]);

  // --- Sort the currently selected days from the prop for rendering order --- 
  const sortedPoolDays = [...pool.days].sort((a, b) =>
    DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day)
  );
  // --- End Sorting --- 

  // Define default hours directly in the component or import from constants
  const startHour = pool.startHour ?? DEFAULT_START_HOUR;
  const endHour = pool.endHour ?? DEFAULT_END_HOUR;
  
  // Calculate the number of hours to display
  const hoursToShow = Math.max(1, endHour - startHour);
  
  // Konva Stage should have the full 24-hour height
  const stageInternalHeight = CANVAS_HEIGHT;

  // Calculate the height for the visible canvas wrapper div based on hours to show
  const canvasWrapperHeight = hoursToShow * GRID_HOUR_HEIGHT;

  // Calculate the total component height (including the header)
  const totalComponentHeight = canvasWrapperHeight + POOL_HEADER_HEIGHT_APPROX;

  // Popover save handler
  const handleSaveChanges = () => {
    // Validate hours (e.g., end > start, within 0-24)
    const cleanStart = Math.max(0, Math.min(23, Math.floor(startHourLocal)));
    const cleanEnd = Math.max(cleanStart + 1, Math.min(24, Math.floor(endHourLocal)));
    
    updatePoolDays(pool.id, selectedDaysLocal);
    updatePoolTimeRange(pool.id, cleanStart, cleanEnd); // Save hours
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

  return (
    <div className="flex flex-col bg-white border rounded-lg shadow-md overflow-hidden" 
         style={{ height: `${totalComponentHeight}px` }}> {/* Set total height here */} 
      {/* Header with Pool Info, Drag Handle (optional), Options */}
      <div className="bg-gray-50 border-b p-2 flex items-center space-x-2 rounded-t-lg flex-shrink-0">
        {/* Apply attributes AND listeners to the handle, and stop propagation */}
        <div 
          className="p-1 cursor-move touch-none" 
          onPointerDown={(e) => e.stopPropagation()}
          {...dragListeners} 
          {...dragAttributes}
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
          <PopoverContent className="w-64 p-4">
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

              {/* Time Range Selection */}
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Time Range (0-24)</h4>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`start-${pool.id}`} className="w-12">Start</Label>
                  <Input
                    id={`start-${pool.id}`}
                    type="number"
                    min={0}
                    max={23} // Max start time is 11 PM (23)
                    value={startHourLocal}
                    onChange={(e) => setStartHourLocal(parseInt(e.target.value, 10) || 0)}
                    className="h-8"
                  />
                  <Label htmlFor={`end-${pool.id}`} className="w-12">End</Label>
                  <Input
                    id={`end-${pool.id}`}
                    type="number"
                    min={1} // Min end time is 1 AM (1)
                    max={24}
                    value={endHourLocal}
                    onChange={(e) => setEndHourLocal(parseInt(e.target.value, 10) || 1)}
                    className="h-8"
                  />
                </div>
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

      {/* Canvas Area Wrapper */} 
      <div 
        className="relative rounded-b-lg flex-grow"
        style={{ height: `${canvasWrapperHeight}px` }} // This wrapper controls the *visible* height
      >
        {/* Konva Stage - Use full internal height, offset handles visibility */}
        <Stage
          key={`stage-${pool.id}-visuals`}
          width={dynamicWidth}
          height={stageInternalHeight} // Use full 24h height here
          offsetY={startHour * GRID_HOUR_HEIGHT}
          className="bg-white absolute top-0 left-0 pointer-events-none"
          listening={false}
        >
          <Layer>
            {/* Hour Labels Area - Background to match visible area height */}
            <Rect x={0} y={startHour * GRID_HOUR_HEIGHT} width={HOUR_LABEL_WIDTH} height={canvasWrapperHeight} fill="#f9fafb" />

            {/* Hour Labels - Iterate through all 24 hours, no filtering needed */}
            {Array.from({ length: 24 }).map((_, i) => {
              const hour = i; // Hour from 0 to 23
              return (
                 <Text
                    key={`hour-label-${hour}`}
                    x={5}
                    y={(hour * GRID_HOUR_HEIGHT) + 5} // Position based on 24h scale
                    text={format(new Date(0, 0, 0, hour), "ha")}
                    fontSize={10}
                    fill="#6b7280"
                    width={HOUR_LABEL_WIDTH - 10}
                    align="right"
                    listening={false}
                 />
              );
            })}

            {/* Grid Lines - Iterate through all 24 hours + 1, no filtering needed */}
            {Array.from({ length: 25 }).map((_, i) => {
               const hour = i; // Hour from 0 to 24
               return (
                  <Rect
                     key={`hour-line-${hour}`}
                     x={HOUR_LABEL_WIDTH}
                     y={hour * GRID_HOUR_HEIGHT} // Position based on 24h scale
                     width={dynamicWidth - HOUR_LABEL_WIDTH}
                     height={1}
                     fill="#e5e7eb"
                     dash={[4, 2]}
                     listening={false}
                  />
                );
            })}

            {/* Day Columns */}
            {sortedPoolDays.map((poolDay, index) => {
              const dayOfWeek = poolDay.day;
              const columnX = DAY_COLUMN_START + (index * DAY_COLUMN_WIDTH);
              return (
                <Group key={`day-column-${dayOfWeek}`} x={columnX}>
                  {/* Day Column Vertical Line - Use full internal height */}
                  <Rect x={0} y={0} width={1} height={stageInternalHeight} fill="#e5e7eb" listening={false} />
                  {/* Day Label Text - Positioned relative to startHour within the visible offset */}
                  <Text
                    text={dayOfWeek}
                    x={0}
                    y={(startHour * GRID_HOUR_HEIGHT) + 5} // Position label relative to current view top
                    fontSize={14}
                    fill={"#374151"}
                    width={DAY_COLUMN_WIDTH}
                    align="center"
                    padding={5}
                    listening={false}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>

        {/* HTML Overlay for Drop Zones & Course Blocks */}
        <div
          className="absolute top-0 left-0 w-full h-full"
          // This overlay needs to match the Stage's internal height for correct absolute positioning
          style={{ height: `${stageInternalHeight}px` }}
        >
           <div
             className="relative"
             // This inner div also needs the full internal height
             style={{ width: `${dynamicWidth}px`, height: `${stageInternalHeight}px` }}
            >
               {/* Create droppable div for each visible day column */}
               {sortedPoolDays.map((poolDay, index) => {
                 const dayOfWeek = poolDay.day;
                 const columnX = DAY_COLUMN_START + (index * DAY_COLUMN_WIDTH);
                 
                 // Set up droppable for this column
                 const { setNodeRef, isOver } = useDroppable({
                    id: `pool-${pool.id}-day-${dayOfWeek}`,
                    data: {
                       type: 'pool-day',
                       poolId: pool.id,
                       day: dayOfWeek,
                       columnX,
                       startHour,
                       endHour,
                       gridHourHeight: GRID_HOUR_HEIGHT
                     }
                 });

                 const sessions = getSessionsForPoolDay(pool.id, dayOfWeek);

                 return (
                   <div
                     key={`drop-zone-${dayOfWeek}`}
                     ref={setNodeRef}
                     className={`absolute ${isOver ? 'bg-blue-100 bg-opacity-30' : ''}`}
                     style={{
                       left: `${columnX}px`,
                       width: `${DAY_COLUMN_WIDTH}px`,
                       top: `${(startHour * GRID_HOUR_HEIGHT)}px`, // Position based on startHour offset
                       height: `${canvasWrapperHeight}px`, // Droppable area height matches visible area
                       zIndex: 5,
                       position: 'absolute',
                     }}
                   >
                     {/* Course Blocks Container */}
                     <div className="relative h-full w-full">
                       {sessions.map((session) => (
                         <CourseBlock
                           key={session.id}
                           courseId={session.courseId}
                           session={session}
                           isGrid={true}
                         />
                       ))}
                     </div>
                   </div>
                 );
               })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomablePoolCanvas;