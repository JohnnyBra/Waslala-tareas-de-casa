import { User, Task, TaskCompletion, Role, Badge, ExtraPointEntry, Message } from '../types';

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Papá', role: Role.ADMIN, avatar: '👨🏻', color: 'bg-blue-600', pin: '1234' },
  { id: 'u2', name: 'Mamá', role: Role.ADMIN, avatar: '👩🏻', color: 'bg-purple-600', pin: '1234' },
  { id: 'u3', name: 'Miguel', role: Role.KID, avatar: '🧑', color: 'bg-red-400', pin: '0000' },
  { id: 'u4', name: 'Carmen', role: Role.KID, avatar: '👧', color: 'bg-pink-400', pin: '0000' },
  { id: 'u5', name: 'Pedro', role: Role.KID, avatar: '👦', color: 'bg-green-400', pin: '0000' },
  { id: 'u6', name: 'Diego', role: Role.KID, avatar: '👶', color: 'bg-yellow-400', pin: '0000' },
  { id: 'u7', name: 'Alegría', role: Role.KID, avatar: '👱‍♀️', color: 'bg-orange-400', pin: '0000' },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Hacer la cama', points: 10, assignedTo: ['u3', 'u4', 'u5', 'u6', 'u7'], recurrence: [0, 1, 2, 3, 4, 5, 6], icon: '🛏️' },
  { id: 't2', title: 'Poner la mesa', points: 20, assignedTo: ['u3', 'u4'], recurrence: [1, 3, 5], icon: '🍽️' },
  { id: 't3', title: 'Recoger juguetes', points: 15, assignedTo: ['u5', 'u6', 'u7'], recurrence: [0, 1, 2, 3, 4, 5, 6], icon: '🧸' },
  { id: 't4', title: 'Sacar la basura', points: 30, assignedTo: ['u3'], recurrence: [2, 4, 6], icon: '🗑️' },
  { id: 't5', title: 'Ayudar a cocinar', points: 50, assignedTo: ['u4'], recurrence: [0, 6], icon: '🍳' },
];

export const BADGES: Badge[] = [
  { id: 'b1', name: 'Novato', description: 'Consigue tus primeros 50 puntos', icon: '🥉', condition: (p) => p >= 50 },
  { id: 'b2', name: 'Ayudante', description: 'Completa 10 tareas', icon: '🥈', condition: (_, t) => t >= 10 },
  { id: 'b3', name: 'Super Estrella', description: 'Alcanza 500 puntos', icon: '⭐', condition: (p) => p >= 500 },
  { id: 'b4', name: 'Leyenda', description: 'Completa 100 tareas', icon: '👑', condition: (_, t) => t >= 100 },
];

// Storage Keys
const KEYS = {
  USERS: 'st_users',
  TASKS: 'st_tasks',
  COMPLETIONS: 'st_completions',
  EXTRA_POINTS: 'st_extra_points',
  MESSAGES: 'st_messages'
};

// API Base URL (relative since we serve from same origin in production)
// In development, you might need to change this if running on different ports
const API_BASE = '/api';

// Helper to get today's date string YYYY-MM-DD
export const getTodayString = () => new Date().toISOString().split('T')[0];

export const DataService = {
  // Initialization: Load from server and populate localStorage
  init: async () => {
    try {
        const response = await fetch(`${API_BASE}/data`);
        const serverData = await response.json();

        if (serverData && Object.keys(serverData).length > 0) {
            // Load server data into localStorage
            if(serverData.users) localStorage.setItem(KEYS.USERS, JSON.stringify(serverData.users));
            if(serverData.tasks) localStorage.setItem(KEYS.TASKS, JSON.stringify(serverData.tasks));
            if(serverData.completions) localStorage.setItem(KEYS.COMPLETIONS, JSON.stringify(serverData.completions));
            if(serverData.extraPoints) localStorage.setItem(KEYS.EXTRA_POINTS, JSON.stringify(serverData.extraPoints));
            if(serverData.messages) localStorage.setItem(KEYS.MESSAGES, JSON.stringify(serverData.messages));
        } else {
            // If server is empty, use initial data if local is also empty
            if (!localStorage.getItem(KEYS.USERS)) {
                localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
            }
            if (!localStorage.getItem(KEYS.TASKS)) {
                localStorage.setItem(KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
            }
            if (!localStorage.getItem(KEYS.COMPLETIONS)) {
                localStorage.setItem(KEYS.COMPLETIONS, JSON.stringify([]));
            }
            if (!localStorage.getItem(KEYS.EXTRA_POINTS)) {
                localStorage.setItem(KEYS.EXTRA_POINTS, JSON.stringify([]));
            }
            if (!localStorage.getItem(KEYS.MESSAGES)) {
                localStorage.setItem(KEYS.MESSAGES, JSON.stringify([]));
            }
            // Save initial data to server
            DataService.syncToServer();
        }
    } catch (e) {
        console.error("Failed to load data from server, falling back to local storage", e);
        // Fallback init
        if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
        if (!localStorage.getItem(KEYS.TASKS)) localStorage.setItem(KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    }
  },

  // Sync current localStorage state to server
  syncToServer: async () => {
      const data = {
          users: JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
          tasks: JSON.parse(localStorage.getItem(KEYS.TASKS) || '[]'),
          completions: JSON.parse(localStorage.getItem(KEYS.COMPLETIONS) || '[]'),
          extraPoints: JSON.parse(localStorage.getItem(KEYS.EXTRA_POINTS) || '[]'),
          messages: JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]')
      };

      try {
          await fetch(`${API_BASE}/data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
          });
      } catch (e) {
          console.error("Failed to sync to server", e);
      }
  },

  // Upload Image
  uploadImage: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('image', file);

      try {
          const response = await fetch(`${API_BASE}/upload`, {
              method: 'POST',
              body: formData
          });
          if(response.ok) {
              const data = await response.json();
              return data.url;
          } else {
              throw new Error('Upload failed');
          }
      } catch (e) {
          console.error("Error uploading image", e);
          throw e;
      }
  },

  // Users
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },

  updateUser: (updatedUser: User) => {
    const users = DataService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      DataService.syncToServer();
    }
  },

  // Tasks
  getTasks: (): Task[] => {
    return JSON.parse(localStorage.getItem(KEYS.TASKS) || '[]');
  },
  
  saveTask: (task: Task) => {
    const tasks = DataService.getTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    DataService.syncToServer();
  },

  deleteTask: (taskId: string) => {
    const tasks = DataService.getTasks().filter(t => t.id !== taskId);
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    DataService.syncToServer();
  },

  // Completions
  getCompletions: (): TaskCompletion[] => {
    return JSON.parse(localStorage.getItem(KEYS.COMPLETIONS) || '[]');
  },

  toggleCompletion: (taskId: string, userId: string, date: string) => {
    let completions = DataService.getCompletions();
    const existingIndex = completions.findIndex(c => c.taskId === taskId && c.userId === userId && c.date === date);

    if (existingIndex >= 0) {
      // Remove (Undo)
      completions.splice(existingIndex, 1);
    } else {
      // Add
      const newCompletion: TaskCompletion = {
        id: Date.now().toString(),
        taskId,
        userId,
        date,
        timestamp: Date.now(),
        approved: true
      };
      completions.push(newCompletion);
    }
    localStorage.setItem(KEYS.COMPLETIONS, JSON.stringify(completions));
    DataService.syncToServer();
  },

  removeCompletion: (taskId: string, userId: string, date: string) => {
    let completions = DataService.getCompletions();
    const newCompletions = completions.filter(c => !(c.taskId === taskId && c.userId === userId && c.date === date));
    localStorage.setItem(KEYS.COMPLETIONS, JSON.stringify(newCompletions));
    DataService.syncToServer();
  },

  // Extra Points
  getExtraPoints: (): ExtraPointEntry[] => {
    return JSON.parse(localStorage.getItem(KEYS.EXTRA_POINTS) || '[]');
  },

  addExtraPoints: (userId: string, points: number, reason: string) => {
    const extras = DataService.getExtraPoints();
    const newEntry: ExtraPointEntry = {
      id: Date.now().toString(),
      userId,
      points,
      reason,
      timestamp: Date.now()
    };
    extras.push(newEntry);
    localStorage.setItem(KEYS.EXTRA_POINTS, JSON.stringify(extras));
    DataService.syncToServer();
  },

  // Messages (Taunts)
  getMessages: (userId: string): Message[] => {
      const allMessages: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      return allMessages.filter(m => m.toUserId === userId).sort((a,b) => b.timestamp - a.timestamp);
  },

  sendMessage: (fromUserId: string, toUserId: string, content: string) => {
      const allMessages: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      const newMsg: Message = {
          id: Date.now().toString(),
          fromUserId,
          toUserId,
          content,
          timestamp: Date.now(),
          read: false
      };
      allMessages.push(newMsg);
      localStorage.setItem(KEYS.MESSAGES, JSON.stringify(allMessages));
      DataService.syncToServer();
  },

  markMessageRead: (msgId: string) => {
      const allMessages: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      const msg = allMessages.find(m => m.id === msgId);
      if(msg) {
          msg.read = true;
          localStorage.setItem(KEYS.MESSAGES, JSON.stringify(allMessages));
          DataService.syncToServer();
      }
  },

  // Aggregation
  getUserStats: (userId: string) => {
    const completions = DataService.getCompletions().filter(c => c.userId === userId);
    const tasks = DataService.getTasks();
    const extraPointsList = DataService.getExtraPoints().filter(e => e.userId === userId);
    
    let points = 0;
    
    // Sum task points
    completions.forEach(c => {
      const task = tasks.find(t => t.id === c.taskId);
      if (task) points += task.points;
    });

    // Sum extra points
    extraPointsList.forEach(e => {
      points += e.points;
    });

    const tasksCompletedCount = completions.length;
    
    const earnedBadges = BADGES.filter(b => b.condition(points, tasksCompletedCount));

    return { points, tasksCompletedCount, earnedBadges, extraPointsList };
  },

  getLeaderboard: () => {
    const users = DataService.getUsers().filter(u => u.role === Role.KID);
    return users.map(u => {
      const stats = DataService.getUserStats(u.id);
      return {
        ...u,
        ...stats
      };
    }).sort((a, b) => b.points - a.points);
  }
};
