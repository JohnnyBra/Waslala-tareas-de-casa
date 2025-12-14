export enum Role {
  ADMIN = 'ADMIN',
  KID = 'KID'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string; // Emoji or URL
  color: string;
  pin: string; // Simple password
}

export interface Task {
  id: string;
  title: string;
  points: number;
  assignedTo: string[]; // User IDs (can be multiple)
  recurrence: number[]; // 0-6 (Sunday-Saturday)
  icon: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  date: string; // ISO Date String YYYY-MM-DD
  timestamp: number;
  approved: boolean; // For parents to verify if needed (auto-approved for this MVP)
}

export interface ExtraPointEntry {
  id: string;
  userId: string;
  points: number;
  reason: string;
  timestamp: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (points: number, tasksCompleted: number) => boolean;
}

export interface Message {
    id: string;
    fromUserId: string;
    toUserId: string;
    content: string;
    timestamp: number;
    read: boolean;
}