import { cn, STATUS_CONFIG } from '../../lib/utils';
import type { TaskStatus } from '../../types';

export function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', cfg.color, cfg.bg)}>
      {cfg.label}
    </span>
  );
}
