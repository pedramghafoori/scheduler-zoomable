import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { Course, DayOfWeek, Pool, PoolDay, Session } from "@/lib/types";
import { COURSE_COLORS, DAYS_OF_WEEK } from "@/lib/constants";

interface ScheduleState {
  pools: Pool[];
  courses: Course[];
  sessions: Session[];
  
  // Actions
  addPool: (title: string, location: string, days: DayOfWeek[]) => void;
  removePool: (poolId: string) => void;
  reorderPools: (activeId: string, overId: string) => void;
  addCourse: (title: string, totalHours: number) => void;
  createSession: (courseId: string, poolId: string, day: DayOfWeek, start: number, end: number) => string;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  removeCourse: (courseId: string) => void;
  
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
    days: [
      { id: "poolday-1", poolId: "pool-1", day: "Monday" as DayOfWeek },
      { id: "poolday-2", poolId: "pool-1", day: "Wednesday" as DayOfWeek },
      { id: "poolday-3", poolId: "pool-1", day: "Friday" as DayOfWeek },
    ],
  },
  {
    id: "pool-2",
    title: "Training Pool",
    location: "Building B",
    days: [
      { id: "poolday-4", poolId: "pool-2", day: "Tuesday" as DayOfWeek },
      { id: "poolday-5", poolId: "pool-2", day: "Thursday" as DayOfWeek },
      { id: "poolday-6", poolId: "pool-2", day: "Saturday" as DayOfWeek },
      { id: "poolday-7", poolId: "pool-2", day: "Sunday" as DayOfWeek },
    ],
  },
];

const INITIAL_COURSES = [
  { id: "course-1", title: "Bronze", totalHours: 3, color: "#ef4444" },
  { id: "course-2", title: "Silver", totalHours: 5, color: "#6366f1" },
  { id: "course-3", title: "Gold", totalHours: 10, color: "#f59e0b" },
  { id: "course-4", title: "NL", totalHours: 40, color: "#10b981" },
];

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      pools: INITIAL_POOLS,
      courses: INITIAL_COURSES,
      sessions: [],

      addPool: (title, location, days) => {
        const newPoolId = nanoid();
        const poolDays = days.map((day) => ({
          id: nanoid(),
          poolId: newPoolId,
          day,
        }));

        set((state) => ({
          pools: [
            ...state.pools,
            {
              id: newPoolId,
              title,
              location,
              days: poolDays,
            },
          ],
        }));
      },

      removePool: (poolId) => {
        set((state) => ({
          pools: state.pools.filter((pool) => pool.id !== poolId),
          sessions: state.sessions.filter((session) => session.poolId !== poolId),
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

      addCourse: (title, totalHours) => {
        const colorIndex = get().courses.length % COURSE_COLORS.length;
        
        set((state) => ({
          courses: [
            ...state.courses,
            {
              id: nanoid(),
              title,
              totalHours,
              color: COURSE_COLORS[colorIndex],
            },
          ],
        }));
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

      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...updates } : session
          ),
        }));
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
