import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { Course, DayOfWeek, Pool, PoolDay, Session } from "@/lib/types";
import { COURSE_COLORS, DAYS_OF_WEEK } from "@/lib/constants";

// --- Constants for Dimensions and Placement --- 
const WHITEBOARD_CONTENT_WIDTH = 20000;
const WHITEBOARD_CONTENT_HEIGHT = 20000;
const DAY_COLUMN_WIDTH = 200;
const HOUR_LABEL_WIDTH = 60;
const GRID_HOUR_HEIGHT = 60;
const POOL_HEADER_HEIGHT_APPROX = 40;
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 18;
const PLACEMENT_OFFSET = 30; // Offset for overlapping pools

// --- Helper Functions --- 
const calculatePoolDimensions = (pool: Pool | { days: DayOfWeek[], startHour?: number, endHour?: number }) => {
  // Width calculation
  const width = HOUR_LABEL_WIDTH + (pool.days.length * DAY_COLUMN_WIDTH);
  const minWidth = HOUR_LABEL_WIDTH + 50;
  const finalWidth = pool.days.length > 0 ? width : minWidth;
  
  // Height calculation
  const startHour = pool.startHour ?? DEFAULT_START_HOUR;
  const endHour = pool.endHour ?? DEFAULT_END_HOUR;
  const hoursToShow = Math.max(1, endHour - startHour);
  const stageContentHeight = hoursToShow * GRID_HOUR_HEIGHT;
  const finalHeight = stageContentHeight + POOL_HEADER_HEIGHT_APPROX;
  
  return { width: finalWidth, height: finalHeight };
};

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const checkOverlap = (rect1: Rect, rect2: Rect): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

interface ScheduleState {
  pools: Pool[];
  courses: Course[];
  sessions: Session[];
  actionHistory: { state: { pools: Pool[]; courses: Course[]; sessions: Session[] }; action: string }[];
  currentActionIndex: number;
  
  // Actions
  addPool: (title: string, location: string, days: DayOfWeek[]) => void;
  removePool: (poolId: string) => void;
  updatePoolDays: (poolId: string, selectedDays: DayOfWeek[]) => void;
  updatePoolPosition: (poolId: string, x: number, y: number) => void;
  updatePoolTimeRange: (poolId: string, startHour: number, endHour: number) => void;
  reorderPools: (activeId: string, overId: string) => void;
  addCourse: (name: string, totalHours: number, color?: string) => void;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  createSession: (courseId: string, poolId: string, day: DayOfWeek, start: number, end: number) => string;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  removeCourse: (courseId: string) => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: (action: string) => void;
  
  // Computed
  getSessionsForPoolDay: (poolId: string, day: DayOfWeek) => Session[];
  getSessionsForCourse: (courseId: string) => Session[];
  getScheduledMinutesForCourse: (courseId: string) => number;
  getCourse: (courseId: string) => Course | undefined;
  getPool: (poolId: string) => Pool | undefined;
}

const INITIAL_POOLS: Pool[] = [
  {
    id: "pool-1",
    title: "Main Pool",
    location: "Building A",
    startHour: DEFAULT_START_HOUR,
    endHour: DEFAULT_END_HOUR,
    x: WHITEBOARD_CONTENT_WIDTH / 2 - 400, // Place near center
    y: WHITEBOARD_CONTENT_HEIGHT / 2 - 200,
    days: [
      { id: "poolday-1", poolId: "pool-1", day: "Monday" as DayOfWeek },
      { id: "poolday-2", poolId: "pool-1", day: "Wednesday" as DayOfWeek },
      { id: "poolday-3", poolId: "pool-1", day: "Friday" as DayOfWeek },
    ],
    courses: [], // Initialize empty courses array
  },
  {
    id: "pool-2",
    title: "Training Pool",
    location: "Building B",
    startHour: 7, 
    endHour: 20,
    x: WHITEBOARD_CONTENT_WIDTH / 2 + 400, // Place near center, different spot
    y: WHITEBOARD_CONTENT_HEIGHT / 2 - 200,
    days: [
      { id: "poolday-4", poolId: "pool-2", day: "Tuesday" as DayOfWeek },
      { id: "poolday-5", poolId: "pool-2", day: "Thursday" as DayOfWeek },
      { id: "poolday-6", poolId: "pool-2", day: "Saturday" as DayOfWeek },
      { id: "poolday-7", poolId: "pool-2", day: "Sunday" as DayOfWeek },
    ],
    courses: [], // Initialize empty courses array
  },
];

const INITIAL_COURSES = [
  { 
    id: "course-1", 
    name: "Bronze",
    totalHours: 2,
    color: "#ef4444" 
  },
  { 
    id: "course-2", 
    name: "Silver",
    totalHours: 2,
    color: "#6366f1" 
  },
  { 
    id: "course-3", 
    name: "Gold",
    totalHours: 2,
    color: "#f59e0b" 
  },
  { 
    id: "course-4", 
    name: "NL",
    totalHours: 4,
    color: "#10b981" 
  },
];

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      pools: INITIAL_POOLS,
      courses: INITIAL_COURSES,
      sessions: [],
      actionHistory: [],
      currentActionIndex: -1,

      // Helper function to save state to history
      saveToHistory: (action: string) => {
        const currentState = {
          pools: [...get().pools],
          courses: [...get().courses],
          sessions: [...get().sessions],
        };
        
        set((state) => {
          // If we're not at the end of history, remove future actions
          const newHistory = state.currentActionIndex < state.actionHistory.length - 1
            ? state.actionHistory.slice(0, state.currentActionIndex + 1)
            : state.actionHistory;
            
          return {
            actionHistory: [...newHistory, { state: currentState, action }],
            currentActionIndex: newHistory.length,
          };
        });
      },

      undo: () => {
        set((state) => {
          if (state.currentActionIndex > 0) {
            const previousState = state.actionHistory[state.currentActionIndex - 1];
            return {
              pools: [...previousState.state.pools],
              courses: [...previousState.state.courses],
              sessions: [...previousState.state.sessions],
              actionHistory: state.actionHistory,
              currentActionIndex: state.currentActionIndex - 1,
            };
          }
          return state;
        });
      },

      redo: () => {
        set((state) => {
          if (state.currentActionIndex < state.actionHistory.length - 1) {
            const nextState = state.actionHistory[state.currentActionIndex + 1];
            return {
              pools: [...nextState.state.pools],
              courses: [...nextState.state.courses],
              sessions: [...nextState.state.sessions],
              actionHistory: state.actionHistory,
              currentActionIndex: state.currentActionIndex + 1,
            };
          }
          return state;
        });
      },

      canUndo: () => get().currentActionIndex > 0,
      canRedo: () => get().currentActionIndex < get().actionHistory.length - 1,

      addPool: (title, location, days) => {
        const newPoolId = nanoid();
        const poolDays = days.map((day) => ({
          id: nanoid(),
          poolId: newPoolId,
          day,
        }));

        let targetX = WHITEBOARD_CONTENT_WIDTH / 2;
        let targetY = WHITEBOARD_CONTENT_HEIGHT / 2;

        // Calculate dimensions of the potential new pool
        const { width: newPoolWidth, height: newPoolHeight } = calculatePoolDimensions({
          days: days, // Pass the selected days
          startHour: DEFAULT_START_HOUR, // Use defaults for calculation
          endHour: DEFAULT_END_HOUR
        });
        
        const newPoolRect: Rect = { 
          x: targetX - newPoolWidth / 2, // Center the rect 
          y: targetY - newPoolHeight / 2, 
          width: newPoolWidth, 
          height: newPoolHeight 
        };

        const existingPools = get().pools;
        let positionAdjusted = false;

        for (const existingPool of existingPools) {
          const { width: existingWidth, height: existingHeight } = calculatePoolDimensions(existingPool);
          const existingPoolRect: Rect = {
            x: existingPool.x ?? 0,
            y: existingPool.y ?? 0,
            width: existingWidth,
            height: existingHeight
          };

          // Adjust new pool's target rect for centering before overlap check
          const centeredNewPoolRect: Rect = { ...newPoolRect, x: targetX - newPoolWidth / 2, y: targetY - newPoolHeight / 2 };

          if (checkOverlap(centeredNewPoolRect, existingPoolRect)) {
            console.log(`New pool target center overlaps with pool ${existingPool.id}. Adjusting position.`);
            // Offset diagonally from the overlapping pool
            targetX = existingPoolRect.x + existingWidth + PLACEMENT_OFFSET; 
            targetY = existingPoolRect.y + PLACEMENT_OFFSET;
            positionAdjusted = true;
            break; // Adjust based on the first overlap found
          }
        }
        
        // Correct final position calculation
        const finalX = positionAdjusted ? targetX : (targetX - newPoolWidth / 2);
        const finalY = positionAdjusted ? targetY : (targetY - newPoolHeight / 2);

        set((state) => {
          const newState = {
            pools: [
              ...state.pools,
              {
                id: newPoolId,
                title,
                location,
                days: poolDays,
                startHour: DEFAULT_START_HOUR,
                endHour: DEFAULT_END_HOUR,
                x: finalX,
                y: finalY,
                courses: [],
              },
            ],
          };
          get().saveToHistory('addPool');
          return newState;
        });
      },

      removePool: (poolId) => {
        set((state) => {
          const newState = {
            pools: state.pools.filter((pool) => pool.id !== poolId),
            sessions: state.sessions.filter((session) => session.poolId !== poolId),
          };
          get().saveToHistory('removePool');
          return newState;
        });
      },

      updatePoolDays: (poolId, selectedDays) => {
        set((state) => ({
          pools: state.pools.map((pool) => {
            if (pool.id === poolId) {
              const newPoolDays: PoolDay[] = selectedDays.map(day => ({
                id: nanoid(),
                poolId: poolId,
                day: day
              }));
              return { ...pool, days: newPoolDays };
            }
            return pool;
          }),
        }));
      },

      updatePoolPosition: (poolId, x, y) => {
        set((state) => ({
          pools: state.pools.map((pool) =>
            pool.id === poolId ? { ...pool, x: x, y: y } : pool
          ),
        }));
      },

      updatePoolTimeRange: (poolId, startHour, endHour) => {
        set((state) => ({
          pools: state.pools.map((pool) => 
            pool.id === poolId ? { ...pool, startHour, endHour } : pool
          ),
        }));
      },

      reorderPools: (activeId, overId) => {
        set((state) => {
          const oldIndex = state.pools.findIndex((pool) => pool.id === activeId);
          const newIndex = state.pools.findIndex((pool) => pool.id === overId);

          if (oldIndex === -1 || newIndex === -1) return state;

          const newPools = [...state.pools];
          const [movedPool] = newPools.splice(oldIndex, 1);
          newPools.splice(newIndex, 0, movedPool);

          return { ...state, pools: newPools };
        });
      },

      addCourse: (name: string, totalHours: number, color?: string) => {
        const colorIndex = get().courses.length % COURSE_COLORS.length;
        
        set((state) => {
          const newState = {
            ...state,
            courses: [
              ...state.courses,
              {
                id: nanoid(),
                name,
                totalHours,
                color: color || COURSE_COLORS[colorIndex],
              },
            ],
          };
          get().saveToHistory('addCourse');
          return newState;
        });
      },

      updateCourse: (courseId: string, updates: Partial<Course>) => {
        set((state) => {
          const newState = {
            ...state,
            courses: state.courses.map((course) =>
              course.id === courseId ? { ...course, ...updates } : course
            ),
          };
          get().saveToHistory('updateCourse');
          return newState;
        });
      },

      createSession: (courseId, poolId, day, start, end) => {
        const id = nanoid();
        
        set((state) => ({
          sessions: [
            ...state.sessions,
            {
              id,
              courseId,
              poolId,
              day,
              start,
              end,
            },
          ],
        }));
        
        return id;
      },

      updateSession: (sessionId, updates) => {
        console.log('Updating session:', {
          sessionId,
          updates,
          beforeState: get().sessions.find(s => s.id === sessionId),
        });
        
        set((state) => {
          const newSessions = state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, ...updates }
              : session
          );
          
          const updatedSession = newSessions.find(s => s.id === sessionId);
          console.log('Session updated:', {
            sessionId,
            afterState: updatedSession,
          });
          
          const newState = { sessions: newSessions };
          get().saveToHistory('updateSession');
          return newState;
        });
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
        }));
      },

      removeCourse: (courseId) => {
        set((state) => ({
          courses: state.courses.filter((course) => course.id !== courseId),
          sessions: state.sessions.filter((session) => session.courseId !== courseId),
        }));
      },

      getSessionsForPoolDay: (poolId, day) => {
        return get().sessions.filter(
          (session) => session.poolId === poolId && session.day === day
        );
      },

      getSessionsForCourse: (courseId) => {
        return get().sessions.filter((session) => session.courseId === courseId);
      },

      getScheduledMinutesForCourse: (courseId) => {
        const sessions = get().getSessionsForCourse(courseId);
        return sessions.reduce((total, session) => total + (session.end - session.start), 0);
      },

      getCourse: (courseId) => {
        return get().courses.find((course) => course.id === courseId);
      },

      getPool: (poolId) => {
        return get().pools.find((pool) => pool.id === poolId);
      },
    }),
    {
      name: "schedule-store",
    }
  )
);
