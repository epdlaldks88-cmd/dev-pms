import { create } from 'zustand';

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
}

export const useUiStore = create<UiState>((set) => ({
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
}));
