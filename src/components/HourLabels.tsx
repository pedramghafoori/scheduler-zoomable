import { GRID_START_HOUR, GRID_END_HOUR } from "@/lib/constants";

const HourLabels = () => {
  const hours = Array.from(
    { length: GRID_END_HOUR - GRID_START_HOUR + 1 },
    (_, i) => GRID_START_HOUR + i
  );

  return (
    <div className="hour-labels">
      {hours.map((hour) => (
        <div key={hour} className="hour-label">
          {hour.toString().padStart(2, "0")}:00
        </div>
      ))}
    </div>
  );
};

export default HourLabels;
