import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  taskModalOpen: boolean;
  taskModalId: string | null;
  openTaskModal: (taskId: string) => void;
  closeTaskModal: () => void;
  createTaskProjectId: string | null;
  createTaskStepId: string | null;
  openCreateTask: (projectId: string, stepId?: string) => void;
  closeCreateTask: () => void;
  mentionAlarm: boolean;
  setMentionAlarm: (v: boolean) => void;
  mentionPopup: { id: string; title: string; message: string; link?: string } | null;
  showMentionPopup: (n: { id: string; title: string; message: string; link?: string }) => void;
  hideMentionPopup: () => void;
  messagePanelUserId: string | null;
  openMessagePanel: (userId: string) => void;
  closeMessagePanel: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      taskModalOpen: false,
      taskModalId: null,
      openTaskModal: (taskId) => set({ taskModalOpen: true, taskModalId: taskId }),
      closeTaskModal: () => set({ taskModalOpen: false, taskModalId: null }),
      createTaskProjectId: null,
      createTaskStepId: null,
      openCreateTask: (projectId, stepId) => set({ createTaskProjectId: projectId, createTaskStepId: stepId ?? null }),
      closeCreateTask: () => set({ createTaskProjectId: null, createTaskStepId: null }),
      mentionAlarm: true,
      setMentionAlarm: (v) => set({ mentionAlarm: v }),
      mentionPopup: null,
      showMentionPopup: (n) => set({ mentionPopup: n }),
      hideMentionPopup: () => set({ mentionPopup: null }),
      messagePanelUserId: null,
      openMessagePanel: (userId) => set({ messagePanelUserId: userId }),
      closeMessagePanel: () => set({ messagePanelUserId: null }),
    }),
    {
      name: 'ui-storage',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, mentionAlarm: s.mentionAlarm }),
    },
  ),
);
