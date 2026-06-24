import { useEffect, useRef } from 'react';
import { X, MessageSquare, Users } from 'lucide-react';
import { useUiStore } from '../store/ui.store';

function PopupCard({
  icon,
  label,
  title,
  body,
  onOpen,
  onClose,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  body?: string;
  onOpen?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/85 backdrop-blur-xl ring-1 ring-gray-900/5 border border-white/70 shadow-[0_12px_40px_-8px_rgba(231,56,39,0.35),0_4px_12px_rgba(0,0,0,0.06)]">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'linear-gradient(180deg, #f85032, #e73827)' }} />
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 z-10 p-1 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100/80 transition-colors"
      >
        <X size={14} />
      </button>
      <div
        className={`flex items-start gap-3 pl-5 pr-9 py-3.5 ${onOpen ? 'cursor-pointer' : ''}`}
        onClick={onOpen}
      >
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-[#e73827]/30" style={{ background: 'linear-gradient(135deg, #f85032, #e73827)' }}>
            {icon}
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#e73827]">{label}</span>
          <p className="text-sm font-semibold text-gray-800 truncate leading-snug">{title}</p>
          {body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{body}</p>}
          {onOpen && (
            <p className="inline-flex items-center gap-0.5 text-[11px] text-[#e73827] mt-1.5 font-semibold transition-transform group-hover:translate-x-0.5">
              대화 열기 <span aria-hidden>→</span>
            </p>
          )}
        </div>
      </div>
      <div className="h-1 bg-gray-100/70">
        <div className="h-full animate-shrink-width" style={{ background: 'linear-gradient(90deg, #f85032, #e73827)' }} />
      </div>
    </div>
  );
}

export function MentionPopup() {
  const popup = useUiStore((s) => s.mentionPopup);
  const hide = useUiStore((s) => s.hideMentionPopup);
  const openMessagePanel = useUiStore((s) => s.openMessagePanel);
  const mentionPreview = useUiStore((s) => s.mentionPreview);
  const roomPopup = useUiStore((s) => s.roomPopup);
  const hideRoom = useUiStore((s) => s.hideRoomPopup);
  const openRoomPanel = useUiStore((s) => s.openRoomPanel);

  const mentionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!popup) return;
    if (mentionTimer.current) clearTimeout(mentionTimer.current);
    mentionTimer.current = setTimeout(hide, 5000);
    return () => { if (mentionTimer.current) clearTimeout(mentionTimer.current); };
  }, [popup, hide]);

  useEffect(() => {
    if (!roomPopup) return;
    if (roomTimer.current) clearTimeout(roomTimer.current);
    roomTimer.current = setTimeout(hideRoom, 5000);
    return () => { if (roomTimer.current) clearTimeout(roomTimer.current); };
  }, [roomPopup, hideRoom]);

  if (!popup && !roomPopup) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-[360px] flex flex-col gap-3">
      {popup && (
        <div className="animate-slide-up">
          <PopupCard
            icon={<MessageSquare size={16} className="text-white" />}
            label="새 멘션"
            title={mentionPreview ? popup.title : '새 멘션이 도착했습니다'}
            body={mentionPreview ? popup.message : undefined}
            onOpen={popup.link ? () => {
              const userId = new URL(popup.link!, 'http://x').searchParams.get('to');
              if (userId) openMessagePanel(userId);
              hide();
            } : undefined}
            onClose={hide}
          />
        </div>
      )}
      {roomPopup && (
        <div className="animate-slide-up">
          <PopupCard
            icon={<Users size={16} className="text-white" />}
            label="새 그룹 메시지"
            title={roomPopup.senderName}
            body={roomPopup.content}
            onOpen={() => { openRoomPanel(roomPopup.roomId); hideRoom(); }}
            onClose={hideRoom}
          />
        </div>
      )}
    </div>
  );
}
