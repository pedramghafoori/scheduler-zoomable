export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Pool {
  id: string;
  title: string;
  location: string;
  days: PoolDay[];
}

export interface PoolDay {
  id: string;
  poolId: string;
  day: DayOfWeek;
}

export interface Course {
  id: string;
  title: string;
  totalHours: number;
  color: string;
}

export interface Session {
  id: string;
  courseId: string;
  poolId: string;      // Which pool this session belongs to
  day: DayOfWeek;      // Day of the week
  start: number;       // Minutes from midnight
  end: number;         // Minutes from midnight
}

export interface DragSession {
  session: Session;
  offsetY: number;
}
