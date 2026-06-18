import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorStateProps {
  message?: string;
  className?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = '데이터를 불러오지 못했습니다.', className, onRetry }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 gap-3 text-center', className)}>
      <div className="w-[72px] h-[72px] rounded-2xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center text-red-400">
        <AlertTriangle size={28} />
      </div>
      <p className="text-sm font-medium text-gray-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-indigo-500 hover:text-indigo-700 underline underline-offset-2"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
