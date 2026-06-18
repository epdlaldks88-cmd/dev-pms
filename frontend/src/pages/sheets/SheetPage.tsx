import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, X, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sheetsApi } from '../../api/sheets';
import { cn } from '../../lib/utils';

// ── 상수 ──────────────────────────────────────────────────────────────────────
const DEFAULT_ROWS = 100;
const DEFAULT_COLS = 26;
const COL_HEADER_WIDTH = 52;
const DEFAULT_COL_WIDTH = 120;
const ROW_HEIGHT = 26;

type CellKey = string; // "row,col"
type SheetData = {
  cells: Record<CellKey, string>;
  rows: number;
  cols: number;
  colWidths: Record<number, number>;
};

const colLabel = (i: number) => {
  let s = '';
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
};

const emptyData = (): SheetData => ({
  cells: {},
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  colWidths: {},
});

// ── 스프레드시트 그리드 ────────────────────────────────────────────────────────
function SpreadsheetGrid({
  data,
  onChange,
}: {
  data: SheetData;
  onChange: (d: SheetData) => void;
}) {
  const { cells, rows, cols, colWidths } = data;
  const [sel, setSel] = useState<[number, number] | null>(null); // [row, col]
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cellKey = (r: number, c: number): CellKey => `${r},${c}`;
  const colW = (c: number) => colWidths[c] ?? DEFAULT_COL_WIDTH;

  // 셀 선택
  const select = (r: number, c: number, startEdit = false) => {
    setSel([r, c]);
    if (startEdit) {
      setEditVal(cells[cellKey(r, c)] ?? '');
      setEditing(true);
    } else {
      setEditing(false);
    }
  };

  // 편집 커밋
  const commitEdit = useCallback(() => {
    if (!sel || !editing) return;
    const key = cellKey(sel[0], sel[1]);
    const newCells = { ...cells };
    if (editVal === '') {
      delete newCells[key];
    } else {
      newCells[key] = editVal;
    }
    onChange({ ...data, cells: newCells });
    setEditing(false);
  }, [sel, editing, editVal, cells, data, onChange]);

  // 포커스 관리
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing, sel]);

  // 키보드 네비게이션
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!sel) return;
    const [r, c] = sel;

    if (editing) {
      if (e.key === 'Enter') { e.preventDefault(); commitEdit(); setSel([Math.min(r + 1, rows - 1), c]); }
      else if (e.key === 'Escape') { setEditing(false); setEditVal(cells[cellKey(r, c)] ?? ''); }
      else if (e.key === 'Tab') { e.preventDefault(); commitEdit(); setSel([r, Math.min(c + 1, cols - 1)]); }
      return;
    }

    if (e.key === 'ArrowUp') { e.preventDefault(); setSel([Math.max(r - 1, 0), c]); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel([Math.min(r + 1, rows - 1), c]); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setSel([r, Math.max(c - 1, 0)]); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setSel([r, Math.min(c + 1, cols - 1)]); }
    else if (e.key === 'Tab') { e.preventDefault(); setSel([r, Math.min(c + 1, cols - 1)]); }
    else if (e.key === 'Enter') { e.preventDefault(); setEditVal(cells[cellKey(r, c)] ?? ''); setEditing(true); }
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      const key = cellKey(r, c);
      if (cells[key]) {
        const newCells = { ...cells };
        delete newCells[key];
        onChange({ ...data, cells: newCells });
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      setEditVal(e.key);
      setEditing(true);
    }
  };

  // 컬럼 리사이즈
  const resizeRef = useRef<{ col: number; startX: number; startW: number } | null>(null);
  const onResizeStart = (e: React.MouseEvent, col: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { col, startX: e.clientX, startW: colW(col) };
    const onMove = (mv: MouseEvent) => {
      if (!resizeRef.current) return;
      const diff = mv.clientX - resizeRef.current.startX;
      const newW = Math.max(40, resizeRef.current.startW + diff);
      onChange({ ...data, colWidths: { ...colWidths, [resizeRef.current.col]: newW } });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto outline-none select-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) commitEdit();
      }}
    >
      <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: COL_HEADER_WIDTH }} />
          {Array.from({ length: cols }, (_, c) => (
            <col key={c} style={{ width: colW(c) }} />
          ))}
        </colgroup>

        {/* 컬럼 헤더 */}
        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 bg-gray-50 border border-gray-200 text-xs text-gray-400 font-medium" style={{ width: COL_HEADER_WIDTH, height: ROW_HEIGHT }} />
            {Array.from({ length: cols }, (_, c) => (
              <th
                key={c}
                className={cn(
                  'sticky top-0 z-20 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-500 relative',
                  sel && sel[1] === c && 'bg-indigo-50 text-indigo-700',
                )}
                style={{ height: ROW_HEIGHT }}
              >
                {colLabel(c)}
                {/* 리사이즈 핸들 */}
                <span
                  className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-indigo-400 opacity-0 hover:opacity-100 z-10"
                  onMouseDown={(e) => onResizeStart(e, c)}
                />
              </th>
            ))}
          </tr>
        </thead>

        {/* 데이터 행 */}
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {/* 행 번호 */}
              <td
                className={cn(
                  'sticky left-0 z-10 bg-gray-50 border border-gray-200 text-xs text-gray-400 font-medium text-center',
                  sel && sel[0] === r && 'bg-indigo-50 text-indigo-700',
                )}
                style={{ width: COL_HEADER_WIDTH, height: ROW_HEIGHT }}
              >
                {r + 1}
              </td>

              {Array.from({ length: cols }, (_, c) => {
                const key = cellKey(r, c);
                const isSel = sel?.[0] === r && sel?.[1] === c;
                const val = cells[key] ?? '';

                return (
                  <td
                    key={c}
                    className={cn(
                      'border border-gray-200 p-0 relative cursor-cell text-sm text-gray-800',
                      isSel && !editing && 'outline outline-2 outline-indigo-500 outline-offset-[-1px] z-10',
                      isSel && editing && 'z-10',
                    )}
                    style={{ height: ROW_HEIGHT, maxWidth: colW(c) }}
                    onClick={() => select(r, c)}
                    onDoubleClick={() => select(r, c, true)}
                  >
                    {isSel && editing ? (
                      <input
                        ref={inputRef}
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); commitEdit(); setSel([Math.min(r + 1, rows - 1), c]); }
                          else if (e.key === 'Escape') { setEditing(false); }
                          else if (e.key === 'Tab') { e.preventDefault(); commitEdit(); setSel([r, Math.min(c + 1, cols - 1)]); }
                          e.stopPropagation();
                        }}
                        onBlur={commitEdit}
                        className="absolute inset-0 w-full h-full px-1.5 text-sm border-none outline-none bg-white z-10"
                      />
                    ) : (
                      <span className="block px-1.5 truncate leading-[26px]">{val}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
export function SheetPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();

  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [sheetData, setSheetData] = useState<SheetData>(emptyData());
  const [newSheetName, setNewSheetName] = useState('');
  const [showNewSheet, setShowNewSheet] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // 시트 목록
  const { data: sheets = [] } = useQuery({
    queryKey: ['sheets', projectId],
    queryFn: () => sheetsApi.list(projectId!),
    enabled: !!projectId,
  });

  // 첫 로드 시 첫 번째 시트 선택
  useEffect(() => {
    if (sheets.length > 0 && !activeSheetId) {
      setActiveSheetId(sheets[0].id);
    }
  }, [sheets, activeSheetId]);

  // 시트 데이터 로드
  const { data: rawSheet } = useQuery({
    queryKey: ['sheet', projectId, activeSheetId],
    queryFn: () => sheetsApi.get(projectId!, activeSheetId!),
    enabled: !!projectId && !!activeSheetId,
  });

  useEffect(() => {
    if (rawSheet?.data) {
      const d = rawSheet.data as SheetData;
      setSheetData({
        cells: d.cells ?? {},
        rows: d.rows ?? DEFAULT_ROWS,
        cols: d.cols ?? DEFAULT_COLS,
        colWidths: d.colWidths ?? {},
      });
    } else if (rawSheet) {
      setSheetData(emptyData());
    }
  }, [rawSheet]);

  // 저장 뮤테이션
  const saveMutation = useMutation({
    mutationFn: (d: SheetData) => sheetsApi.save(projectId!, activeSheetId!, d),
    onError: () => toast.error('저장에 실패했습니다.'),
  });

  // 데이터 변경 시 debounce 저장
  const handleChange = useCallback((d: SheetData) => {
    setSheetData(d);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveMutation.mutate(d), 800);
  }, [activeSheetId, projectId]);

  // 시트 생성
  const createSheet = useMutation({
    mutationFn: (name: string) => sheetsApi.create(projectId!, name),
    onSuccess: (sheet) => {
      qc.invalidateQueries({ queryKey: ['sheets', projectId] });
      setActiveSheetId(sheet.id);
      setShowNewSheet(false);
      setNewSheetName('');
    },
    onError: () => toast.error('시트 생성에 실패했습니다.'),
  });

  // 시트 삭제
  const deleteSheet = useMutation({
    mutationFn: (id: string) => sheetsApi.remove(projectId!, id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['sheets', projectId] });
      if (activeSheetId === id) {
        const remaining = sheets.filter((s: any) => s.id !== id);
        setActiveSheetId(remaining[0]?.id ?? null);
      }
    },
    onError: () => toast.error('삭제에 실패했습니다.'),
  });

  // 시트 이름 변경
  const renameSheet = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => sheetsApi.rename(projectId!, id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sheets', projectId] });
      setRenamingId(null);
    },
    onError: () => toast.error('이름 변경에 실패했습니다.'),
  });

  const handleTabSwitch = (id: string) => {
    // 저장 대기 중이면 즉시 저장
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      if (activeSheetId) saveMutation.mutate(sheetData);
    }
    setActiveSheetId(id);
    setSheetData(emptyData());
  };

  const noSheets = sheets.length === 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 상단 툴바 */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 h-11 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-semibold text-gray-500 tracking-wide">스프레드시트</span>
        {activeSheetId && (
          <span className="text-xs text-gray-400">
            · 자동 저장 {saveMutation.isPending ? '중...' : '완료'}
          </span>
        )}
      </div>

      {/* 그리드 영역 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {noSheets || !activeSheetId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18" />
            </svg>
            <p className="text-sm">시트가 없습니다. 아래 버튼으로 새 시트를 추가하세요.</p>
          </div>
        ) : (
          <SpreadsheetGrid data={sheetData} onChange={handleChange} />
        )}
      </div>

      {/* 하단 탭 바 */}
      <div className="flex-shrink-0 flex items-center border-t border-gray-200 bg-gray-50 h-9 px-2 gap-0.5 overflow-x-auto">
        {sheets.map((sheet: any) => (
          <div
            key={sheet.id}
            className={cn(
              'group relative flex items-center gap-1.5 px-3 h-7 rounded-t text-xs font-medium cursor-pointer whitespace-nowrap border border-b-0 transition-colors',
              activeSheetId === sheet.id
                ? 'bg-white text-indigo-700 border-gray-300 shadow-sm'
                : 'bg-transparent text-gray-500 border-transparent hover:bg-white hover:text-gray-700',
            )}
            onClick={() => handleTabSwitch(sheet.id)}
            onDoubleClick={() => { setRenamingId(sheet.id); setRenameVal(sheet.name); }}
          >
            {renamingId === sheet.id ? (
              <input
                autoFocus
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renameSheet.mutate({ id: sheet.id, name: renameVal || sheet.name });
                  if (e.key === 'Escape') setRenamingId(null);
                  e.stopPropagation();
                }}
                onBlur={() => renameSheet.mutate({ id: sheet.id, name: renameVal || sheet.name })}
                onClick={(e) => e.stopPropagation()}
                className="w-24 text-xs border border-indigo-400 rounded px-1 outline-none bg-white"
              />
            ) : (
              <span>{sheet.name}</span>
            )}

            {/* 삭제 버튼 (hover 시) */}
            {sheets.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteSheet.mutate(sheet.id); }}
                className="hidden group-hover:flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-red-100 hover:text-red-500 text-gray-400 ml-0.5"
              >
                <X size={9} />
              </button>
            )}
          </div>
        ))}

        {/* 새 시트 추가 */}
        {showNewSheet ? (
          <div className="flex items-center gap-1 ml-1">
            <input
              autoFocus
              value={newSheetName}
              onChange={(e) => setNewSheetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newSheetName.trim()) createSheet.mutate(newSheetName.trim());
                if (e.key === 'Escape') { setShowNewSheet(false); setNewSheetName(''); }
              }}
              placeholder="시트 이름"
              className="w-24 h-6 text-xs border border-indigo-400 rounded px-2 outline-none"
            />
            <button
              onClick={() => newSheetName.trim() && createSheet.mutate(newSheetName.trim())}
              className="flex items-center justify-center w-6 h-6 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Check size={11} />
            </button>
            <button
              onClick={() => { setShowNewSheet(false); setNewSheetName(''); }}
              className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewSheet(true)}
            className="flex items-center justify-center w-7 h-7 ml-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0"
            title="새 시트 추가"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
