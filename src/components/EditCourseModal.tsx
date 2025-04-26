import { useState, useEffect } from 'react';
import { Session } from '@/lib/types';
import { useScheduleStore } from '@/stores/scheduleStore';

interface EditCourseModalProps {
  courseId: string;
  onClose: () => void;
}

const EditCourseModal = ({ courseId, onClose }: EditCourseModalProps) => {
  const scheduleStore = useScheduleStore();
  const session = scheduleStore.sessions.find(s => s.courseId === courseId);
  
  // Convert total duration to hours and minutes
  const initialDuration = session ? session.end - session.start : 60;
  const [hours, setHours] = useState(Math.floor(initialDuration / 60));
  const [minutes, setMinutes] = useState(initialDuration % 60);
  const [error, setError] = useState<string | null>(null);

  const validateDuration = (newHours: number, newMinutes: number): boolean => {
    if (newHours === 0 && newMinutes === 0) {
      setError('Duration cannot be zero');
      return false;
    }
    setError(null);
    return true;
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHours = parseInt(e.target.value);
    setHours(newHours);
    validateDuration(newHours, minutes);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = parseInt(e.target.value);
    setMinutes(newMinutes);
    validateDuration(hours, newMinutes);
  };

  const handleSave = () => {
    if (!session) return;
    
    const totalMinutes = (hours * 60) + minutes;
    if (!validateDuration(hours, minutes) || totalMinutes < 15) return;
    
    const newEnd = session.start + totalMinutes;
    scheduleStore.updateSession(session.id, {
      ...session,
      end: newEnd
    });
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.modal-content')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!session) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div 
        className="modal-content bg-white rounded-lg p-6 w-96 shadow-xl"
        onClick={handleModalClick}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Edit Course Duration</h3>
        <div className="mb-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours
              </label>
              <select
                value={hours}
                onChange={handleHoursChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minutes
              </label>
              <select
                value={minutes}
                onChange={handleMinutesChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <option key={i} value={i * 15}>{i * 15}</option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={!!error || (hours === 0 && minutes === 0)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCourseModal;
