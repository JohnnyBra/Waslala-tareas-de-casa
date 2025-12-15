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

// Storage Keys
const KEYS = {
  FAMILIES: 'st_families',
  USERS: 'st_users',
  TASKS: 'st_tasks',
  COMPLETIONS: 'st_completions',
  EXTRA_POINTS: 'st_extra_points',
  MESSAGES: 'st_messages',
  EVENTS: 'st_events',
  TRANSACTIONS: 'st_transactions',
  REWARDS: 'st_rewards',
  LAST_UPDATED: 'st_last_updated',
  LAST_SYNCED: 'st_last_synced'
};

// API Base URL
const API_BASE = '/api';

// Helper to get today's date string YYYY-MM-DD
export const getTodayString = () => new Date().toISOString().split('T')[0];

// Synchronization State
let syncTimeout: any = null;
let isSyncing = false;
let pendingSync = false;

export const DataService = {
  // Initialization: Load from server and populate localStorage
  init: async () => {
    try {
        // Check for unsaved local changes
        const lastUpdated = parseInt(localStorage.getItem(KEYS.LAST_UPDATED) || '0');
        const lastSynced = parseInt(localStorage.getItem(KEYS.LAST_SYNCED) || '0');

        // If we have local changes not yet synced (and lastUpdated is reasonably recent/valid)
        if (lastUpdated > lastSynced && lastUpdated > 0) {
            console.log("Found unsaved local changes, syncing to server...", { lastUpdated, lastSynced });
            await DataService.processSync();
            // We assume local state is now the authority.
            return;
        }

        const response = await fetch(`${API_BASE}/data`);
        const serverData = await response.json();

        if (serverData && Object.keys(serverData).length > 0) {
            // Load server data into localStorage
            if(serverData.families) localStorage.setItem(KEYS.FAMILIES, JSON.stringify(serverData.families));
            if(serverData.users) localStorage.setItem(KEYS.USERS, JSON.stringify(serverData.users));
            if(serverData.tasks) localStorage.setItem(KEYS.TASKS, JSON.stringify(serverData.tasks));
            if(serverData.completions) localStorage.setItem(KEYS.COMPLETIONS, JSON.stringify(serverData.completions));
            if(serverData.extraPoints) localStorage.setItem(KEYS.EXTRA_POINTS, JSON.stringify(serverData.extraPoints));
            if(serverData.messages) localStorage.setItem(KEYS.MESSAGES, JSON.stringify(serverData.messages));
            if(serverData.events) localStorage.setItem(KEYS.EVENTS, JSON.stringify(serverData.events));
            if(serverData.transactions) localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(serverData.transactions));
            if(serverData.rewards) localStorage.setItem(KEYS.REWARDS, JSON.stringify(serverData.rewards));

            // Sync timestamps
            const now = Date.now().toString();
            localStorage.setItem(KEYS.LAST_SYNCED, now);
            localStorage.setItem(KEYS.LAST_UPDATED, now);
        } else {
            // If server is empty, use initial data if local is also empty
            if (!localStorage.getItem(KEYS.FAMILIES)) {
                localStorage.setItem(KEYS.FAMILIES, JSON.stringify(INITIAL_FAMILIES));
            }
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
            if (!localStorage.getItem(KEYS.EVENTS)) {
                localStorage.setItem(KEYS.EVENTS, JSON.stringify([]));
            }
            if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
                localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
            }
            if (!localStorage.getItem(KEYS.REWARDS)) {
                localStorage.setItem(KEYS.REWARDS, JSON.stringify([]));
            }
            // Save initial data to server
            DataService.syncToServer();
        }
    } catch (e) {
        console.error("Failed to load data from server, falling back to local storage", e);
        // Fallback init
        if (!localStorage.getItem(KEYS.FAMILIES)) localStorage.setItem(KEYS.FAMILIES, JSON.stringify(INITIAL_FAMILIES));
        if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
        if (!localStorage.getItem(KEYS.TASKS)) localStorage.setItem(KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    }
  },

  // Public sync request (debounced)
  syncToServer: () => {
      // Mark local state as updated
      localStorage.setItem(KEYS.LAST_UPDATED, Date.now().toString());

      if (syncTimeout) {
          clearTimeout(syncTimeout);
      }

      // Debounce sync request
      syncTimeout = setTimeout(() => {
          DataService.processSync();
      }, 2000); // 2 seconds debounce
  },

  // Actual sync process
  processSync: async () => {
      if (isSyncing) {
          pendingSync = true;
          return;
      }

      isSyncing = true;
      const data = {
          families: JSON.parse(localStorage.getItem(KEYS.FAMILIES) || '[]'),
          users: JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
          tasks: JSON.parse(localStorage.getItem(KEYS.TASKS) || '[]'),
          completions: JSON.parse(localStorage.getItem(KEYS.COMPLETIONS) || '[]'),
          extraPoints: JSON.parse(localStorage.getItem(KEYS.EXTRA_POINTS) || '[]'),
          messages: JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]'),
          events: JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]'),
          transactions: JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]'),
          rewards: JSON.parse(localStorage.getItem(KEYS.REWARDS) || '[]')
      };

      try {
          await fetch(`${API_BASE}/data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
              keepalive: true // Important for background sync on tab close
          });

          // On success, mark as synced
          localStorage.setItem(KEYS.LAST_SYNCED, Date.now().toString());

      } catch (e) {
          console.error("Failed to sync to server", e);
          // Retry? For now, we rely on the next sync or reload/init logic
      } finally {
          isSyncing = false;
          if (pendingSync) {
              pendingSync = false;
              DataService.syncToServer(); // Trigger another debounce cycle if changes happened during sync
          }
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
    return JSON.parse(localStorage.getItem(KEYS.FAMILIES) || '[]');
  },

  addFamily: (name: string) => {
      const families = DataService.getFamilies();
      const newFamily: Family = {
          id: 'f' + Date.now(),
          name
      };
      families.push(newFamily);
      localStorage.setItem(KEYS.FAMILIES, JSON.stringify(families));
      DataService.syncToServer();
      return newFamily;
  },

  // Users
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },

  // Get users for a specific family
  getFamilyUsers: (familyId: string): User[] => {
      return DataService.getUsers().filter(u => u.familyId === familyId);
  },

  createUser: (user: User) => {
      const users = DataService.getUsers();
      users.push(user);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      DataService.syncToServer();
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

  getFamilyTasks: (familyId: string): Task[] => {
      return DataService.getTasks().filter(t => t.familyId === familyId);
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

  sendMessage: (fromUserId: string, toUserId: string, content: string, type: 'NORMAL' | 'VACILE' = 'NORMAL') => {
      // Send a new motivation message
      const allMessages: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      const newMsg: Message = {
          id: Date.now().toString(),
          fromUserId,
          toUserId,
          content,
          timestamp: Date.now(),
          read: false,
          type
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

  // Events
  getEvents: (): Event[] => {
    return JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
  },

  saveEvent: (event: Event) => {
    const events = DataService.getEvents();
    const existingIndex = events.findIndex(e => e.id === event.id);
    if (existingIndex >= 0) {
      events[existingIndex] = event;
    } else {
      events.push(event);
    }
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
    DataService.syncToServer();
  },

  markEventAsRead: (eventId: string, userId: string) => {
    const events = DataService.getEvents();
    const event = events.find(e => e.id === eventId);
    if(event && !event.readBy.includes(userId)) {
      event.readBy.push(userId);
      localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
      DataService.syncToServer();
    }
  },

  // Rewards (Custom Store)
  getRewards: (): Reward[] => {
    return JSON.parse(localStorage.getItem(KEYS.REWARDS) || '[]');
  },

  getFamilyRewards: (familyId: string): Reward[] => {
    return DataService.getRewards().filter(r => r.familyId === familyId);
  },

  saveReward: (reward: Reward) => {
    const rewards = DataService.getRewards();
    const existingIndex = rewards.findIndex(r => r.id === reward.id);
    if (existingIndex >= 0) {
      rewards[existingIndex] = reward;
    } else {
      rewards.push(reward);
    }
    localStorage.setItem(KEYS.REWARDS, JSON.stringify(rewards));
    DataService.syncToServer();
  },

  deleteReward: (rewardId: string) => {
    const rewards = DataService.getRewards().filter(r => r.id !== rewardId);
    localStorage.setItem(KEYS.REWARDS, JSON.stringify(rewards));
    DataService.syncToServer();
  },

  redeemReward: (userId: string, rewardId: string): boolean => {
    const rewards = DataService.getRewards();
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return false;

    const stats = DataService.getUserStats(userId);
    if (stats.spendablePoints < reward.cost) return false;

    // Check Availability
    const allTransactions: ShopTransaction[] = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
    const rewardTransactions = allTransactions.filter(t => t.itemId === rewardId);

    if (reward.limitType === 'unique' && rewardTransactions.length > 0) {
        return false; // Already bought by someone
    }

    if (reward.limitType === 'once_per_user') {
        const myPurchase = rewardTransactions.find(t => t.userId === userId);
        if (myPurchase) return false; // Already bought by this user
    }

    // Add transaction
    allTransactions.push({
        id: Date.now().toString(),
        userId,
        itemId: rewardId,
        cost: reward.cost,
        timestamp: Date.now()
    });
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(allTransactions));
    DataService.syncToServer();

    return true;
  },

  // Transactions / Shop
  getTransactions: (userId: string): ShopTransaction[] => {
      const all: ShopTransaction[] = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
      return all.filter(t => t.userId === userId);
  },

  getFamilyTransactions: (familyId: string): ShopTransaction[] => {
      // Fetch all transactions for a family to check global limits
      const all: ShopTransaction[] = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
      const users = DataService.getFamilyUsers(familyId);
      const userIds = users.map(u => u.id);
      return all.filter(t => userIds.includes(t.userId));
  },

  purchaseItem: (userId: string, itemId: string, cost: number): boolean => {
      const stats = DataService.getUserStats(userId);
      if (stats.spendablePoints < cost) return false;

      // Add transaction
      const allTransactions: ShopTransaction[] = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]');
      allTransactions.push({
          id: Date.now().toString(),
          userId,
          itemId,
          cost,
          timestamp: Date.now()
      });
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(allTransactions));

      // Add to inventory
      const users = DataService.getUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
          if (!user.inventory) user.inventory = [];
          if (!user.inventory.includes(itemId)) {
              user.inventory.push(itemId);
          }
          // If it's a base, auto-equip it if current base is undefined? No, let them equip.
          // Save user
          DataService.updateUser(user);
      }

      DataService.syncToServer();
      return true;
  },

  updateAvatarConfig: (userId: string, config: AvatarConfig) => {
      const users = DataService.getUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
          user.avatarConfig = config;
          DataService.updateUser(user);
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

    // Calculate Spent Points
    const transactions = DataService.getTransactions(userId);
    const spentPoints = transactions.reduce((sum, t) => sum + t.cost, 0);
    const spendablePoints = points - spentPoints;

    const tasksCompletedCount = completions.length;
    
    // Vaciles Logic
    const allMessages = DataService.getMessages(userId); // Messages received (not useful for sent count)
    const rawAllMessages: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
    const sentVaciles = rawAllMessages.filter(m => m.fromUserId === userId && m.type === 'VACILE');
    const vacilesSentCount = sentVaciles.length;

    let vacilesSentInternal = 0;
    let vacilesSentExternal = 0;

    const user = DataService.getUsers().find(u => u.id === userId);
    if (user) {
        const allUsers = DataService.getUsers();
        sentVaciles.forEach(msg => {
            const recipient = allUsers.find(u => u.id === msg.toUserId);
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
    let users = DataService.getUsers().filter(u => u.role === Role.KID);
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

// Listen for window unload to attempt a final sync
window.addEventListener('beforeunload', () => {
    if (syncTimeout) {
        DataService.processSync();
    }
});
