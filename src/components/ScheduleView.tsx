import { useScheduleStore } from '../stores/scheduleStore';
import ScheduleGrid from './ScheduleGrid';
import CourseBank from './CourseBank';

export const ScheduleView = () => {
  const scheduleStore = useScheduleStore();

  return (
    <div className="flex flex-col h-full">
      <div className="fixed top-16 right-0 z-20 h-12 flex items-center pr-4">
        <div className="flex gap-2">
          <button
            onClick={scheduleStore.undo}
            disabled={!scheduleStore.canUndo()}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Undo
          </button>
          <button
            onClick={scheduleStore.redo}
            disabled={!scheduleStore.canRedo()}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Redo
          </button>
        </div>
      </div>
      <div className="flex-1 flex">
        <CourseBank />
        <ScheduleGrid />
      </div>
    </div>
  );
}; 