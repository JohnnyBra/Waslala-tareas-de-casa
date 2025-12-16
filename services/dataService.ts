import { Family, User, Task, TaskCompletion, Role, Badge, ExtraPointEntry, Message, Event, ShopTransaction, AvatarConfig, Reward } from '../types';
import { AVATAR_ITEMS, getItemById } from '../constants/avatarItems';

// Initial Mock Data (kept for fallback structure, but using db.json primarily)
const INITIAL_FAMILIES: Family[] = [
  { id: 'f1', name: 'Barrero Macías' }
];
const INITIAL_USERS: User[] = [
  { id: 'u1', familyId: 'f1', name: 'Papá', role: Role.ADMIN, avatar: '👨🏻', color: 'bg-blue-600', pin: '1234' },
  { id: 'u2', familyId: 'f1', name: 'Mamá', role: Role.ADMIN, avatar: '👩🏻', color: 'bg-purple-600', pin: '1234' },
  {
    id: 'u3', familyId: 'f1', name: 'Miguel', role: Role.KID, avatar: '🧑', color: 'bg-red-400', pin: '0000',
    avatarConfig: { baseId: 'base_boy', topId: 'top_tshirt_red', bottomId: 'bot_shorts_blue', shoesId: 'shoes_sneakers' },
    inventory: ['base_boy', 'top_tshirt_red', 'bot_shorts_blue', 'shoes_sneakers']
  },
  { id: 'u4', familyId: 'f1', name: 'Carmen', role: Role.KID, avatar: '👧', color: 'bg-pink-400', pin: '0000' },
  { id: 'u5', familyId: 'f1', name: 'Pedro', role: Role.KID, avatar: '👦', color: 'bg-green-400', pin: '0000' },
  { id: 'u6', familyId: 'f1', name: 'Diego', role: Role.KID, avatar: '👶', color: 'bg-yellow-400', pin: '0000' },
  { id: 'u7', familyId: 'f1', name: 'Alegría', role: Role.KID, avatar: '👱‍♀️', color: 'bg-orange-400', pin: '0000' },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', familyId: 'f1', title: 'Hacer la cama', points: 10, assignedTo: ['u3', 'u4', 'u5', 'u6', 'u7'], recurrence: [0, 1, 2, 3, 4, 5, 6], icon: '🛏️' },
  { id: 't2', familyId: 'f1', title: 'Poner la mesa', points: 20, assignedTo: ['u3', 'u4'], recurrence: [1, 3, 5], icon: '🍽️' },
  { id: 't3', familyId: 'f1', title: 'Recoger juguetes', points: 15, assignedTo: ['u5', 'u6', 'u7'], recurrence: [0, 1, 2, 3, 4, 5, 6], icon: '🧸' },
  { id: 't4', familyId: 'f1', title: 'Sacar la basura', points: 30, assignedTo: ['u3'], recurrence: [2, 4, 6], icon: '🗑️' },
  { id: 't5', familyId: 'f1', title: 'Ayudar a cocinar', points: 50, assignedTo: ['u4'], recurrence: [0, 6], icon: '🍳' },
];

export const BADGES: Badge[] = [
  { id: 'b1', name: 'Novato', description: 'Consigue tus primeros 50 puntos', icon: '🥉', condition: (p) => p >= 50 },
  { id: 'b2', name: 'Ayudante', description: 'Completa 10 tareas', icon: '🥈', condition: (_, t) => t >= 10 },
  { id: 'b3', name: 'Super Estrella', description: 'Alcanza 500 puntos', icon: '⭐', condition: (p) => p >= 500 },
  { id: 'b4', name: 'Leyenda', description: 'Completa 100 tareas', icon: '👑', condition: (_, t) => t >= 100 },
];

// API Base URL
const API_BASE = '/api';

// Helper to get today's date string YYYY-MM-DD
export const getTodayString = () => new Date().toISOString().split('T')[0];

interface AppState {
    families: Family[];
    users: User[];
    tasks: Task[];
    completions: TaskCompletion[];
    extraPoints: ExtraPointEntry[];
    messages: Message[];
    events: Event[];
    transactions: ShopTransaction[];
    rewards: Reward[];
}

let state: AppState = {
    families: [],
    users: [],
    tasks: [],
    completions: [],
    extraPoints: [],
    messages: [],
    events: [],
    transactions: [],
    rewards: []
};

export const DataService = {
  // Initialization: Load from server
  init: async () => {
    try {
        const response = await fetch(`${API_BASE}/data`);
        const serverData = await response.json();

        if (serverData && Object.keys(serverData).length > 0) {
            state.families = serverData.families || [];
            state.users = serverData.users || [];
            state.tasks = serverData.tasks || [];
            state.completions = serverData.completions || [];
            state.extraPoints = serverData.extraPoints || [];
            state.messages = serverData.messages || [];
            state.events = serverData.events || [];
            state.transactions = serverData.transactions || [];
            state.rewards = serverData.rewards || [];
        } else {
            // Initialize with defaults if empty
            if (state.families.length === 0) state.families = INITIAL_FAMILIES;
            if (state.users.length === 0) state.users = INITIAL_USERS;
            if (state.tasks.length === 0) state.tasks = INITIAL_TASKS;

            // Note: We are not syncing initial mock data automatically to avoid overwriting invalid state.
            // The server starts empty, so let's populate it properly via actions if needed, or let the user create data.
            // But to preserve original behavior, we can do a one-time sync.
            // However, with the new architecture, we should trust the server.
            // If server is empty, let it be empty? Or push defaults?
            // To be safe, if we are in "Init Mock" mode, let's push the initial families/users via actions.

            // For now, let's just leave the local state populated so the UI works.
            // Persistence of this initial data will happen when modifications occur.
        }
    } catch (e) {
        console.error("Failed to load data from server", e);
        // Fallback to initial data if server fails
        if (state.families.length === 0) state.families = INITIAL_FAMILIES;
        if (state.users.length === 0) state.users = INITIAL_USERS;
        if (state.tasks.length === 0) state.tasks = INITIAL_TASKS;
    }
  },

  // Helper to send actions to server
  sendAction: async (type: string, payload: any) => {
      try {
          await fetch(`${API_BASE}/action`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, payload }),
              keepalive: true
          });
      } catch (e) {
          console.error(`Failed to send action ${type}`, e);
          // Potential retry logic could go here
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

  // Families
  getFamilies: (): Family[] => {
    return state.families;
  },

  addFamily: (name: string) => {
      const newFamily: Family = {
          id: 'f' + Date.now(),
          name
      };
      state.families.push(newFamily);
      DataService.sendAction('ADD_FAMILY', newFamily);
      return newFamily;
  },

  deleteFamily: (familyId: string) => {
      state.families = state.families.filter(f => f.id !== familyId);
      state.users = state.users.filter(u => u.familyId !== familyId);
      state.tasks = state.tasks.filter(t => t.familyId !== familyId);
      state.rewards = state.rewards.filter(r => r.familyId !== familyId);

      DataService.sendAction('DELETE_FAMILY', familyId);
  },

  // Users
  getUsers: (): User[] => {
    return state.users;
  },

  getFamilyUsers: (familyId: string): User[] => {
      return state.users.filter(u => u.familyId === familyId);
  },

  createUser: (user: User) => {
      state.users.push(user);
      DataService.sendAction('CREATE_USER', user);
  },

  updateUser: (updatedUser: User) => {
    const index = state.users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      state.users[index] = updatedUser;
      DataService.sendAction('UPDATE_USER', updatedUser);
    }
  },

  // Tasks
  getTasks: (): Task[] => {
    return state.tasks;
  },

  getFamilyTasks: (familyId: string): Task[] => {
      return state.tasks.filter(t => t.familyId === familyId);
  },
  
  saveTask: (task: Task) => {
    const existingIndex = state.tasks.findIndex(t => t.id === task.id);
    if (existingIndex >= 0) {
      state.tasks[existingIndex] = task;
    } else {
      state.tasks.push(task);
    }
    DataService.sendAction('SAVE_TASK', task);
  },

  deleteTask: (taskId: string) => {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    DataService.sendAction('DELETE_TASK', taskId);
  },

  // Completions
  getCompletions: (): TaskCompletion[] => {
    return state.completions;
  },

  toggleCompletion: (taskId: string, userId: string, date: string) => {
    const existingIndex = state.completions.findIndex(c => c.taskId === taskId && c.userId === userId && c.date === date);

    if (existingIndex >= 0) {
      // Remove (Undo)
      state.completions.splice(existingIndex, 1);
      DataService.sendAction('REMOVE_COMPLETION', { taskId, userId, date });
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
      state.completions.push(newCompletion);
      DataService.sendAction('ADD_COMPLETION', newCompletion);
    }
  },

  removeCompletion: (taskId: string, userId: string, date: string) => {
    state.completions = state.completions.filter(c => !(c.taskId === taskId && c.userId === userId && c.date === date));
    DataService.sendAction('REMOVE_COMPLETION', { taskId, userId, date });
  },

  // Extra Points
  getExtraPoints: (): ExtraPointEntry[] => {
    return state.extraPoints;
  },

  addExtraPoints: (userId: string, points: number, reason: string) => {
    const newEntry: ExtraPointEntry = {
      id: Date.now().toString(),
      userId,
      points,
      reason,
      timestamp: Date.now()
    };
    state.extraPoints.push(newEntry);
    DataService.sendAction('ADD_EXTRA_POINTS', newEntry);
  },

  // Messages (Taunts)
  getMessages: (userId: string): Message[] => {
      return state.messages.filter(m => m.toUserId === userId).sort((a,b) => b.timestamp - a.timestamp);
  },

  sendMessage: (fromUserId: string, toUserId: string, content: string, type: 'NORMAL' | 'VACILE' = 'NORMAL') => {
      const newMsg: Message = {
          id: Date.now().toString(),
          fromUserId,
          toUserId,
          content,
          timestamp: Date.now(),
          read: false,
          type
      };
      state.messages.push(newMsg);
      DataService.sendAction('SEND_MESSAGE', newMsg);
  },

  markMessageRead: (msgId: string) => {
      const msg = state.messages.find(m => m.id === msgId);
      if(msg) {
          msg.read = true;
          DataService.sendAction('MARK_MESSAGE_READ', msgId);
      }
  },

  // Events
  getEvents: (): Event[] => {
    return state.events;
  },

  saveEvent: (event: Event) => {
    if (!event.completedBy) event.completedBy = [];

    const existingIndex = state.events.findIndex(e => e.id === event.id);
    if (existingIndex >= 0) {
      state.events[existingIndex] = event;
    } else {
      state.events.push(event);
    }
    DataService.sendAction('SAVE_EVENT', event);
  },

  markEventAsRead: (eventId: string, userId: string) => {
    const event = state.events.find(e => e.id === eventId);
    if(event && !event.readBy.includes(userId)) {
      event.readBy.push(userId);
      DataService.sendAction('MARK_EVENT_READ', { eventId, userId });
    }
  },

  markEventCompleted: (eventId: string, userId: string) => {
      const event = state.events.find(e => e.id === eventId);
      if (event) {
          if (!event.completedBy) event.completedBy = [];
          if (!event.completedBy.includes(userId)) {
              event.completedBy.push(userId);
              DataService.sendAction('MARK_EVENT_COMPLETED', { eventId, userId });
          }
      }
  },

  // Rewards (Custom Store)
  getRewards: (): Reward[] => {
    return state.rewards;
  },

  getFamilyRewards: (familyId: string): Reward[] => {
    return state.rewards.filter(r => r.familyId === familyId);
  },

  saveReward: (reward: Reward) => {
    const existingIndex = state.rewards.findIndex(r => r.id === reward.id);
    if (existingIndex >= 0) {
      state.rewards[existingIndex] = reward;
    } else {
      state.rewards.push(reward);
    }
    DataService.sendAction('SAVE_REWARD', reward);
  },

  deleteReward: (rewardId: string) => {
    state.rewards = state.rewards.filter(r => r.id !== rewardId);
    DataService.sendAction('DELETE_REWARD', rewardId);
  },

  redeemReward: (userId: string, rewardId: string): boolean => {
    const reward = state.rewards.find(r => r.id === rewardId);
    if (!reward) return false;

    const stats = DataService.getUserStats(userId);
    if (stats.spendablePoints < reward.cost) return false;

    // Check Availability
    const rewardTransactions = state.transactions.filter(t => t.itemId === rewardId);

    if (reward.limitType === 'unique' && rewardTransactions.length > 0) {
        return false;
    }

    if (reward.limitType === 'once_per_user') {
        const myPurchase = rewardTransactions.find(t => t.userId === userId);
        if (myPurchase) return false;
    }

    // Add transaction
    const transaction: ShopTransaction = {
        id: Date.now().toString(),
        userId,
        itemId: rewardId,
        cost: reward.cost,
        timestamp: Date.now()
    };
    state.transactions.push(transaction);
    DataService.sendAction('ADD_TRANSACTION', transaction);

    return true;
  },

  // Transactions / Shop
  getTransactions: (userId: string): ShopTransaction[] => {
      return state.transactions.filter(t => t.userId === userId);
  },

  getFamilyTransactions: (familyId: string): ShopTransaction[] => {
      const users = DataService.getFamilyUsers(familyId);
      const userIds = users.map(u => u.id);
      return state.transactions.filter(t => userIds.includes(t.userId));
  },

  purchaseItem: (userId: string, itemId: string, cost: number): boolean => {
      const stats = DataService.getUserStats(userId);
      if (stats.spendablePoints < cost) return false;

      const transaction: ShopTransaction = {
          id: Date.now().toString(),
          userId,
          itemId,
          cost,
          timestamp: Date.now()
      };

      // Add transaction
      state.transactions.push(transaction);

      // Add to inventory
      const user = state.users.find(u => u.id === userId);
      if (user) {
          if (!user.inventory) user.inventory = [];
          if (!user.inventory.includes(itemId)) {
              user.inventory.push(itemId);
          }
          // Note: We don't call updateUser here because we're sending a specific purchase action
          // that handles both transaction and inventory.
          DataService.sendAction('PURCHASE_ITEM', { transaction, userId, itemId });
      }
      return true;
  },

  updateAvatarConfig: (userId: string, config: AvatarConfig) => {
      const user = state.users.find(u => u.id === userId);
      if (user) {
          user.avatarConfig = config;
          // Reuse update user action
          DataService.updateUser(user);
      }
  },

  // Aggregation
  getUserStats: (userId: string) => {
    const completions = state.completions.filter(c => c.userId === userId);
    const tasks = state.tasks;
    const extraPointsList = state.extraPoints.filter(e => e.userId === userId);
    
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

    // Calculate Spent Points
    const transactions = DataService.getTransactions(userId);
    const spentPoints = transactions.reduce((sum, t) => sum + t.cost, 0);
    const spendablePoints = points - spentPoints;

    const tasksCompletedCount = completions.length;
    
    // Vaciles Logic
    const sentVaciles = state.messages.filter(m => m.fromUserId === userId && m.type === 'VACILE');
    const vacilesSentCount = sentVaciles.length;

    let vacilesSentInternal = 0;
    let vacilesSentExternal = 0;

    const user = state.users.find(u => u.id === userId);
    if (user) {
        sentVaciles.forEach(msg => {
            const recipient = state.users.find(u => u.id === msg.toUserId);
            if (recipient) {
                if (recipient.familyId === user.familyId) {
                    vacilesSentInternal++;
                } else {
                    vacilesSentExternal++;
                }
            }
        });
    }

    const earnedBadges = BADGES.filter(b => b.condition(points, tasksCompletedCount));

    return { points, spendablePoints, tasksCompletedCount, earnedBadges, extraPointsList, vacilesSentCount, vacilesSentInternal, vacilesSentExternal };
  },

  getLeaderboard: (familyId?: string) => {
    let users = state.users.filter(u => u.role === Role.KID);
    if (familyId) {
        users = users.filter(u => u.familyId === familyId);
    }
    return users.map(u => {
      const stats = DataService.getUserStats(u.id);
      return {
        ...u,
        ...stats
      };
    }).sort((a, b) => b.points - a.points);
  }
};
