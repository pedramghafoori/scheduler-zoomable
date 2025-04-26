import { useEffect, useState } from "react";
import { COURSE_COLORS } from "@/lib/constants";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Plus, X } from "lucide-react";
import { Button } from "./button";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

// Load custom colors from localStorage
const loadCustomColors = (): string[] => {
  const stored = localStorage.getItem('custom-colors');
  return stored ? JSON.parse(stored) : [];
};

// Save custom colors to localStorage
const saveCustomColors = (colors: string[]) => {
  localStorage.setItem('custom-colors', JSON.stringify(colors));
};

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [customColors, setCustomColors] = useState<string[]>(loadCustomColors);
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(value);

  // Save custom colors whenever they change
  useEffect(() => {
    saveCustomColors(customColors);
  }, [customColors]);

  const handleSaveCustomColor = () => {
    if (!customColors.includes(tempColor) && !COURSE_COLORS.includes(tempColor)) {
      setCustomColors([...customColors, tempColor]);
    }
    onChange(tempColor);
    setIsOpen(false);
  };

  const handleDeleteColor = (colorToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomColors(customColors.filter(color => color !== colorToDelete));
    if (value === colorToDelete) {
      onChange(COURSE_COLORS[0]);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="grid grid-cols-6 gap-2">
        {COURSE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-full transition-all relative ${
              value === color ? 'ring-2 ring-offset-2 ring-black' : ''
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
        {customColors.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-full transition-all relative group ${
              value === color ? 'ring-2 ring-offset-2 ring-black' : ''
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          >
            <button
              onClick={(e) => handleDeleteColor(color, e)}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-100 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-gray-600" />
            </button>
          </button>
        ))}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`w-8 h-8 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors`}
            >
              <Plus className="h-4 w-4 text-gray-500" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-color">Custom Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-color"
                    type="color"
                    value={tempColor}
                    onChange={(e) => setTempColor(e.target.value)}
                    className="w-24 h-8"
                  />
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: tempColor }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveCustomColor}
                >
                  Save Color
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
} 