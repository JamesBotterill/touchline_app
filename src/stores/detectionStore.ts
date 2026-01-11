import { create } from 'zustand';
import type { DetectionTask } from '@/lib/touchline/types';

interface DetectionState {
  // Active tasks
  activeTasks: Map<string, DetectionTask>;

  // Actions
  addTask: (task: DetectionTask) => void;
  updateTask: (taskId: string, task: DetectionTask) => void;
  removeTask: (taskId: string) => void;
  clearTasks: () => void;
  getTask: (taskId: string) => DetectionTask | undefined;
}

export const useDetectionStore = create<DetectionState>((set, get) => ({
  activeTasks: new Map(),

  addTask: (task) =>
    set((state) => {
      const newTasks = new Map(state.activeTasks);
      newTasks.set(task.task_id, task);
      return { activeTasks: newTasks };
    }),

  updateTask: (taskId, task) =>
    set((state) => {
      const newTasks = new Map(state.activeTasks);
      newTasks.set(taskId, task);
      return { activeTasks: newTasks };
    }),

  removeTask: (taskId) =>
    set((state) => {
      const newTasks = new Map(state.activeTasks);
      newTasks.delete(taskId);
      return { activeTasks: newTasks };
    }),

  clearTasks: () => set({ activeTasks: new Map() }),

  getTask: (taskId) => get().activeTasks.get(taskId),
}));
