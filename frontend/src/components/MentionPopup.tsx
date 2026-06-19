import { useEffect, useRef } from 'react';
import { X, AtSign } from 'lucide-react';
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
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary-600">
          <div className="flex items-center gap-2">
            <AtSign size={14} className="text-gray-300" />
            <span className="text-xs font-semibold text-white">멘션 알림</span>
          </div>
          <button
            onClick={hide}
            className="text-gray-300 hover:text-white transition-colors p-0.5 rounded"
          >
            <X size={14} />
          </button>
        </div>

        {/* 내용 */}
        <div
          className={`px-4 py-3 ${popup.link ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
          onClick={() => {
            if (!popup.link) return;
            // /messages?to=userId 형태에서 userId 추출
            const userId = new URL(popup.link, 'http://x').searchParams.get('to');
            if (userId) openMessagePanel(userId);
            hide();
          }}
        >
          <p className="text-sm font-semibold text-gray-600 truncate">{popup.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{popup.message}</p>
          {popup.link && <p className="text-[10px] text-gray-600 mt-1">클릭하여 대화 열기</p>}
        </div>

        {/* 진행 바 */}
        <div className="h-0.5 bg-gray-100">
          <div className="h-full bg-primary-500 animate-shrink-width" />
        </div>
      </div>
    </div>
  );
}
