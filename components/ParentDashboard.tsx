import React, { useState, useEffect, useRef } from 'react';
import { User, Task, Role, Event as AppEvent, Reward, ShopTransaction } from '../types';
import { DataService, getTodayString } from '../services/dataService';
import { Icons } from './Icon';

interface Props {
    currentUser: User;
    onUserUpdate: (user: User) => void;
}

const AVATAR_OPTIONS = ['👨🏻', '👩🏻', '👴', '👵', '🧑', '👧', '👦', '👶', '🐶', '🐱'];
const TASK_ICONS = ['🧹', '🛏️', '🧸', '📚', '🍽️', '🚿', '🦷', '👗', '🗑️', '🪴', '🐕', '🐈', '👕', '🧺', '🧽', '🚶', '🎒', '🧩', '🎨', '🎷'];

// Date Helpers
const addDays = (dateStr: string, days: number): string => {
    // Append time to ensure local date parsing if needed, but simple YYYY-MM-DD usually parses as UTC.
    // However, since we want to manipulate "calendar days", we can split and use constructor.
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    // Return YYYY-MM-DD
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    const newD = String(date.getDate()).padStart(2, '0');
    return `${newY}-${newM}-${newD}`;
};

const formatDate = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Start of week (Monday)
const getStartOfWeek = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = date.getDate() - (day === 0 ? 6 : day - 1);
    date.setDate(diff);

    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    const newD = String(date.getDate()).padStart(2, '0');
    return `${newY}-${newM}-${newD}`;
};

const ParentDashboard: React.FC<Props> = ({ currentUser, onUserUpdate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [completions, setCompletions] = useState(DataService.getCompletions());
  const [extraPoints, setExtraPoints] = useState(DataService.getExtraPoints());
  const [rewards, setRewards] = useState<Reward[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showPointsModal, setShowPointsModal] = useState<string | null>(null); // userId or null
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [view, setView] = useState<'status' | 'weekly' | 'manage' | 'events' | 'store'>('status');

  // Date State
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  // Message State
  const [showMessageModal, setShowMessageModal] = useState<string | null>(null); // userId
  const [messageContent, setMessageContent] = useState('');

  // PIN Change State
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kids = users.filter(u => u.role === Role.KID);

  // Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(10);
  const [newTaskIcon, setNewTaskIcon] = useState('🧹');
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<number[]>([0,1,2,3,4,5,6]);
  const [newTaskIsUnique, setNewTaskIsUnique] = useState(false);

  // Events Form State
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState(getTodayString());
  const [newEventStyle, setNewEventStyle] = useState<'default' | 'golden' | 'sparkle'>('default');
  const [newEventPoints, setNewEventPoints] = useState(0);
  const [newEventAssignees, setNewEventAssignees] = useState<string[]>([]);

  // Rewards Form State
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(50);
  const [newRewardIcon, setNewRewardIcon] = useState('🎁');
  const [newRewardLimitType, setNewRewardLimitType] = useState<'unlimited' | 'once_per_user' | 'unique'>('unlimited');

  // Points Form State
  const [pointsAmount, setPointsAmount] = useState(10);
  const [pointsReason, setPointsReason] = useState('');

  useEffect(() => {
    loadData();
  }, [view, selectedDate, currentUser.familyId]);

  const loadData = () => {
    setTasks(DataService.getFamilyTasks(currentUser.familyId));
    setUsers(DataService.getFamilyUsers(currentUser.familyId));
    setCompletions(DataService.getCompletions());
    setExtraPoints(DataService.getExtraPoints());
    setRewards(DataService.getFamilyRewards(currentUser.familyId));

    // Let's filter events by assignedTo users who are in the family, or we should add familyId to Events.
    // For now, filtering events by checking if assigned users belong to family.
    const familyUserIds = DataService.getFamilyUsers(currentUser.familyId).map(u => u.id);
    const allEvents = DataService.getEvents();
    // Simple heuristic: If an event is assigned to at least one user in the family, show it.
    const familyEvents = allEvents.filter(e => e.assignedTo.some(uid => familyUserIds.includes(uid)));
    setEvents(familyEvents);
  };

  const changeDate = (days: number) => {
      const jump = view === 'weekly' ? days * 7 : days;
      setSelectedDate(prev => addDays(prev, jump));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || newTaskAssignees.length === 0) return;

    const taskToSave: Task = {
        id: editingTaskId || Date.now().toString(),
        familyId: currentUser.familyId,
        title: newTaskTitle,
        points: Number(newTaskPoints),
        icon: newTaskIcon,
        assignedTo: newTaskAssignees,
        recurrence: newTaskRecurrence,
        isUnique: newTaskIsUnique
    };

    DataService.saveTask(taskToSave);
    setShowAddModal(false);
    resetForm();
    loadData();
  };

  const handleEditClick = (task: Task) => {
      setEditingTaskId(task.id);
      setNewTaskTitle(task.title);
      setNewTaskPoints(task.points);
      setNewTaskIcon(task.icon);
      setNewTaskAssignees(task.assignedTo);
      setNewTaskRecurrence(task.recurrence);
      setNewTaskIsUnique(task.isUnique || false);
      setShowAddModal(true);
  };

  const handleDeleteTask = (id: string) => {
      if(confirm('¿Seguro que quieres borrar esta tarea?')) {
          DataService.deleteTask(id);
          loadData();
      }
  }

  const handleUndoTask = (taskId: string, userId: string) => {
      if(confirm('¿Marcar tarea como no realizada? Se restarán los puntos.')) {
          DataService.removeCompletion(taskId, userId, selectedDate);
          loadData();
      }
  };

  const handleAddExtraPoints = (e: React.FormEvent) => {
      e.preventDefault();
      if(showPointsModal) {
          DataService.addExtraPoints(showPointsModal, Number(pointsAmount), pointsReason);
          setShowPointsModal(null);
          setPointsAmount(10);
          setPointsReason('');
          loadData();
      }
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if(showMessageModal && messageContent.trim()) {
          DataService.sendMessage(currentUser.id, showMessageModal, messageContent);
          setShowMessageModal(null);
          setMessageContent('');
          alert('Mensaje enviado');
      }
  };

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
    
    onUserUpdate({ ...currentUser, pin: newPin });
    
    setPinMessage('¡Contraseña cambiada con éxito!');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => {
        setPinMessage('');
        // Don't auto close here, let user close
    }, 1500);
  };

  // --- Parent Avatar Logic ---
    const handleAvatarSelect = (newAvatar: string) => {
        onUserUpdate({ ...currentUser, avatar: newAvatar });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const imageUrl = await DataService.uploadImage(file);
                onUserUpdate({ ...currentUser, avatar: imageUrl });
            } catch (error) {
                alert('Error al subir la imagen');
                console.error(error);
            }
        }
    };


  const resetForm = () => {
      setEditingTaskId(null);
      setNewTaskTitle('');
      setNewTaskPoints(10);
      setNewTaskAssignees([]);
      setNewTaskRecurrence([0,1,2,3,4,5,6]);
      setNewTaskIsUnique(false);
  };

  const resetEventForm = () => {
      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventDate(getTodayString());
      setNewEventStyle('default');
      setNewEventPoints(0);
      setNewEventAssignees([]);
  }

  const resetRewardForm = () => {
      setNewRewardName('');
      setNewRewardCost(50);
      setNewRewardIcon('🎁');
      setNewRewardLimitType('unlimited');
  }

  const handleCreateReward = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRewardName) return;

      const reward: Reward = {
          id: Date.now().toString(),
          familyId: currentUser.familyId,
          name: newRewardName,
          cost: Number(newRewardCost),
          icon: newRewardIcon,
          limitType: newRewardLimitType
      };

      DataService.saveReward(reward);
      setShowRewardModal(false);
      resetRewardForm();
      loadData();
  };

  const handleDeleteReward = (id: string) => {
      if(confirm('¿Borrar este premio?')) {
          DataService.deleteReward(id);
          loadData();
      }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEventTitle || newEventAssignees.length === 0) return;

      const event: AppEvent = {
          id: Date.now().toString(),
          title: newEventTitle,
          description: newEventDescription,
          date: newEventDate,
          type: 'popup',
          style: newEventStyle,
          assignedTo: newEventAssignees,
          readBy: [],
          completedBy: [],
          points: newEventPoints > 0 ? newEventPoints : undefined
      };

      DataService.saveEvent(event);
      setShowEventModal(false);
      resetEventForm();
      loadData();
  };

  const toggleAssignee = (id: string) => {
      setNewTaskAssignees(prev => 
          prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
      );
  };

  const toggleRecurrence = (day: number) => {
      setNewTaskRecurrence(prev => 
        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
      );
  };

  const toggleEventAssignee = (id: string) => {
      setNewEventAssignees(prev =>
          prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
      );
  };

  // 0=Sunday, 1=Monday... but we want to display starting from Monday
  const dayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const displayDays = [1, 2, 3, 4, 5, 6, 0]; // Indices in order: Mon, Tue... Sun

  // Date Controls Component
  const DateControls = () => (
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => changeDate(-1)} className="p-1 hover:bg-white rounded"><Icons.ChevronLeft size={20}/></button>
          <span className="font-bold px-2 text-sm md:text-base min-w-[120px] text-center capitalize">{formatDate(selectedDate)}</span>
          <button onClick={() => changeDate(1)} className="p-1 hover:bg-white rounded"><Icons.ChevronRight size={20}/></button>
          <button onClick={() => setSelectedDate(getTodayString())} className="text-xs bg-white px-2 py-1 rounded ml-1 text-gray-500 font-bold">Hoy</button>
      </div>
  );

  const renderStatus = () => (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800">Resumen Diario</h2>
            <DateControls />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            {kids.map(kid => {
                // Determine day of week for selectedDate
                const [y, m, d] = selectedDate.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                const dayOfWeek = dateObj.getDay();

                const kidTasks = tasks.filter(t => t.assignedTo.includes(kid.id) && t.recurrence.includes(dayOfWeek));
                const completedCount = completions.filter(c => c.userId === kid.id && c.date === selectedDate).length;
                const progress = kidTasks.length > 0 ? (completedCount / kidTasks.length) * 100 : 0;
                
                // Calculate total current points for display
                const stats = DataService.getUserStats(kid.id);

                return (
                    <div key={kid.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 border overflow-hidden`}>
                                     {kid.avatar.startsWith('data:') || kid.avatar.startsWith('/uploads/') ? (
                                        <img src={kid.avatar} className="w-full h-full object-cover"/>
                                     ) : (
                                         <span className="text-lg">{kid.avatar}</span>
                                     )}
                                </div>
                                <div>
                                    <span className="font-bold block leading-none">{kid.name}</span>
                                    <span className="text-xs text-brand-blue font-bold">{stats.points} pts totales</span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setShowMessageModal(kid.id)}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg"
                                    title="Enviar Mensaje"
                                >
                                    <Icons.MessageCircle size={16} />
                                </button>
                                <button
                                    onClick={() => setShowPointsModal(kid.id)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                                >
                                    <Icons.Plus size={12} /> Ajustar Puntos
                                </button>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
                            <div className="h-full bg-brand-green transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        
                        <div className="space-y-2">
                            {kidTasks.map(t => {
                                const isDone = completions.some(c => c.taskId === t.id && c.userId === kid.id && c.date === selectedDate);
                                return (
                                    <div key={t.id} className="flex items-center justify-between text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            {isDone 
                                                ? <Icons.Check className="w-4 h-4 text-green-500" /> 
                                                : <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                                            }
                                            <span className={isDone ? 'line-through opacity-50' : ''}>{t.title}</span>
                                        </div>
                                        {isDone && (
                                            <button 
                                                onClick={() => handleUndoTask(t.id, kid.id)}
                                                className="text-red-300 hover:text-red-500"
                                                title="Deshacer"
                                            >
                                                <Icons.X size={16} />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                            {kidTasks.length === 0 && <span className="text-xs text-gray-400 italic">Sin tareas este día</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );

  const renderWeekly = () => {
      const startOfWeek = getStartOfWeek(selectedDate);
      const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
      const endOfWeek = weekDates[6];

      return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-gray-800">Resumen Semanal</h2>
                <DateControls />
            </div>
            <div className="text-sm text-gray-500 mb-4 text-center md:text-left">
                Semana del {formatDate(startOfWeek)} al {formatDate(endOfWeek)}
            </div>

            <div className="grid gap-4">
                {kids.map(kid => {
                    // Weekly stats calculation
                    let weeklyPoints = 0;
                    let weeklyTasksCompleted = 0;

                    const weekCompletions = completions.filter(c =>
                        c.userId === kid.id &&
                        c.date >= startOfWeek &&
                        c.date <= endOfWeek
                    );

                    weekCompletions.forEach(c => {
                        const task = tasks.find(t => t.id === c.taskId);
                        if(task) weeklyPoints += task.points;
                    });
                    weeklyTasksCompleted = weekCompletions.length;

                    // Extra points in range
                    const weekExtras = extraPoints.filter(e => {
                        const d = new Date(e.timestamp).toISOString().split('T')[0];
                        return e.userId === kid.id && d >= startOfWeek && d <= endOfWeek;
                    });

                    weekExtras.forEach(e => weeklyPoints += e.points);

                    return (
                        <div key={kid.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                             <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gray-100 border overflow-hidden shrink-0`}>
                                     {kid.avatar.startsWith('data:') || kid.avatar.startsWith('/uploads/') ? (
                                        <img src={kid.avatar} className="w-full h-full object-cover"/>
                                     ) : (
                                         <span className="text-2xl">{kid.avatar}</span>
                                     )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-bold text-lg">{kid.name}</h3>
                                <div className="text-sm text-gray-500">Ha completado {weeklyTasksCompleted} tareas esta semana</div>
                            </div>
                            <div className="bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-xl font-bold text-xl min-w-[100px] text-center">
                                {weeklyPoints} pts
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => setShowMessageModal(kid.id)}
                                    className="flex-1 md:flex-none bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 flex items-center justify-center gap-2"
                                >
                                    <Icons.Send size={16} /> Motivar
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      );
  };

  const renderManage = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Gestionar Tareas</h2>
            <button 
                onClick={() => setShowAddModal(true)}
                className="bg-brand-blue text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-600"
            >
                <Icons.Plus size={20}/> Nueva Tarea
            </button>
          </div>

          <div className="space-y-3">
              {tasks.map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                          <div className="bg-gray-100 w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                              {task.icon}
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-800">{task.title}</h3>
                              <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-bold">{task.points} pts</span>
                                  <span className="flex items-center gap-1">
                                      <Icons.Users size={12}/> {task.assignedTo.length} niños
                                  </span>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => handleEditClick(task)} className="text-blue-400 hover:text-blue-600 p-2">
                              <Icons.Edit size={20} />
                          </button>
                          <button onClick={() => handleDeleteTask(task.id)} className="text-red-400 hover:text-red-600 p-2">
                              <Icons.Trash2 size={20} />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderStore = () => {
      // Calculate recent redemptions
      const familyTransactions = DataService.getFamilyTransactions(currentUser.familyId);
      const rewardIds = rewards.map(r => r.id);

      const redemptions = familyTransactions
        .filter(t => rewardIds.includes(t.itemId))
        .sort((a,b) => b.timestamp - a.timestamp)
        .slice(0, 10); // Last 10

      return (
          <div className="space-y-8">
               <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Premios Disponibles</h2>
                        <button
                            onClick={() => setShowRewardModal(true)}
                            className="bg-brand-pink text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-pink-600"
                        >
                            <Icons.Plus size={20}/> Nuevo Premio
                        </button>
                    </div>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                        {rewards.map(reward => (
                            <div key={reward.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border-2 border-transparent hover:border-brand-pink">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl w-14 h-14 bg-pink-50 rounded-lg flex items-center justify-center">
                                        {reward.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">{reward.name}</h3>
                                        <div className="flex gap-2">
                                            <div className="text-brand-pink font-bold bg-pink-100 inline-block px-2 py-0.5 rounded text-xs">
                                                {reward.cost} Puntos
                                            </div>
                                            {reward.limitType === 'unique' && (
                                                <div className="text-white font-bold bg-purple-500 inline-block px-2 py-0.5 rounded text-xs">
                                                    Único
                                                </div>
                                            )}
                                            {reward.limitType === 'once_per_user' && (
                                                <div className="text-white font-bold bg-blue-500 inline-block px-2 py-0.5 rounded text-xs">
                                                    1/Persona
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteReward(reward.id)} className="text-red-300 hover:text-red-500 p-2">
                                    <Icons.Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                         {rewards.length === 0 && (
                            <div className="col-span-full text-center py-10 text-gray-400 italic">
                                No hay premios creados. ¡Añade uno!
                            </div>
                        )}
                    </div>
               </div>

               {/* Redemption History */}
               <div className="bg-gray-100 p-4 rounded-2xl">
                   <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                       <Icons.ShoppingBag size={20} /> Historial de Compras (Últimas 10)
                   </h2>
                   <div className="space-y-2">
                       {redemptions.map(t => {
                           const user = users.find(u => u.id === t.userId);
                           const reward = rewards.find(r => r.id === t.itemId);
                           if (!user || !reward) return null;
                           return (
                               <div key={t.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                                   <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                            {user.avatar.startsWith('data:') ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.avatar}
                                       </div>
                                       <div>
                                           <div className="font-bold text-sm">{user.name} compró <span className="text-brand-pink">{reward.name}</span></div>
                                           <div className="text-xs text-gray-400">{new Date(t.timestamp).toLocaleString()}</div>
                                       </div>
                                   </div>
                                   <div className="font-bold text-gray-500">-{t.cost}</div>
                               </div>
                           )
                       })}
                       {redemptions.length === 0 && (
                           <div className="text-center text-gray-400 text-sm py-4">Aún nadie ha comprado nada.</div>
                       )}
                   </div>
               </div>
          </div>
      )
  };

  const renderEvents = () => (
      <div className="space-y-4">
           <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Gestionar Eventos</h2>
            <button
                onClick={() => setShowEventModal(true)}
                className="bg-brand-purple text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-purple-600 bg-purple-500"
            >
                <Icons.Plus size={20}/> Nuevo Evento
            </button>
          </div>

          <div className="grid gap-4">
              {events.map(event => (
                  <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-purple-50">
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-lg text-gray-800">{event.title}</span>
                                  {event.style === 'golden' && <span className="text-yellow-500 text-xs bg-yellow-100 px-2 py-0.5 rounded-full uppercase font-bold">Dorado</span>}
                                  {event.style === 'sparkle' && <span className="text-purple-500 text-xs bg-purple-100 px-2 py-0.5 rounded-full uppercase font-bold">Brillos</span>}
                              </div>
                              <p className="text-gray-500 text-sm mb-2">{event.description}</p>
                              <div className="flex gap-3 text-xs font-bold text-gray-400">
                                  <span className="flex items-center gap-1"><Icons.Calendar size={12}/> {formatDate(event.date)}</span>
                                  <span className="flex items-center gap-1"><Icons.Users size={12}/> {event.assignedTo.length} niños</span>
                                  <span className="flex items-center gap-1"><Icons.Check size={12}/> Visto por {event.readBy.length}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
              {events.length === 0 && (
                  <div className="text-center py-10 text-gray-400 italic">
                      No hay eventos creados
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
            <h1 className="text-center font-bold text-xl text-brand-dark flex-1">Panel de Padres</h1>
            <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-brand-dark"
            >
                <Icons.Settings size={20} />
            </button>
        </header>

        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex gap-2 mb-6 bg-gray-200 p-1 rounded-xl overflow-x-auto">
                <button 
                    onClick={() => setView('status')}
                    className={`flex-1 py-2 px-2 whitespace-nowrap rounded-lg font-bold text-sm ${view === 'status' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}
                >
                    Resumen Diario
                </button>
                <button
                    onClick={() => setView('weekly')}
                    className={`flex-1 py-2 px-2 whitespace-nowrap rounded-lg font-bold text-sm ${view === 'weekly' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}
                >
                    Resumen Semanal
                </button>
                <button 
                    onClick={() => setView('manage')}
                    className={`flex-1 py-2 px-2 whitespace-nowrap rounded-lg font-bold text-sm ${view === 'manage' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}
                >
                    Editar Tareas
                </button>
                <button
                    onClick={() => setView('events')}
                    className={`flex-1 py-2 px-2 whitespace-nowrap rounded-lg font-bold text-sm ${view === 'events' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}
                >
                    Eventos
                </button>
                <button
                    onClick={() => setView('store')}
                    className={`flex-1 py-2 px-2 whitespace-nowrap rounded-lg font-bold text-sm ${view === 'store' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}
                >
                    Tienda
                </button>
            </div>

            {view === 'status' && renderStatus()}
            {view === 'weekly' && renderWeekly()}
            {view === 'manage' && renderManage()}
            {view === 'events' && renderEvents()}
            {view === 'store' && renderStore()}
        </div>

        {/* Add Task Modal */}
        {showAddModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-4">{editingTaskId ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                            <input 
                                required
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none" 
                                placeholder="Ej: Lavar los platos"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Puntos</label>
                                <input 
                                    type="number"
                                    value={newTaskPoints}
                                    onChange={e => setNewTaskPoints(Number(e.target.value))}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Icono</label>
                                <div className="h-[52px] flex items-center justify-center border-2 border-gray-200 rounded-xl bg-gray-50 text-2xl">
                                    {newTaskIcon}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar Icono:</label>
                            <div className="grid grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl max-h-40 overflow-y-auto">
                                {TASK_ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setNewTaskIcon(icon)}
                                        className={`text-2xl p-2 rounded-lg transition-all ${
                                            newTaskIcon === icon
                                            ? 'bg-brand-blue text-white shadow-md transform scale-110'
                                            : 'bg-white hover:bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Asignar a:</label>
                            <div className="flex flex-wrap gap-2">
                                {kids.map(kid => (
                                    <button
                                        key={kid.id}
                                        type="button"
                                        onClick={() => toggleAssignee(kid.id)}
                                        className={`px-3 py-2 rounded-full text-sm font-bold border-2 transition-all flex items-center gap-2 ${
                                            newTaskAssignees.includes(kid.id) 
                                            ? `bg-brand-blue text-white border-brand-blue` 
                                            : 'bg-white text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        {kid.avatar.startsWith('data:') || kid.avatar.startsWith('/uploads/') ? (
                                            <img src={kid.avatar} className="w-5 h-5 rounded-full object-cover"/>
                                        ) : kid.avatar}
                                        {kid.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">Días:</label>
                             <div className="flex justify-between bg-gray-100 p-2 rounded-xl">
                                 {displayDays.map((dayIndex) => (
                                     <button
                                        key={dayIndex}
                                        type="button"
                                        onClick={() => toggleRecurrence(dayIndex)}
                                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                                            newTaskRecurrence.includes(dayIndex)
                                            ? 'bg-brand-green text-white shadow-md'
                                            : 'text-gray-400 hover:bg-gray-200'
                                        }`}
                                     >
                                         {dayLabels[dayIndex]}
                                     </button>
                                 ))}
                             </div>
                        </div>

                        {/* Unique Task Checkbox */}
                        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                             <label className="flex items-center gap-3 cursor-pointer">
                                 <input
                                    type="checkbox"
                                    checked={newTaskIsUnique}
                                    onChange={e => setNewTaskIsUnique(e.target.checked)}
                                    className="w-5 h-5 rounded text-brand-purple focus:ring-purple-500 border-gray-300"
                                 />
                                 <div>
                                     <span className="font-bold text-gray-700 block">Tarea Única</span>
                                     <span className="text-xs text-gray-500">Solo puede completarla UNA persona al día (el primero que la haga).</span>
                                 </div>
                             </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 py-3 rounded-xl font-bold bg-brand-blue text-white shadow-lg hover:bg-blue-600"
                            >
                                Guardar Tarea
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Create Event Modal */}
        {showEventModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
                     <h2 className="text-2xl font-bold mb-4">Nuevo Evento Especial</h2>
                     <form onSubmit={handleCreateEvent} className="space-y-4">
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                            <input
                                required
                                value={newEventTitle}
                                onChange={e => setNewEventTitle(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none"
                                placeholder="Ej: Noche de Pizza"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Mensaje / Descripción</label>
                            <textarea
                                required
                                value={newEventDescription}
                                onChange={e => setNewEventDescription(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none h-24"
                                placeholder="¡Hoy cenamos pizza por sacar buenas notas!"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    value={newEventDate}
                                    onChange={e => setNewEventDate(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none"
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Estilo</label>
                                <select
                                    value={newEventStyle}
                                    onChange={e => setNewEventStyle(e.target.value as any)}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none bg-white"
                                >
                                    <option value="default">Normal</option>
                                    <option value="golden">Dorado</option>
                                    <option value="sparkle">Brillos ✨</option>
                                </select>
                             </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Puntos de Regalo (Opcional)</label>
                            <input
                                type="number"
                                value={newEventPoints}
                                onChange={e => setNewEventPoints(Number(e.target.value))}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Para quién:</label>
                            <div className="flex flex-wrap gap-2">
                                {kids.map(kid => (
                                    <button
                                        key={kid.id}
                                        type="button"
                                        onClick={() => toggleEventAssignee(kid.id)}
                                        className={`px-3 py-2 rounded-full text-sm font-bold border-2 transition-all flex items-center gap-2 ${
                                            newEventAssignees.includes(kid.id)
                                            ? `bg-purple-500 text-white border-purple-500`
                                            : 'bg-white text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        {kid.avatar.startsWith('data:') || kid.avatar.startsWith('/uploads/') ? (
                                            <img src={kid.avatar} className="w-5 h-5 rounded-full object-cover"/>
                                        ) : kid.avatar}
                                        {kid.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowEventModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 rounded-xl font-bold bg-purple-500 text-white shadow-lg hover:bg-purple-600"
                            >
                                Crear Evento
                            </button>
                        </div>
                     </form>
                </div>
            </div>
        )}

        {/* Create Reward Modal */}
        {showRewardModal && (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-in-up">
                     <h2 className="text-2xl font-bold mb-4 text-brand-pink">Nuevo Premio</h2>
                     <form onSubmit={handleCreateReward} className="space-y-4">
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Premio</label>
                            <input
                                required
                                value={newRewardName}
                                onChange={e => setNewRewardName(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-pink outline-none"
                                placeholder="Ej: 1 Hora de TV"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Coste (Puntos)</label>
                            <input
                                type="number"
                                required
                                value={newRewardCost}
                                onChange={e => setNewRewardCost(Number(e.target.value))}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-pink outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Disponibilidad</label>
                            <select
                                value={newRewardLimitType}
                                onChange={e => setNewRewardLimitType(e.target.value as any)}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-pink outline-none bg-white"
                            >
                                <option value="unlimited">Ilimitado (Siempre disponible)</option>
                                <option value="once_per_user">Una vez por persona</option>
                                <option value="unique">Único (Solo uno para todos)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {newRewardLimitType === 'unlimited' && "Cualquiera puede comprarlo las veces que quiera."}
                                {newRewardLimitType === 'once_per_user' && "Cada niño puede comprarlo solo una vez."}
                                {newRewardLimitType === 'unique' && "¡El primero que lo compre se lo queda! Desaparece para los demás."}
                            </p>
                        </div>

                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar Icono:</label>
                            <div className="h-[52px] flex items-center justify-center border-2 border-gray-200 rounded-xl bg-gray-50 text-2xl mb-2">
                                {newRewardIcon}
                            </div>
                            <div className="grid grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl max-h-40 overflow-y-auto">
                                {['🎁', '📺', '🍦', '🎮', '🍕', '🍔', '🎡', '🧸', '🚲', '🍿', '🍩', '🍬', '🎨', '⚽', '📱', '💻', '💸', '⏰', '🛌', '🏖️'].map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setNewRewardIcon(icon)}
                                        className={`text-2xl p-2 rounded-lg transition-all ${
                                            newRewardIcon === icon
                                            ? 'bg-brand-pink text-white shadow-md transform scale-110'
                                            : 'bg-white hover:bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowRewardModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 rounded-xl font-bold bg-brand-pink text-white shadow-lg hover:bg-pink-600"
                            >
                                Crear Premio
                            </button>
                        </div>
                     </form>
                </div>
             </div>
        )}

        {/* Extra Points Modal */}
        {showPointsModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-in-up">
                     <h3 className="font-bold text-xl text-gray-800 mb-4">Ajustar Puntos</h3>
                     <form onSubmit={handleAddExtraPoints}>
                         <div className="mb-4">
                             <label className="block text-sm text-gray-500 mb-1">Cantidad (+ o -)</label>
                             <div className="flex items-center gap-2">
                                 <button type="button" onClick={() => setPointsAmount(p => p - 10)} className="bg-gray-200 w-10 h-10 rounded-lg font-bold">-10</button>
                                 <input 
                                    type="number"
                                    value={pointsAmount}
                                    onChange={e => setPointsAmount(Number(e.target.value))}
                                    className="flex-1 border-2 border-gray-200 rounded-xl p-2 text-center font-bold text-lg"
                                 />
                                 <button type="button" onClick={() => setPointsAmount(p => p + 10)} className="bg-gray-200 w-10 h-10 rounded-lg font-bold">+10</button>
                             </div>
                         </div>
                         <div className="mb-4">
                             <label className="block text-sm text-gray-500 mb-1">Motivo</label>
                             <input 
                                required
                                value={pointsReason}
                                onChange={e => setPointsReason(e.target.value)}
                                placeholder="Ej: Se portó muy bien"
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none"
                             />
                         </div>
                         <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setShowPointsModal(null)}
                                className="flex-1 bg-gray-100 text-gray-500 font-bold py-3 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 bg-brand-yellow text-brand-dark font-bold py-3 rounded-xl shadow-md"
                            >
                                Guardar
                            </button>
                         </div>
                     </form>
                </div>
            </div>
        )}

        {/* Message Modal */}
        {showMessageModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-in-up">
                     <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                         <Icons.MessageCircle className="text-brand-blue" />
                         Enviar Mensaje
                     </h3>
                     <form onSubmit={handleSendMessage}>
                         <div className="mb-4">
                             <label className="block text-sm text-gray-500 mb-2">Escribe algo bonito:</label>
                             <textarea
                                required
                                value={messageContent}
                                onChange={e => setMessageContent(e.target.value)}
                                placeholder="¡Muy bien hecho hoy! Estoy orgulloso de ti."
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-brand-blue outline-none h-32"
                             />
                         </div>

                         <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                             {['¡Felicidades! 🎉', '¡Buen trabajo! 💪', '¡Te quiero! ❤️', '¡Ánimo! 🚀'].map(text => (
                                 <button
                                    key={text}
                                    type="button"
                                    onClick={() => setMessageContent(text)}
                                    className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap hover:bg-gray-200"
                                 >
                                     {text}
                                 </button>
                             ))}
                         </div>

                         <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowMessageModal(null)}
                                className="flex-1 bg-gray-100 text-gray-500 font-bold py-3 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-brand-blue text-white font-bold py-3 rounded-xl shadow-md"
                            >
                                Enviar
                            </button>
                         </div>
                     </form>
                </div>
            </div>
        )}

         {/* Admin Settings Modal */}
         {showSettingsModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-in-up max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                            <Icons.Settings size={24} className="text-brand-dark"/> Configuración
                        </h3>
                        {/* ENHANCED CLOSE BUTTON */}
                        <button onClick={() => { setShowSettingsModal(false); setPinMessage(''); }} className="bg-red-100 text-red-500 p-2 rounded-full hover:bg-red-200 transition-colors">
                            <Icons.X size={24} />
                        </button>
                    </div>

                    {/* Avatar Section for Parents */}
                    <div className="mb-8">
                        <h4 className="font-bold text-gray-600 mb-3 text-sm uppercase tracking-wider">Cambiar Avatar</h4>
                        
                        <div className="flex justify-center mb-4 gap-3">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-blue-600 transition-colors"
                            >
                                <Icons.Camera size={20} />
                                Subir Foto
                            </button>
                            {(currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('/uploads/')) && (
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

                        <div className="grid grid-cols-5 gap-3">
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

                     <div className="pt-6 border-t">
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
                        onClick={() => { setShowSettingsModal(false); setPinMessage(''); }} 
                        className="w-full bg-gray-100 text-gray-500 font-bold py-3 rounded-xl mt-6 hover:bg-gray-200 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
         )}
    </div>
  );
};

export default ParentDashboard;