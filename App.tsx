import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import KidDashboard from './components/KidDashboard';
import ParentDashboard from './components/ParentDashboard';
import { Icons } from './components/Icon';
import { DataService } from './services/dataService';
import { FamilyProvider, useFamily } from './components/FamilyContext';
import { LoginScreen } from './components/LoginScreen';

const AppContent: React.FC = () => {
  const { currentFamily, isLoading: familyLoading, logoutFamily } = useFamily();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Local state for user selection inside family
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');

  useEffect(() => {
    const initData = async () => {
        await DataService.init();
        setLoading(false);
    };
    initData();
  }, []);

  // Sync users when family changes
  useEffect(() => {
    if (currentFamily) {
        const familyUsers = DataService.getFamilyUsers(currentFamily.id);
        setUsers(familyUsers);
    } else {
        setUsers([]);
        setCurrentUser(null);
    }
  }, [currentFamily]);

  // Check session
  useEffect(() => {
      if (currentFamily && !currentUser) {
          const storedUser = sessionStorage.getItem('st_session_user');
          if (storedUser) {
              const user = JSON.parse(storedUser);
              if (user.familyId === currentFamily.id) {
                  setCurrentUser(user);
              } else {
                  sessionStorage.removeItem('st_session_user');
              }
          }
      }
  }, [currentFamily, currentUser]);


  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('st_session_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('st_session_user');
  };

  const handleUserUpdate = (updatedUser: User) => {
    DataService.updateUser(updatedUser);
    setCurrentUser(updatedUser);
    sessionStorage.setItem('st_session_user', JSON.stringify(updatedUser));
  };

  // User Selection Logic
  const handleUserSelect = (user: User) => {
    if (user.role === Role.KID && user.pin === '0000') {
        handleLogin(user);
    } else {
        setSelectedUser(user);
        setPin('');
    }
  };

  const verifyPin = () => {
      if (selectedUser && selectedUser.pin === pin) {
          handleLogin(selectedUser);
          setSelectedUser(null);
          setPin('');
      } else {
          alert("PIN Incorrecto");
          setPin('');
      }
  };


  if (loading || familyLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
          </div>
      );
  }

  // 1. Family Login Screen
  if (!currentFamily) {
      return <LoginScreen />;
  }

  // 2. User Selection Screen
  if (!currentUser) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-4xl w-full relative overflow-hidden">
                <button
                    onClick={logoutFamily}
                    className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 z-10"
                >
                    <Icons.ArrowLeft size={16} />
                    Cambiar Familia
                </button>

                <div className="text-center mb-10 relative z-10">
                    <h1 className="text-4xl font-black text-brand-blue mb-2">{currentFamily.name}</h1>
                    <p className="text-gray-400 font-medium">¿Quién va a entrar?</p>
                </div>

                {!selectedUser ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
                                className="flex flex-col items-center p-6 rounded-2xl hover:bg-gray-50 transition-all group border-2 border-transparent hover:border-gray-100"
                            >
                                <div className={`w-24 h-24 rounded-full ${user.color} flex items-center justify-center text-4xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    {user.avatar}
                                </div>
                                <span className="text-xl font-bold text-gray-700 group-hover:text-brand-blue">{user.name}</span>
                            </button>
                        ))}
                        {users.length === 0 && (
                            <p className="col-span-full text-center text-gray-400">No hay usuarios en esta familia.</p>
                        )}
                    </div>
                ) : (
                    <div className="max-w-xs mx-auto relative z-10 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className={`w-24 h-24 rounded-full ${selectedUser.color} mx-auto flex items-center justify-center text-4xl mb-4 shadow-lg`}>
                                {selectedUser.avatar}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Hola {selectedUser.name}</h2>
                            <p className="text-gray-400 text-sm">Introduce tu PIN secreto</p>
                        </div>

                        <div className="flex justify-center mb-6">
                            <input
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full text-center text-4xl tracking-[0.5em] font-bold text-gray-700 border-b-2 border-gray-200 focus:border-brand-blue focus:outline-none py-2 bg-transparent"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setSelectedUser(null); setPin(''); }}
                                className="flex-1 py-3 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={verifyPin}
                                className="flex-1 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all transform hover:scale-105"
                            >
                                Entrar
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
      );
  }

  // 3. Authenticated Dashboard
  return (
    <div className="relative">
        {currentUser.role === Role.ADMIN ? (
            <ParentDashboard currentUser={currentUser} onUserUpdate={handleUserUpdate} />
        ) : (
            <KidDashboard currentUser={currentUser} onUserUpdate={handleUserUpdate} />
        )}
        
        {/* Floating Logout Button */}
        <button 
            onClick={handleLogout}
            className="fixed bottom-6 right-6 bg-white text-red-500 p-3 rounded-full shadow-lg border border-red-100 z-50 hover:bg-red-50 transition-colors"
            title="Cerrar Sesión"
        >
            <Icons.LogOut size={24} />
        </button>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <FamilyProvider>
            <AppContent />
        </FamilyProvider>
    );
}

export default App;
