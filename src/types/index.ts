export type TaskStatus = "backlog" | "in-progress" | "review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high";

export type SubtaskStatus = "pending" | "in-progress" | "done";

export interface TaskComment {
  id?: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface TaskSubtask {
  id: string;
  title: string;
  status: SubtaskStatus;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  agent: string;
  status: TaskStatus;
  priority: TaskPriority;
  department?: string;
  deadline: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  instructions?: string;
  deliverable?: string;
  comments: TaskComment[];
  subtasks?: TaskSubtask[];
  createdAt: string;
  updatedAt: string;
}
