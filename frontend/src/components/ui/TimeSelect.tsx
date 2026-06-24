import { cn } from '../../lib/utils';

interface Props {
  value: string;                 // "HH:mm" 형식 (빈 문자열 허용)
  onChange: (value: string) => void;
  className?: string;
}

// 네이티브 time 입력
export function TimeSelect({ value, onChange, className }: Props) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500',
        className,
      )}
    />
  );
}
