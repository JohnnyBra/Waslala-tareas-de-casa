import React, { useState, useEffect, useRef } from 'react';
import { User, Task, Role } from '../types';
import { DataService, getTodayString } from '../services/dataService';
import { Icons } from './Icon';

interface Props {
    currentUser: User;
    onUserUpdate: (user: User) => void;
}

const AVATAR_OPTIONS = ['👨🏻', '👩🏻', '👴', '👵', '🧑', '👧', '👦', '👶', '🐶', '🐱'];
const TASK_ICONS = ['🧹', '🛏️', '🧸', '📚', '🍽️', '🚿', '🦷', '👗', '🗑️', '🪴', '🐕', '🐈', '👕', '🧺', '🧽', '🚶', '🎒', '🧩', '🎨', '🎷'];

const ParentDashboard: React.FC<Props> = ({ currentUser, onUserUpdate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [completions, setCompletions] = useState(DataService.getCompletions());
  const [extraPoints, setExtraPoints] = useState(DataService.getExtraPoints());
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showPointsModal, setShowPointsModal] = useState<string | null>(null); // userId or null
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [view, setView] = useState<'status' | 'manage'>('status');

  // PIN Change State
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kids = users.filter(u => u.role === Role.KID);
  const today = getTodayString();

  // Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(10);
  const [newTaskIcon, setNewTaskIcon] = useState('🧹');
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<number[]>([0,1,2,3,4,5,6]);

  // Points Form State
  const [pointsAmount, setPointsAmount] = useState(10);
  const [pointsReason, setPointsReason] = useState('');

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = () => {
    setTasks(DataService.getTasks());
    setUsers(DataService.getUsers());
    setCompletions(DataService.getCompletions());
    setExtraPoints(DataService.getExtraPoints());
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || newTaskAssignees.length === 0) return;

    const taskToSave: Task = {
        id: editingTaskId || Date.now().toString(),
        title: newTaskTitle,
        points: Number(newTaskPoints),
        icon: newTaskIcon,
        assignedTo: newTaskAssignees,
        recurrence: newTaskRecurrence
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
          DataService.removeCompletion(taskId, userId, today);
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

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Resize image
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxSize = 150;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    const base64 = canvas.toDataURL('image/jpeg', 0.8);
                    onUserUpdate({ ...currentUser, avatar: base64 }); 
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };


  const resetForm = () => {
      setEditingTaskId(null);
      setNewTaskTitle('');
      setNewTaskPoints(10);
      setNewTaskAssignees([]);
      setNewTaskRecurrence([0,1,2,3,4,5,6]);
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

  // 0=Sunday, 1=Monday... but we want to display starting from Monday
  const dayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const displayDays = [1, 2, 3, 4, 5, 6, 0]; // Indices in order: Mon, Tue... Sun

  const renderStatus = () => (
    <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Estado de Hoy ({today})</h2>
        <div className="grid gap-4 md:grid-cols-2">
            {kids.map(kid => {
                const kidTasks = tasks.filter(t => t.assignedTo.includes(kid.id) && t.recurrence.includes(new Date().getDay()));
                const completedCount = completions.filter(c => c.userId === kid.id && c.date === today).length;
                const progress = kidTasks.length > 0 ? (completedCount / kidTasks.length) * 100 : 0;
                
                // Calculate total current points for display
                const stats = DataService.getUserStats(kid.id);

                return (
                    <div key={kid.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 border overflow-hidden`}>
                                     {kid.avatar.startsWith('data:') ? (
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
                            <button 
                                onClick={() => setShowPointsModal(kid.id)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                            >
                                <Icons.Plus size={12} /> Ajustar Puntos
                            </button>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
                            <div className="h-full bg-brand-green transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        
                        <div className="space-y-2">
                            {kidTasks.map(t => {
                                const isDone = completions.some(c => c.taskId === t.id && c.userId === kid.id && c.date === today);
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
                            {kidTasks.length === 0 && <span className="text-xs text-gray-400 italic">Sin tareas hoy</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );

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
            <div className="flex gap-2 mb-6 bg-gray-200 p-1 rounded-xl">
                <button 
                    onClick={() => setView('status')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm ${view === 'status' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}
                >
                    Resumen Diario
                </button>
                <button 
                    onClick={() => setView('manage')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm ${view === 'manage' ? 'bg-white shadow-sm text-brand-dark' : 'text-gray-500'}`}
                >
                    Editar Tareas
                </button>
            </div>

            {view === 'status' ? renderStatus() : renderManage()}
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
                                        {kid.avatar.startsWith('data:') ? (
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