import React, { useState, useEffect, useRef } from 'react';
import { User, Task, TaskCompletion, Role, Message, Event as AppEvent, Reward } from '../types';
import { DataService, getTodayString } from '../services/dataService';
import { Icons } from './Icon';
import Confetti from 'canvas-confetti';
import Avatar from './Avatar';
import AvatarEditor from './AvatarEditor';

interface Props {
  currentUser: User;
  onUserUpdate?: (user: User) => void;
}

const AVATAR_OPTIONS = ['🧑', '👧', '👦', '👶', '👱‍♀️', '🦸', '🦸‍♀️', '🧚', '🧞', '🧝', '🐶', '🐱', '🦊', '🦁', '🦄', '🦖', '🐉', '⚽', '🏀', '🚀', '🎮', '🎨', '🎸', '🌈'];

const TAUNT_MESSAGES = [
    "¡Llevo más tareas que tú! 😝",
    "¡Comed mi polvo! 💨",
    "¡Voy ganando! 🚀",
    "¡Soy una máquina de tareas! 🤖",
    "¡A trabajar perezosos! 🐌",
    "¡Mirad mis puntos! 🌟"
];

const KidDashboard: React.FC<Props> = ({ currentUser, onUserUpdate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]); // New state for task-list events
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [stats, setStats] = useState(DataService.getUserStats(currentUser.id));
  const [view, setView] = useState<'tasks' | 'ranking' | 'badges' | 'store'>('tasks');
  const [leaderboard, setLeaderboard] = useState(DataService.getLeaderboard(currentUser.familyId));
  const [transactions, setTransactions] = useState<any[]>([]);
  // Separated scopes for ranking
  const [rankingScope, setRankingScope] = useState<'family' | 'global'>('family');
  const [rankingTimeframe, setRankingTimeframe] = useState<'weekly' | 'monthly' | 'global'>('global');

  // Events State (Modal)
  const [activeEvent, setActiveEvent] = useState<AppEvent | null>(null);
  
  // Weekly View State
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modals & User Update State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');

  // Taunt System State
  const [showTauntModal, setShowTauntModal] = useState(false);
  const [tauntTarget, setTauntTarget] = useState<string>('');
  const [tauntMessage, setTauntMessage] = useState<string>('');
  const [showInbox, setShowInbox] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allKids, setAllKids] = useState<User[]>([]);

  // Derived state for available vaciles
  const [vacilesInternalAvailable, setVacilesInternalAvailable] = useState(0);
  const [vacilesExternalAvailable, setVacilesExternalAvailable] = useState(0);


  const todayStr = getTodayString(); // Today's date YYYY-MM-DD
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    checkEvents();
  }, [currentUser, selectedDate]);

  const getSelectedDateString = () => selectedDate.toISOString().split('T')[0];

  const loadData = () => {
    // 1. Determine day of week for the Selected Date (0=Sun, 1=Mon...)
    const dayOfWeek = selectedDate.getDay(); 
    const dateStr = getSelectedDateString();

    // 2. Filter tasks assigned to user AND scheduled for that day
    const allTasks = DataService.getTasks();
    const myTasks = allTasks.filter(t => 
      t.assignedTo.includes(currentUser.id) && 
      t.recurrence.includes(dayOfWeek)
    );
    setTasks(myTasks);

    // 3. Fetch Events for the day
    const allEvents = DataService.getEvents();
    const todayEvents = allEvents.filter(e =>
        e.assignedTo.includes(currentUser.id) &&
        e.date === dateStr
    );
    setEvents(todayEvents);

    setRewards(DataService.getFamilyRewards(currentUser.familyId));
    setCompletions(DataService.getCompletions());
    const currentStats = DataService.getUserStats(currentUser.id);
    setStats(currentStats);
    setLeaderboard(DataService.getLeaderboard(currentUser.familyId));
    setMessages(DataService.getMessages(currentUser.id));
    setTransactions(DataService.getFamilyTransactions(currentUser.familyId));
    setAllKids(DataService.getUsers().filter(u => u.role === Role.KID && u.id !== currentUser.id));

    // Update Vaciles Counters
    setVacilesInternalAvailable(Math.floor(currentStats.tasksCompletedCount / 5) - (currentStats.vacilesSentInternal || 0));
    setVacilesExternalAvailable(Math.floor(currentStats.tasksCompletedCount / 30) - (currentStats.vacilesSentExternal || 0));
  };

  const checkEvents = () => {
      const events = DataService.getEvents();
      const today = getTodayString();
      // Find unread event for today or past unread events (optional, let's stick to showing if it's assigned)
      // We show one event at a time
      const eventToShow = events.find(e =>
          e.assignedTo.includes(currentUser.id) &&
          !e.readBy.includes(currentUser.id) &&
          e.date <= today // Show if date is today or past
      );

      if (eventToShow) {
          setActiveEvent(eventToShow);
          if (eventToShow.style === 'sparkle') {
               Confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FFFFFF']
            });
          }
      }
  };

  const handleCloseEvent = () => {
      if (activeEvent) {
          DataService.markEventAsRead(activeEvent.id, currentUser.id);

          // Award points if event has them
          if (activeEvent.points && activeEvent.points > 0) {
              DataService.addExtraPoints(currentUser.id, activeEvent.points, `Evento: ${activeEvent.title}`);
              loadData();
          }

          setActiveEvent(null);
          // Check for more events after a short delay
          setTimeout(checkEvents, 500);
      }
  };

  const handleToggleTask = (taskId: string) => {
    const dateStr = getSelectedDateString();
    
    // Check if task date is today. If not, don't allow toggle.
    if (dateStr !== todayStr) {
        alert("Solo puedes marcar tareas del día de hoy.");
        return;
    }

    // Check completion BEFORE toggle to know if we are completing or undoing
    const isNowCompleted = !completions.some(c => c.taskId === taskId && c.userId === currentUser.id && c.date === dateStr);
    
    DataService.toggleCompletion(taskId, currentUser.id, dateStr);

    if (isNowCompleted) {
        if (dateStr === todayStr) {
            Confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
        
        // Taunt Logic: Trigger modal if available (simplified check)
        const newTotalTasks = stats.tasksCompletedCount + 1;
        if (newTotalTasks % 30 === 0) {
             setTimeout(() => setShowTauntModal(true), 1000);
        } else if (newTotalTasks % 5 === 0) {
             // Maybe notify about internal vacile available?
             // For now just refresh data
        }
    }

    loadData();
  };

  const handleToggleEvent = (event: AppEvent) => {
      const isRead = event.readBy.includes(currentUser.id);
      if (isRead) return; // Already read/done

      DataService.markEventAsRead(event.id, currentUser.id);

      if (event.points && event.points > 0) {
          DataService.addExtraPoints(currentUser.id, event.points, `Evento: ${event.title}`);
      }

      Confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: event.style === 'golden' ? ['#FFD700', '#FFA500'] : (event.style === 'sparkle' ? ['#FFD700', '#FF00FF', '#00FFFF'] : ['#26ccff', '#a25afd'])
      });

      loadData();
  };

  const handleSendTaunt = () => {
      if (tauntTarget && tauntMessage) {
          DataService.sendMessage(currentUser.id, tauntTarget, tauntMessage, 'VACILE');
          setShowTauntModal(false);
          setTauntTarget('');
          setTauntMessage('');
          loadData(); // Refresh to update vacile count
          alert('¡Vacile enviado!');
      }
  };

  const handleOpenInbox = () => {
      setShowInbox(true);
      // Mark all as read when opening (or we could do it individually)
      messages.forEach(m => {
          if (!m.read) DataService.markMessageRead(m.id);
      });
      // Refresh messages to update read status visually if needed
      setTimeout(loadData, 500); 
  };

  const handleBuyReward = (reward: Reward) => {
      if (stats.spendablePoints < reward.cost) {
          alert("¡No tienes suficientes puntos!");
          return;
      }
      if (confirm(`¿Quieres comprar "${reward.name}" por ${reward.cost} puntos?`)) {
          const success = DataService.redeemReward(currentUser.id, reward.id);
          if (success) {
               Confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF69B4', '#FFD700', '#FFFFFF']
               });
               loadData();
          }
      }
  };

  // --- Avatar Logic ---
  const handleAvatarSelect = (newAvatar: string) => {
    if (onUserUpdate) {
        onUserUpdate({ ...currentUser, avatar: newAvatar });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUserUpdate) {
        try {
            const uploadedUrl = await DataService.uploadImage(file);
            onUserUpdate({ ...currentUser, avatar: uploadedUrl });
        } catch (e) {
            console.error("Failed to upload image", e);
            alert("Error al subir la imagen. Inténtalo de nuevo.");
        }
    }
  };

  const handleAvatarUpdate = () => {
      // Force reload stats/user data
      setStats(DataService.getUserStats(currentUser.id));
      if (onUserUpdate) {
          // Re-fetch user to get updated config/inventory
          const updatedUser = DataService.getUsers().find(u => u.id === currentUser.id);
          if (updatedUser) onUserUpdate(updatedUser);
      }
  };

  // --- Password Logic ---
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if(newPin.length < 4) {
        setPinMessage('El PIN debe tener al menos 4 números');
        return;
    }
    if(newPin !== confirmPin) {
        setPinMessage('Los PINs no coinciden');
        return;
    }
    if (onUserUpdate) {
        onUserUpdate({ ...currentUser, pin: newPin });
        setPinMessage('¡Contraseña cambiada con éxito!');
        setNewPin('');
        setConfirmPin('');
        setTimeout(() => setPinMessage(''), 2000);
    }
  };

  const isCompleted = (taskId: string) => {
    const dateStr = getSelectedDateString();
    return completions.some(c => c.taskId === taskId && c.userId === currentUser.id && c.date === dateStr);
  };

  const getTaskStatus = (task: Task) => {
      const dateStr = getSelectedDateString();
      const myCompletion = completions.find(c => c.taskId === task.id && c.userId === currentUser.id && c.date === dateStr);

      if (myCompletion) return { status: 'completed_by_me' };

      if (task.isUnique) {
          const anyCompletion = completions.find(c => c.taskId === task.id && c.date === dateStr);
          if (anyCompletion) {
              const user = allKids.find(k => k.id === anyCompletion.userId);
              return { status: 'completed_by_other', user };
          }
      }

      return { status: 'pending' };
  };

  // --- Render Helpers ---
  const getWeekDays = () => {
      const curr = new Date();
      // Adjust to get Monday of current week
      const first = curr.getDate() - curr.getDay() + 1; // 1 = Monday
      const days = [];
      
      const startOfWeek = new Date(curr.setDate(first)); 
      if (new Date().getDay() === 0) {
          startOfWeek.setDate(startOfWeek.getDate() - 7);
      }

      for (let i = 0; i < 7; i++) {
          const next = new Date(startOfWeek);
          next.setDate(startOfWeek.getDate() + i);
          days.push(next);
      }
      return days;
  };

  const weekDays = getWeekDays();
  const weekDayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // 0 is Sunday

  const renderStore = () => (
      <div className="animate-fade-in pb-20">
          <div className="bg-brand-pink/10 p-4 rounded-2xl mb-6 text-center border-2 border-brand-pink border-dashed">
              <h2 className="text-xl font-bold text-brand-pink mb-1">Tu Saldo</h2>
              <div className="text-4xl font-extrabold text-brand-pink flex items-center justify-center gap-2">
                  <Icons.Star className="fill-current" /> {stats.spendablePoints}
              </div>
              <p className="text-xs text-brand-pink/70 mt-1">Puntos disponibles para gastar</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Icons.ShoppingBag className="text-brand-pink" /> Premios
          </h2>

          <div className="grid grid-cols-2 gap-4">
              {rewards.map(reward => {
                  const rewardTransactions = transactions.filter(t => t.itemId === reward.id);
                  const myTransactions = rewardTransactions.filter(t => t.userId === currentUser.id);
                  const isUniqueSold = reward.limitType === 'unique' && rewardTransactions.length > 0;
                  const isBoughtByMe = reward.limitType === 'once_per_user' && myTransactions.length > 0;

                  const isSoldOut = isUniqueSold && !myTransactions.length;
                  const isAlreadyBought = isBoughtByMe || (isUniqueSold && myTransactions.length > 0);

                  const canAfford = stats.spendablePoints >= reward.cost;
                  const isDisabled = !canAfford || isSoldOut || isAlreadyBought;

                  return (
                      <button
                          key={reward.id}
                          onClick={() => handleBuyReward(reward)}
                          disabled={isDisabled}
                          className={`
                            relative p-4 rounded-2xl shadow-sm border-b-4 text-center transition-all active:scale-95
                            ${isDisabled ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' : 'bg-white border-brand-pink/20 hover:border-brand-pink'}
                          `}
                      >
                          <div className="text-5xl mb-3 transform transition-transform hover:scale-110">{reward.icon}</div>
                          <h3 className="font-bold text-gray-800 leading-tight mb-2 min-h-[2.5rem] flex items-center justify-center">{reward.name}</h3>

                          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                {reward.limitType === 'unique' && (
                                    <span className="bg-purple-100 text-purple-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-purple-200">ÚNICO</span>
                                )}
                                {reward.limitType === 'once_per_user' && (
                                    <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200">1/PERS</span>
                                )}
                          </div>

                          {isSoldOut ? (
                               <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-400 text-white">
                                   AGOTADO
                               </div>
                          ) : isAlreadyBought ? (
                              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                                  COMPRADO
                              </div>
                          ) : (
                              <div className={`
                                inline-block px-3 py-1 rounded-full text-xs font-bold
                                ${canAfford ? 'bg-brand-pink text-white' : 'bg-gray-300 text-gray-500'}
                              `}>
                                  {reward.cost} Puntos
                              </div>
                          )}
                      </button>
                  )
              })}
              {rewards.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-gray-400">
                      <div className="text-4xl mb-2">🏪</div>
                      <p>¡Dile a tus papis que añadan premios!</p>
                  </div>
              )}
          </div>
      </div>
  );

  const renderWeekSelector = () => (
      <div className="flex justify-between items-center bg-white p-2 rounded-2xl shadow-sm mb-6 mx-2 overflow-x-auto no-scrollbar">
          {weekDays.map((d, i) => {
              const isSelected = d.toDateString() === selectedDate.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();
              const dayName = weekDayNames[d.getDay()];
              const dayNumber = d.getDate();

              return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(d)}
                    className={`
                        flex flex-col items-center justify-center min-w-[3rem] h-14 rounded-xl mx-1 transition-all
                        ${isSelected ? 'bg-brand-blue text-white shadow-md scale-105' : 'bg-transparent text-gray-400 hover:bg-gray-100'}
                        ${isToday && !isSelected ? 'border-2 border-brand-yellow text-brand-dark' : ''}
                    `}
                  >
                      <span className="text-xs font-bold">{dayName}</span>
                      <span className="text-lg font-bold leading-none">{dayNumber}</span>
                  </button>
              )
          })}
      </div>
  );

  const getRankingData = () => {
      let filteredCompletions = DataService.getCompletions();
      let filteredExtras = DataService.getExtraPoints();

      if (rankingTimeframe === 'weekly') {
            const curr = new Date();
            const first = curr.getDate() - curr.getDay() + 1;
            const startOfWeek = new Date(curr.setDate(first));
            if (new Date().getDay() === 0) startOfWeek.setDate(startOfWeek.getDate() - 7);
            const startStr = startOfWeek.toISOString().split('T')[0];

            filteredCompletions = filteredCompletions.filter(c => c.date >= startStr);
            filteredExtras = filteredExtras.filter(e => new Date(e.timestamp).toISOString().split('T')[0] >= startStr);
      } else if (rankingTimeframe === 'monthly') {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            filteredCompletions = filteredCompletions.filter(c => c.date >= startOfMonth);
            filteredExtras = filteredExtras.filter(e => new Date(e.timestamp).toISOString().split('T')[0] >= startOfMonth);
      }

      const tasks = DataService.getTasks();

      // Internal Family Ranking
      if (rankingScope === 'family') {
          const users = DataService.getFamilyUsers(currentUser.familyId).filter(u => u.role === Role.KID);
          return users.map(user => {
                let points = 0;
                const userCompletions = filteredCompletions.filter(c => c.userId === user.id);
                userCompletions.forEach(c => {
                    const task = tasks.find(t => t.id === c.taskId);
                    if (task) points += task.points;
                });

                const userExtras = filteredExtras.filter(e => e.userId === user.id);
                userExtras.forEach(e => points += e.points);

                return {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    points,
                    tasksCompletedCount: userCompletions.length,
                    type: 'user'
                };
          }).sort((a, b) => b.points - a.points);
      } else {
          // Global Inter-Family Ranking
          const families = DataService.getFamilies();
          const allKids = DataService.getUsers().filter(u => u.role === Role.KID);

          return families.map(family => {
              const familyKids = allKids.filter(k => k.familyId === family.id);
              if (familyKids.length === 0) return { id: family.id, name: family.name, avatar: '🏠', points: 0, tasksCompletedCount: 0, type: 'family' };

              let totalPoints = 0;
              let totalTasks = 0;

              familyKids.forEach(kid => {
                  const kidCompletions = filteredCompletions.filter(c => c.userId === kid.id);
                  const kidExtras = filteredExtras.filter(e => e.userId === kid.id);

                  // Calculate raw points for kid
                  let kidPoints = 0;
                  kidCompletions.forEach(c => {
                      const task = tasks.find(t => t.id === c.taskId);
                      if (task) kidPoints += task.points;
                  });
                  kidExtras.forEach(e => kidPoints += e.points);

                  totalPoints += kidPoints;
                  totalTasks += kidCompletions.length;
              });

              // Relative Score: Total Points / Num Kids
              const relativeScore = Math.round(totalPoints / familyKids.length);

              return {
                  id: family.id,
                  name: family.name,
                  avatar: '🏠', // Or a family icon
                  points: relativeScore,
                  tasksCompletedCount: totalTasks,
                  type: 'family'
              };
          }).sort((a, b) => b.points - a.points);
      }
  };

  const renderRanking = () => {
      const rankingData = getRankingData();

      return (
        <div className="space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-brand-dark mb-4 flex items-center gap-2">
            <Icons.Trophy className="text-brand-yellow" /> Ranking
        </h2>

        {/* Scope Selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
             <button onClick={() => setRankingScope('family')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${rankingScope === 'family' ? 'bg-white shadow-sm text-brand-blue' : 'text-gray-500'}`}>Mi Familia</button>
             <button onClick={() => setRankingScope('global')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${rankingScope === 'global' ? 'bg-white shadow-sm text-brand-blue' : 'text-gray-500'}`}>Entre Familias</button>
        </div>

        {/* Timeframe Selector */}
        <div className="flex bg-gray-200 p-1 rounded-xl mb-4">
             <button onClick={() => setRankingTimeframe('weekly')} className={`flex-1 py-1 rounded-lg text-xs font-bold ${rankingTimeframe === 'weekly' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Semanal</button>
             <button onClick={() => setRankingTimeframe('monthly')} className={`flex-1 py-1 rounded-lg text-xs font-bold ${rankingTimeframe === 'monthly' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Mensual</button>
             <button onClick={() => setRankingTimeframe('global')} className={`flex-1 py-1 rounded-lg text-xs font-bold ${rankingTimeframe === 'global' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Total</button>
        </div>

        {rankingData.map((item, index) => (
            <div key={item.id} className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden ${item.id === currentUser.familyId && rankingScope === 'global' ? 'border-2 border-brand-blue' : ''}`}>
                {index === 0 && <div className="absolute top-0 right-0 bg-brand-yellow text-xs font-bold px-2 py-1 rounded-bl-lg">LÍDER</div>}
            <div className="font-bold text-2xl text-gray-300 w-8">{index + 1}</div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 shadow-sm border-2 border-white">
                {item.avatar.startsWith('data:') ? (
                    <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-2xl">{item.avatar}</span>
                )}
            </div>
            <div className="flex-1">
                <div className="font-bold text-gray-800">{item.name} {item.id === currentUser.id && '(Tú)'} {item.id === currentUser.familyId && rankingScope === 'global' && '(Tu Familia)'}</div>
                <div className="text-xs text-gray-500">
                    {rankingScope === 'global' ? 'Puntos relativos' : `${item.tasksCompletedCount} tareas`}
                </div>
            </div>
            <div className="font-extrabold text-brand-blue text-xl">{item.points} pts</div>
            </div>
        ))}

        {rankingScope === 'global' && (
            <div className="text-center text-xs text-gray-400 mt-2 italic">
                * Puntos relativos = Total puntos familia / Número de niños
            </div>
        )}
        </div>
      );
  };

  const renderBadges = () => (
    <div className="grid grid-cols-2 gap-4 animate-fade-in">
      {stats.earnedBadges.length === 0 && (
        <div className="col-span-2 text-center py-10 text-gray-500">
            ¡Aún no tienes insignias! Sigue completando tareas.
        </div>
      )}
      {stats.earnedBadges.map(badge => (
        <div key={badge.id} className="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center text-center border-2 border-brand-yellow">
          <div className="text-5xl mb-2">{badge.icon}</div>
          <h3 className="font-bold text-gray-800">{badge.name}</h3>
          <p className="text-xs text-gray-500">{badge.description}</p>
        </div>
      ))}
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-4 pb-24 animate-fade-in">
      
      {renderWeekSelector()}

      <div className="px-2 mb-2 text-sm text-gray-500 font-bold flex justify-between items-center">
        <span>{selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        {selectedDate.toDateString() === new Date().toDateString() && <span className="bg-brand-green/20 text-brand-green px-2 py-0.5 rounded-full text-xs">Hoy</span>}
      </div>

      {(tasks.length === 0 && events.length === 0) ? (
        <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">😌</div>
            <p>Nada programado para este día.</p>
        </div>
      ) : (
        <>
        {/* Render Events as Special Tasks */}
        {events.map(event => {
            const isDone = event.readBy.includes(currentUser.id);
            const styleColor = event.style === 'golden' ? 'border-yellow-400 bg-yellow-50' : (event.style === 'sparkle' ? 'border-purple-400 bg-purple-50' : 'border-blue-200 bg-blue-50');
            const icon = event.style === 'golden' ? '🏆' : (event.style === 'sparkle' ? '✨' : '📅');

            return (
                <div
                    key={event.id}
                    onClick={() => handleToggleEvent(event)}
                    className={`
                        relative p-4 rounded-3xl shadow-md transition-all duration-300 transform border-4
                        ${isDone ? 'bg-gray-100 border-gray-200 opacity-80' : `${styleColor} hover:scale-[1.02] cursor-pointer`}
                    `}
                >
                    <div className="flex items-center gap-4">
                         <div className={`
                            w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-colors
                            ${isDone ? 'bg-gray-300 text-gray-500' : 'bg-white shadow-sm'}
                        `}>
                            {isDone ? <Icons.Check /> : icon}
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-bold text-lg ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {event.title}
                            </h3>
                            <p className={`text-xs ${isDone ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{event.description}</p>

                            {event.points && event.points > 0 && (
                                <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${isDone ? 'bg-gray-200 text-gray-500' : 'bg-brand-yellow text-brand-dark'}`}>
                                    🎁 +{event.points} puntos
                                </span>
                            )}
                        </div>
                    </div>
                    {!isDone && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                            ¡ESPECIAL!
                        </div>
                    )}
                </div>
            );
        })}

        {/* Render Regular Tasks */}
        {tasks.map(task => {
          const statusObj = getTaskStatus(task);
          const isDoneByMe = statusObj.status === 'completed_by_me';
          const isDoneByOther = statusObj.status === 'completed_by_other';

          return (
            <div 
                key={task.id} 
                onClick={() => {
                    if (!isDoneByOther) handleToggleTask(task.id);
                }}
                className={`
                    relative p-4 rounded-3xl shadow-md transition-all duration-300 transform border-4
                    ${isDoneByMe ? 'bg-green-50 border-brand-green' : isDoneByOther ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-transparent hover:border-brand-blue active:scale-95 cursor-pointer'}
                `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-colors
                    ${isDoneByMe ? 'bg-brand-green text-white' : isDoneByOther ? 'bg-gray-300 text-gray-500' : 'bg-gray-100'}
                `}>
                  {isDoneByMe ? <Icons.Check /> : isDoneByOther ? <Icons.Lock size={24}/> : task.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${isDoneByMe ? 'text-green-700 line-through' : isDoneByOther ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block bg-brand-yellow/20 text-brand-dark text-xs font-bold px-2 py-1 rounded-full">
                        +{task.points} puntos
                    </span>
                    {task.isUnique && (
                         <span className="bg-purple-100 text-purple-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">Única</span>
                    )}
                  </div>
                  {isDoneByOther && (
                      <p className="text-xs text-gray-500 mt-1 font-bold">
                          Completado por {statusObj.user?.name}
                      </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`p-6 pb-12 rounded-b-[3rem] shadow-lg ${currentUser.color} text-white relative overflow-hidden`}>
        <div className="flex items-center justify-between mb-6 relative z-10">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowProfileModal(true)}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors relative group overflow-hidden flex items-center justify-center border-2 border-white/50"
              >
                 {currentUser.avatar.startsWith('data:') ? (
                     <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                     <span className="text-3xl">{currentUser.avatar}</span>
                 )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.Settings className="text-white" size={20} />
                </div>
              </button>

               {/* My Character / Avatar */}
               <div className="relative -mb-4">
                  <Avatar config={currentUser.avatarConfig} size={45} />
               </div>

              <div>
                  <h1 className="font-bold text-xl">{currentUser.name}</h1>
                  <p className="text-sm opacity-90">{stats.points} Puntos Totales</p>
              </div>
           </div>

           <div className="flex gap-2">
               {/* Inbox Button */}
               <button 
                 onClick={handleOpenInbox}
                 className="bg-white/20 p-2 rounded-full backdrop-blur-sm relative hover:bg-white/30 transition-colors"
               >
                 <Icons.Mail className="text-white" />
                 {messages.some(m => !m.read) && (
                     <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
                 )}
               </button>

               {/* Vacile Button (Combined) */}
               {(vacilesInternalAvailable > 0 || vacilesExternalAvailable > 0) && (
                   <button
                       onClick={() => setShowTauntModal(true)}
                       className="bg-brand-pink text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce flex items-center gap-2"
                   >
                       <Icons.MessageCircle size={20} />
                       {vacilesInternalAvailable + vacilesExternalAvailable}
                   </button>
               )}

               <div className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm font-bold flex items-center gap-2">
                 <Icons.Star className="w-5 h-5 text-yellow-300 fill-current" />
                 {stats.points}
               </div>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl p-1 shadow-md flex mb-6 mx-2">
            <button 
                onClick={() => setView('tasks')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${view === 'tasks' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-400'}`}
            >
                Tareas
            </button>
            <button 
                onClick={() => setView('ranking')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${view === 'ranking' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-400'}`}
            >
                Ranking
            </button>
            <button 
                onClick={() => setView('badges')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${view === 'badges' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-400'}`}
            >
                Insignias
            </button>
            <button
                onClick={() => setView('store')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${view === 'store' ? 'bg-brand-pink text-white shadow-md' : 'text-gray-400'}`}
            >
                Tienda
            </button>
        </div>

        {view === 'tasks' && renderTasks()}
        {view === 'ranking' && renderRanking()}
        {view === 'badges' && renderBadges()}
        {view === 'store' && renderStore()}
      </main>

      {/* Taunt Modal */}
      {showTauntModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-in-up">
                 <div className="text-center mb-6">
                     <Icons.MessageCircle size={48} className="text-brand-pink mx-auto mb-2" />
                     <h3 className="font-bold text-2xl text-brand-dark">¡Hora de Vacilar! 😈</h3>
                     <div className="flex gap-4 justify-center mt-2 text-sm">
                         <div className="bg-gray-100 px-3 py-1 rounded-full">
                             Familia: <span className="font-bold text-brand-pink">{vacilesInternalAvailable}</span>
                         </div>
                         <div className="bg-gray-100 px-3 py-1 rounded-full">
                             Fuera: <span className="font-bold text-brand-pink">{vacilesExternalAvailable}</span>
                         </div>
                     </div>
                 </div>
                 
                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-bold text-gray-600 mb-2">¿A quién se lo envías?</label>
                         <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                             {/* Internal Family Members */}
                             {vacilesInternalAvailable > 0 && allKids.filter(k => k.familyId === currentUser.familyId).map(kid => (
                                 <button
                                    key={kid.id}
                                    onClick={() => setTauntTarget(kid.id)}
                                    className={`flex flex-col items-center min-w-[5rem] p-2 rounded-xl transition-all border-2 ${tauntTarget === kid.id ? 'bg-brand-pink text-white border-brand-pink' : 'bg-white border-gray-100'}`}
                                 >
                                    <div className="text-3xl mb-1">
                                        {kid.avatar.startsWith('data:') ? (
                                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                                <img src={kid.avatar} className="w-full h-full object-cover"/>
                                            </div>
                                        ) : kid.avatar}
                                    </div>
                                    <span className="text-xs font-bold truncate w-full text-center">{kid.name}</span>
                                    <span className="text-[10px] text-gray-400 truncate w-full text-center">Familia</span>
                                 </button>
                             ))}

                             {/* External Family Members */}
                             {vacilesExternalAvailable > 0 && allKids.filter(k => k.familyId !== currentUser.familyId).map(kid => {
                                 const families = DataService.getFamilies();
                                 const familyName = families.find(f => f.id === kid.familyId)?.name;

                                 return (
                                 <button
                                    key={kid.id}
                                    onClick={() => setTauntTarget(kid.id)}
                                    className={`flex flex-col items-center min-w-[5rem] p-2 rounded-xl transition-all border-2 ${tauntTarget === kid.id ? 'bg-brand-pink text-white border-brand-pink' : 'bg-white border-gray-100'}`}
                                 >
                                    <div className="text-3xl mb-1">
                                        {kid.avatar.startsWith('data:') ? (
                                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                                <img src={kid.avatar} className="w-full h-full object-cover"/>
                                            </div>
                                        ) : kid.avatar}
                                    </div>
                                    <span className="text-xs font-bold truncate w-full text-center">{kid.name}</span>
                                    <span className="text-[10px] text-gray-400 truncate w-full text-center">{familyName}</span>
                                 </button>
                             )})}

                             {(vacilesInternalAvailable === 0 && vacilesExternalAvailable === 0) && (
                                 <div className="w-full text-center text-gray-400 text-sm py-4">
                                     ¡No tienes vaciles disponibles! Completa más tareas.
                                 </div>
                             )}
                         </div>
                     </div>

                     <div>
                         <label className="block text-sm font-bold text-gray-600 mb-2">Elige el mensaje:</label>
                         <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                             {TAUNT_MESSAGES.map((msg, i) => (
                                 <button
                                    key={i}
                                    onClick={() => setTauntMessage(msg)}
                                    className={`p-3 rounded-xl text-left text-sm font-bold border-2 transition-all ${tauntMessage === msg ? 'border-brand-pink bg-pink-50 text-brand-pink' : 'border-gray-100 hover:border-gray-200'}`}
                                 >
                                     {msg}
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>

                 <div className="flex gap-3 mt-6">
                     <button onClick={() => setShowTauntModal(false)} className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl">Cancelar</button>
                     <button 
                        onClick={handleSendTaunt} 
                        disabled={!tauntTarget || !tauntMessage}
                        className="flex-1 py-3 bg-brand-pink text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:shadow-none"
                     >
                         Enviar
                     </button>
                 </div>
             </div>
        </div>
      )}

      {/* Inbox Modal */}
      {showInbox && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm h-[80vh] flex flex-col animate-fade-in-up">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                          <Icons.Mail size={24} className="text-brand-blue"/> Mensajes
                      </h3>
                      <button onClick={() => setShowInbox(false)} className="bg-red-100 text-red-500 p-2 rounded-full hover:bg-red-200">
                          <Icons.X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3">
                      {messages.length === 0 ? (
                          <div className="text-center py-10 text-gray-400">
                              <Icons.Mail size={48} className="mx-auto mb-2 opacity-20"/>
                              <p>No tienes mensajes nuevos.</p>
                          </div>
                      ) : (
                          messages.map(msg => {
                              const sender = DataService.getUsers().find(u => u.id === msg.fromUserId);
                              return (
                                  <div key={msg.id} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                                      <div className="flex items-center gap-3 mb-2">
                                          <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center overflow-hidden">
                                              {sender?.avatar.startsWith('data:') ? (
                                                  <img src={sender?.avatar} className="w-full h-full object-cover"/>
                                              ) : (
                                                  <span className="text-xl">{sender?.avatar || '?'}</span>
                                              )}
                                          </div>
                                          <div>
                                              <span className="font-bold text-gray-800 text-sm block">{sender?.name || 'Alguien'}</span>
                                              <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                          </div>
                                      </div>
                                      <div className="bg-white p-3 rounded-xl text-gray-700 font-bold shadow-sm text-sm">
                                          "{msg.content}"
                                      </div>
                                  </div>
                              )
                          })
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Active Event Modal */}
      {activeEvent && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className={`
                  bg-white rounded-3xl p-8 w-full max-w-sm text-center relative overflow-hidden shadow-2xl
                  ${activeEvent.style === 'golden' ? 'border-4 border-yellow-400 shadow-yellow-200' : ''}
              `}>
                  {/* Background effects */}
                  {activeEvent.style === 'golden' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-yellow-100 opacity-50 -z-10"></div>
                  )}
                  {activeEvent.style === 'sparkle' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-100 opacity-50 -z-10"></div>
                  )}

                  <div className="mb-6">
                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 ${activeEvent.style === 'golden' ? 'bg-yellow-100 text-yellow-600' : 'bg-brand-blue/10 text-brand-blue'}`}>
                          {activeEvent.style === 'sparkle' ? '✨' : activeEvent.style === 'golden' ? '🏆' : '📅'}
                      </div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">{activeEvent.title}</h2>
                      <div className="w-16 h-1 bg-brand-yellow mx-auto rounded-full mb-4"></div>
                      <p className="text-gray-600 font-medium text-lg leading-relaxed">
                          {activeEvent.description}
                      </p>
                      {activeEvent.points && (
                          <div className="mt-4 bg-brand-yellow/20 text-brand-dark px-4 py-2 rounded-xl font-bold inline-block">
                              🎁 +{activeEvent.points} puntos extra
                          </div>
                      )}
                  </div>

                  <button
                    onClick={handleCloseEvent}
                    className={`
                        w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95
                        ${activeEvent.style === 'golden' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'bg-brand-dark text-white'}
                    `}
                  >
                      ¡Entendido!
                  </button>
              </div>
          </div>
      )}

      {/* Profile/Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                        <Icons.Settings size={24} className="text-brand-blue"/> Tu Perfil
                    </h3>
                    {/* ENHANCED CLOSE BUTTON */}
                    <button onClick={() => { setShowProfileModal(false); setPinMessage(''); }} className="bg-red-100 text-red-500 p-2 rounded-full hover:bg-red-200 transition-colors">
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Avatar Section */}
                <div className="mb-8">
                    <h4 className="font-bold text-gray-600 mb-3 text-sm uppercase tracking-wider">Tu Personaje</h4>
                    
                    <button
                        onClick={() => { setShowAvatarEditor(true); setShowProfileModal(false); }}
                        className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl mb-4 flex items-center justify-center gap-2 hover:bg-purple-700 shadow-md"
                    >
                        👕 Personalizar Avatar
                    </button>

                    <h4 className="font-bold text-gray-600 mb-3 text-sm uppercase tracking-wider">O Usar Emoji / Foto</h4>
                    {/* File Upload Button with Trash */}
                    <div className="flex justify-center mb-4 gap-3">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-blue-600 transition-colors"
                        >
                            <Icons.Camera size={20} />
                            Subir Foto
                        </button>
                        {currentUser.avatar.startsWith('data:') && (
                            <button 
                                onClick={() => handleAvatarSelect('🧑')}
                                className="bg-gray-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-red-100 hover:text-red-500 transition-colors"
                                title="Eliminar foto"
                            >
                                <Icons.Trash2 size={20} />
                            </button>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                            accept="image/*"
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {AVATAR_OPTIONS.map(emoji => (
                            <button 
                                key={emoji}
                                onClick={() => handleAvatarSelect(emoji)}
                                className={`text-2xl p-2 rounded-xl hover:scale-110 transition-all shadow-sm ${currentUser.avatar === emoji ? 'bg-brand-yellow ring-2 ring-orange-300' : 'bg-gray-50'}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Password Section */}
                <div className="border-t pt-6">
                    <h4 className="font-bold text-gray-600 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Icons.KeyRound size={16} /> Cambiar Contraseña
                    </h4>
                    <form onSubmit={handleChangePin} className="space-y-3">
                        <input 
                            type="password"
                            inputMode="numeric"
                            placeholder="Nuevo PIN (mín 4 números)"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none"
                            maxLength={8}
                        />
                         <input 
                            type="password"
                            inputMode="numeric"
                            placeholder="Confirmar Nuevo PIN"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none"
                            maxLength={8}
                        />
                        {pinMessage && (
                            <p className={`text-center text-sm font-bold ${pinMessage.includes('éxito') ? 'text-green-500' : 'text-red-500'}`}>
                                {pinMessage}
                            </p>
                        )}
                        <button 
                            type="submit"
                            className="w-full bg-brand-dark text-white font-bold py-3 rounded-xl hover:bg-gray-800"
                        >
                            Actualizar PIN
                        </button>
                    </form>
                </div>
                
                {/* BIG CLOSE BUTTON AT BOTTOM */}
                <button 
                    onClick={() => { setShowProfileModal(false); setPinMessage(''); }} 
                    className="w-full bg-gray-100 text-gray-500 font-bold py-3 rounded-xl mt-6 hover:bg-gray-200 transition-colors"
                >
                    Cerrar
                </button>
            </div>
        </div>
      )}

      {showAvatarEditor && (
          <AvatarEditor
            user={currentUser}
            onClose={() => setShowAvatarEditor(false)}
            onUpdate={handleAvatarUpdate}
          />
      )}
    </div>
  );
};

export default KidDashboard;