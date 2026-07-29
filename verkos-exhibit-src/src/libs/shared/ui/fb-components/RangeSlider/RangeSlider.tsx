export interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  rangeLabelSuffix?: string;
  hint?: string;
}

const RangeSlider = ({
  value,
  onChange,
  min,
  max,
  label,
  rangeLabelSuffix,
  hint,
}: RangeSliderProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between gap-1">
        <label htmlFor="range-slider" className="fb-body-1 text-text-1">
          {label}
        </label>
        <p className="fb-body-1 text-text-2">{value}</p>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        min={min}
        max={max}
        className="fb-body-2 text-text-2 w-full "
      />

      {rangeLabelSuffix && (
        <div className="flex items-center justify-between">
          <p className="fb-body-2 text-text-2">
            {min}
            {rangeLabelSuffix}
          </p>
          {Array.from({ length: (max - min) / 50 + 1 }, (_, i) => i * 50).map(
            (value) =>
              value <= min ? null : (
                <p key={value} className="fb-body-2 text-text-2 text-center">
                  {value}
                  {rangeLabelSuffix}
                </p>
              )
          )}
          <p className="fb-body-2 text-text-2">
            {max}
            {rangeLabelSuffix}
          </p>
        </div>
      )}

      {hint && <span className="fb-body-2 text-text-2">{hint}</span>}
    </div>
  );
};

export default RangeSlider;
