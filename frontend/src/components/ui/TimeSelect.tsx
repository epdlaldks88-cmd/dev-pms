import { cn } from '../../lib/utils';

interface Props {
  value: string;                 // "HH:mm" 형식 (빈 문자열 허용)
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  step?: number;                 // 분 단위 간격 (기본 30분)
}

// 00:00 ~ 23:30 시간 옵션 생성
function buildOptions(step: number) {
  const opts: { value: string; label: string }[] = [];
  for (let m = 0; m < 24 * 60; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const value = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    const ampm = h < 12 ? '오전' : '오후';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const label = `${ampm} ${h12}:${String(min).padStart(2, '0')}`;
    opts.push({ value, label });
  }
  return opts;
}

export function TimeSelect({ value, onChange, className, placeholder = '시간 선택', step = 30 }: Props) {
  const options = buildOptions(step);
  // 현재 값이 옵션에 없으면(예: 09:15) 그 값도 보여주도록 추가
  const hasValue = value && !options.some((o) => o.value === value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500',
        !value && 'text-gray-400',
        className,
      )}
    >
      <option value="">{placeholder}</option>
      {hasValue && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value} className="text-gray-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}
