import { create } from "zustand";
import type { TrainingTask } from "../lib/touchline/types";

interface TrainingState {
  // Active tasks
  activeTasks: Map<string, TrainingTask>;

  // Actions
  addTask: (task: TrainingTask) => void;
  updateTask: (taskId: string, task: TrainingTask) => void;
  removeTask: (taskId: string) => void;
  clearTasks: () => void;
  getTask: (taskId: string) => TrainingTask | undefined;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
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
