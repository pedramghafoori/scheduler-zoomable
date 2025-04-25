export interface Pool {
  id: string;
  name: string;
  days: string[];
  courses: Course[];
}

export interface Course {
  id: string;
  name: string;
  day: string;
  startTime: number;
  endTime: number;
} 