import { useEffect, useRef } from 'react';
import { Smile } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface Props {
  open: boolean;
  onToggle: () => void;
  onSelect: (emoji: string) => void;
  placement?: 'top' | 'top-right';
}

export function EmojiPickerButton({ open, onToggle, onSelect, placement = 'top' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onToggle();
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onToggle]);

  const posClass = placement === 'top-right'
    ? 'bottom-10 right-0'
    : 'bottom-10 left-0';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={onToggle}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-primary-50 rounded-lg transition-colors"
        title="이모티콘"
      >
        <Smile size={17} />
      </button>
      {open && (
        <div className={`absolute ${posClass} z-50`}>
          <Picker
            data={data}
            locale="ko"
            theme="light"
            onEmojiSelect={(e: any) => { onSelect(e.native); onToggle(); }}
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}
    </div>
  );
}
