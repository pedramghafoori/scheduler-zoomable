import { DayOfWeek } from "./types";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday', 
  'Tuesday', 
  'Wednesday', 
  'Thursday', 
  'Friday', 
  'Saturday', 
  'Sunday'
];

// Change from 'export { DayOfWeek }' to 'export type { DayOfWeek }'
export type { DayOfWeek };

export const GRID_START_HOUR = 7; // 7 AM
export const GRID_END_HOUR = 22; // 10 PM
export const HOUR_HEIGHT = 60; // pixels

export const DEFAULT_SESSION_DURATION = 60; // minutes

export const COURSE_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
];

export const INITIAL_COURSES = [
  { id: "course-1", title: "Bronze", totalHours: 3, color: "#ef4444" },
  { id: "course-2", title: "Silver", totalHours: 5, color: "#6366f1" },
  { id: "course-3", title: "Gold", totalHours: 10, color: "#f59e0b" },
  { id: "course-4", title: "NL", totalHours: 40, color: "#10b981" },
];

export const INITIAL_POOLS = [
  {
    id: "pool-1",
    title: "Main Pool",
    location: "Building A",
    days: [
      { id: "poolday-1", poolId: "pool-1", day: "Monday" },
      { id: "poolday-2", poolId: "pool-1", day: "Wednesday" },
      { id: "poolday-3", poolId: "pool-1", day: "Friday" },
    ],
  },
  {
    id: "pool-2",
    title: "Training Pool",
    location: "Building B",
    days: [
      { id: "poolday-4", poolId: "pool-2", day: "Tuesday" },
      { id: "poolday-5", poolId: "pool-2", day: "Thursday" },
      { id: "poolday-6", poolId: "pool-2", day: "Saturday" },
      { id: "poolday-7", poolId: "pool-2", day: "Sunday" },
    ],
  },
];
