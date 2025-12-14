import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import Login from './components/Login';
import KidDashboard from './components/KidDashboard';
import ParentDashboard from './components/ParentDashboard';
import { Icons } from './components/Icon';
import { DataService } from './services/dataService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check session logic
    const storedUser = sessionStorage.getItem('st_session_user');
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

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

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

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

export default App;