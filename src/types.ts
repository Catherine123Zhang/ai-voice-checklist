export interface Task {
  id: string;
  title: string;
  time: string; // YYYY-MM-DD HH:mm
  note: string;
  completed: boolean;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  modelUsed?: string;
}

export type FoldingMode = 'folded' | 'unfolded' | 'halffolded';

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayName: string; // "周一", "周二", etc.
  dayNum: number; // 1-31
  isToday: boolean;
  tasks: Task[];
}
