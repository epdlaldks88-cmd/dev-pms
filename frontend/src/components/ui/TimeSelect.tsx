import { useId, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  value: string;                 // "HH:mm" 형식 (빈 문자열 허용)
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  step?: number;                 // 추천 목록 분 단위 간격 (기본 30분)
}

// 00:00 ~ 23:30 추천 시간 옵션 생성
function buildOptions(step: number) {
  const opts: string[] = [];
  for (let m = 0; m < 24 * 60; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    opts.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return opts;
}

// 자유 입력값을 "HH:mm"으로 정규화 ("915"→"09:15", "9:5"→"09:05", "25:99"→무효)
function normalize(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  let h: number, m: number;
  if (s.includes(':')) {
    const [hp, mp] = s.split(':');
    h = parseInt(hp, 10);
    m = parseInt(mp || '0', 10);
  } else {
    const digits = s.replace(/\D/g, '');
    if (digits.length <= 2) { h = parseInt(digits, 10); m = 0; }
    else { h = parseInt(digits.slice(0, digits.length - 2), 10); m = parseInt(digits.slice(-2), 10); }
  }
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return raw; // 무효면 원본 유지
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function TimeSelect({ value, onChange, className, placeholder = '예) 09:30', step = 30 }: Props) {
  const listId = useId();
  const options = buildOptions(step);
  const [text, setText] = useState(value);

  // 외부 value 변경 동기화
  useEffect(() => { setText(value); }, [value]);

  return (
    <>
      <input
        type="text"
        list={listId}
        inputMode="numeric"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          // 목록에서 바로 선택(완성형 HH:mm)이면 즉시 반영
          if (/^\d{2}:\d{2}$/.test(e.target.value)) onChange(e.target.value);
        }}
        onBlur={() => {
          const norm = normalize(text);
          setText(norm);
          onChange(norm);
        }}
        className={cn(
          'w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500',
          className,
        )}
      />
      <datalist id={listId}>
        {options.map((o) => <option key={o} value={o} />)}
      </datalist>
    </>
  );
}
