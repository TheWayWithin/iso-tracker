'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface AccessibleSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  description?: string;
  ariaLabel?: string;
}

export function AccessibleSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  description,
  ariaLabel,
}: AccessibleSliderProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}: <span className="font-bold">{value}</span> / {max}
      </Label>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        aria-label={ariaLabel || label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="w-full"
      />
      {description && (
        <p className="text-sm text-muted-foreground" id={`${id}-description`}>
          {description}
        </p>
      )}
    </div>
  );
}
