export enum Role {
  ADMIN = 'ADMIN',
  KID = 'KID'
}

export type AvatarItemType = 'base' | 'top' | 'bottom' | 'shoes' | 'accessory';

export interface AvatarItem {
  id: string;
  type: AvatarItemType;
  name: string;
  cost: number;
  svg: string; // Reference to the SVG component key
}

export interface AvatarConfig {
  baseId?: string;
  topId?: string;
  bottomId?: string;
  shoesId?: string;
  accessoryId?: string;
}

export interface ShopTransaction {
  id: string;
  userId: string;
  itemId: string;
  cost: number;
  timestamp: number;
}

export interface Family {
  id: string;
  name: string;
  code?: string;
}

export interface User {
  id: string;
  familyId: string;
  name: string;
  role: Role;
  avatar: string; // Emoji or URL
  avatarConfig?: AvatarConfig;
  inventory?: string[]; // IDs of owned items
  color: string;
  pin: string; // Simple password
}

export interface Task {
  id: string;
  familyId: string;
  title: string;
  points: number;
  assignedTo: string[]; // User IDs (can be multiple)
  recurrence: number[]; // 0-6 (Sunday-Saturday)
  icon: string;
  isUnique?: boolean; // If true, only one person can complete it per day
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  type: 'popup' | 'banner';
  style: 'default' | 'golden' | 'sparkle';
  assignedTo: string[];
  readBy: string[]; // Users who have SEEN/DISMISSED the popup
  completedBy: string[]; // Users who have COMPLETED the event task
  points?: number;
}

export interface Reward {
  id: string;
  familyId: string;
  name: string;
  cost: number;
  icon: string;
  limitType?: 'unlimited' | 'once_per_user' | 'unique';
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
    type?: 'NORMAL' | 'VACILE';
}
