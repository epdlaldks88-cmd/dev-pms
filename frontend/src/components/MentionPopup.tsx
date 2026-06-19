import { useEffect, useRef } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { useUiStore } from '../store/ui.store';

export function MentionPopup() {
  const popup = useUiStore((s) => s.mentionPopup);
  const hide = useUiStore((s) => s.hideMentionPopup);
  const openMessagePanel = useUiStore((s) => s.openMessagePanel);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!popup) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(hide, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [popup, hide]);

  if (!popup) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-80 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 border-b border-indigo-100">
          <div className="flex items-center gap-2">
            <MessageSquare size={13} className="text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-600">새 멘션</span>
          </div>
          <button
            onClick={hide}
            className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
          >
            <X size={14} />
          </button>
        </div>

        {/* 내용 */}
        <div
          className={`px-4 py-3 ${popup.link ? 'cursor-pointer hover:bg-indigo-50/40 transition-colors' : ''}`}
          onClick={() => {
            if (!popup.link) return;
            const userId = new URL(popup.link, 'http://x').searchParams.get('to');
            if (userId) openMessagePanel(userId);
            hide();
          }}
        >
          <p className="text-sm font-semibold text-gray-700 truncate">{popup.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{popup.message}</p>
          {popup.link && <p className="text-[10px] text-indigo-400 mt-1.5 font-medium">클릭하여 대화 열기 →</p>}
        </div>

        {/* 진행 바 */}
        <div className="h-0.5 bg-indigo-50">
          <div className="h-full bg-indigo-400 animate-shrink-width" />
        </div>
      </div>
    </div>
  );
}
