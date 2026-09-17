import React from 'react';

// 1. Semi-Circular Arc Gauge (Health, Line utilization)
interface ArcGaugeProps {
  value: number; // 0 to 100
  label: string;
  sublabel?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  colorGradient?: 'emerald' | 'indigo' | 'purple' | 'cyan' | 'amber';
}

export const RadialArcGauge: React.FC<ArcGaugeProps> = ({
  value,
  label,
  sublabel,
  unit = '%',
  size = 'md',
  colorGradient = 'emerald'
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  // Circumference of semi-circle with r=60 is PI * 60 = 188.49
  const radius = 60;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const gradientMap = {
    emerald: { from: '#10b981', to: '#06b6d4', text: 'text-emerald-400' },
    indigo: { from: '#6366f1', to: '#a855f7', text: 'text-indigo-400' },
    purple: { from: '#a855f7', to: '#ec4899', text: 'text-purple-400' },
    cyan: { from: '#06b6d4', to: '#3b82f6', text: 'text-cyan-400' },
    amber: { from: '#f59e0b', to: '#ef4444', text: 'text-amber-400' }
  };

  const colors = gradientMap[colorGradient];
  const gradId = `arc-grad-${colorGradient}-${label.replace(/\s+/g, '')}`;

  const dim = size === 'sm' ? 'w-32 h-20' : size === 'lg' ? 'w-52 h-32' : 'w-40 h-24';
  const valText = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className={`relative ${dim} flex items-center justify-center`}>
        <svg className="w-full h-full overflow-visible" viewBox="0 0 160 90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
          </defs>
          {/* Background Track */}
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke="currentColor"
            className="text-slate-800 dark:text-slate-800/80"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute bottom-1 flex flex-col items-center">
          <div className={`${valText} font-bold font-mono text-slate-900 dark:text-white leading-none`}>
            {value}
            <span className="text-xs font-normal ml-0.5 text-slate-400">{unit}</span>
          </div>
          {sublabel && (
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${colors.text}`}>
              {sublabel}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-2">{label}</span>
    </div>
  );
};

// 2. High-Precision Speedometer Tachometer Gauge
interface SpeedometerGaugeProps {
  value: number; // e.g. 942.5
  max: number; // e.g. 1000
  title: string;
  unit: string;
  accentColor?: 'indigo' | 'purple' | 'cyan';
  peakBurst?: number;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  value,
  max,
  title,
  unit,
  accentColor = 'indigo',
  peakBurst
}) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  // Needle angle: -180 deg to 0 deg
  const needleAngle = -180 + (percent / 100) * 180;
  const radius = 75;
  const circumference = Math.PI * radius; // 235.6
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const gradId = `speedo-grad-${accentColor}`;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative">
      <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">{title}</span>
        <span className="font-mono text-[11px]">Max: {max} {unit}</span>
      </div>

      <div className="relative w-56 h-32 flex items-center justify-center">
        <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 115">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accentColor === 'purple' ? '#9333ea' : '#4f46e5'} />
              <stop offset="100%" stopColor={accentColor === 'purple' ? '#c084fc' : '#818cf8'} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Active progress */}
          <path
            d="M 25 100 A 75 75 0 0 1 175 100"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="16"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Center needle pivot */}
          <g transform={`rotate(${needleAngle}, 100, 100)`} className="transition-transform duration-700 ease-out">
            <line x1="100" y1="100" x2="35" y2="100" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="100" r="2.5" fill="#ffffff" />
          </g>
          <circle cx="100" cy="100" r="7" className="fill-slate-800 dark:fill-white" />
          <circle cx="100" cy="100" r="3" fill="#f43f5e" />
        </svg>

        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white leading-none">
            {value.toFixed(1)}
          </span>
          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {unit}
          </span>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono">
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400">
          Peak: <span className="font-bold text-slate-900 dark:text-slate-200">{peakBurst ?? (value * 1.03).toFixed(1)} {unit}</span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400">
          Line: <span className="font-bold text-emerald-600 dark:text-emerald-400">{percent.toFixed(0)}% Util</span>
        </div>
      </div>
    </div>
  );
};

// 3. Circular Ring Gauge (CPU, RAM, Volume utilization)
interface RingGaugeProps {
  percent: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: 'cyan' | 'emerald' | 'indigo' | 'amber' | 'purple';
}

export const RingGauge: React.FC<RingGaugeProps> = ({
  percent,
  label,
  sublabel,
  size = 64,
  strokeWidth = 6,
  color = 'cyan'
}) => {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const colorClasses = {
    cyan: 'text-cyan-500',
    emerald: 'text-emerald-500',
    indigo: 'text-indigo-500',
    amber: 'text-amber-500',
    purple: 'text-purple-500'
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className={`${colorClasses[color]} transition-all duration-700 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute font-mono font-bold text-xs text-slate-900 dark:text-white">
          {Math.round(percent)}%
        </span>
      </div>
      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">{label}</span>
      {sublabel && <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{sublabel}</span>}
    </div>
  );
};

// 4. Drive Thermal Gauge
interface ThermalGaugeProps {
  bayName: string;
  tempC: number;
}

export const DriveThermalGauge: React.FC<ThermalGaugeProps> = ({ bayName, tempC }) => {
  const isCool = tempC <= 38;
  const isWarm = tempC > 38 && tempC <= 48;
  const colorClass = isCool
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
    : isWarm
    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
    : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60';

  const statusLabel = isCool ? 'Cool' : isWarm ? 'Warm' : 'High';

  return (
    <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center ${colorClass}`}>
      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[80px]">{bayName}</span>
      <div className="font-mono font-extrabold text-sm mt-0.5">{tempC}°C</div>
      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{statusLabel}</span>
    </div>
  );
};
