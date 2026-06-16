import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store/auth.store';
import { formatRelativeTime } from '../../lib/utils';
import { cn } from '../../lib/utils';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    enabled: notifOpen,
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="태스크, 프로젝트 검색..."
            className="w-full h-8 pl-9 pr-3 text-sm bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} />
            {(unread?.count ?? 0) > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unread!.count > 9 ? '9+' : unread!.count}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-10 z-40 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-sm text-gray-900">알림</h3>
                  {(unread?.count ?? 0) > 0 && (
                    <button
                      onClick={() => markAll.mutate()}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      모두 읽음
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {!notifications?.length ? (
                    <p className="text-sm text-gray-400 text-center py-8">알림이 없습니다.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors',
                          !n.isRead && 'bg-indigo-50/50',
                        )}
                        onClick={() => {
                          if (n.link) navigate(n.link);
                          setNotifOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {!n.isRead && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                          <div className={cn('flex-1', n.isRead && 'ml-4')}>
                            <p className="text-xs font-medium text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <Avatar name={user?.name ?? ''} avatar={user?.avatar} size="sm" />
      </div>
    </header>
  );
}
