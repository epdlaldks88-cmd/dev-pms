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

  const handleOpen = () => {
    if (!popup.link) return;
    const userId = new URL(popup.link, 'http://x').searchParams.get('to');
    if (userId) openMessagePanel(userId);
    hide();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-[360px] animate-slide-up">
      <div className="group relative overflow-hidden rounded-2xl bg-white/85 backdrop-blur-xl ring-1 ring-gray-900/5 border border-white/70 shadow-[0_12px_40px_-8px_rgba(79,70,229,0.35),0_4px_12px_rgba(0,0,0,0.06)]">
        {/* 왼쪽 컬러 액센트 바 */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-violet-500 to-fuchsia-500" />

        {/* 닫기 버튼 */}
        <button
          onClick={hide}
          className="absolute top-2.5 right-2.5 z-10 p-1 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100/80 transition-colors"
        >
          <X size={14} />
        </button>

        {/* 본문 */}
        <div
          className={`flex items-start gap-3 pl-5 pr-9 py-3.5 ${popup.link ? 'cursor-pointer' : ''}`}
          onClick={handleOpen}
        >
          {/* 아이콘 배지 */}
          <div className="relative flex-shrink-0 mt-0.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <MessageSquare size={16} className="text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
          </div>

          {/* 텍스트 */}
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">새 멘션</span>
            <p className="text-sm font-semibold text-gray-800 truncate leading-snug">{popup.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{popup.message}</p>
            {popup.link && (
              <p className="inline-flex items-center gap-0.5 text-[11px] text-indigo-500 mt-1.5 font-semibold transition-transform group-hover:translate-x-0.5">
                대화 열기 <span aria-hidden>→</span>
              </p>
            )}
          </div>
        </div>

        {/* 진행 바 */}
        <div className="h-1 bg-gray-100/70">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 animate-shrink-width" />
        </div>
      </div>
    </div>
  );
}
