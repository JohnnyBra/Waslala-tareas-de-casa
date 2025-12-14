import React, { useState } from 'react';
import { User } from '../types';
import { DataService } from '../services/dataService';
import { Icons } from './Icon';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // We read this once on render. Because DataService.init() runs in index.tsx, 
  // this should be populated.
  const users = DataService.getUsers();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setError('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && pin === selectedUser.pin) {
      onLogin(selectedUser);
    } else {
      setError('Contraseña incorrecta');
      setPin('');
    }
  };

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up">
          <button 
            onClick={() => setSelectedUser(null)}
            className="mb-4 text-gray-500 hover:text-gray-800 flex items-center gap-2 font-bold"
          >
            <Icons.ArrowLeft size={20} /> Volver
          </button>
          
          <div className="text-center mb-6">
            <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 ${selectedUser.color} shadow-lg ring-4 ring-white overflow-hidden`}>
              {selectedUser.avatar.startsWith('data:') ? (
                  <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
              ) : (
                  selectedUser.avatar
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Hola, {selectedUser.name}</h2>
            <p className="text-gray-500">Introduce tu clave secreta</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-3xl tracking-widest p-4 border-2 border-gray-200 rounded-2xl focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="****"
              autoFocus
            />
            {error && <p className="text-red-500 text-center font-bold">{error}</p>}
            
            <button
              type="submit"
              className="w-full bg-brand-green text-white font-bold py-4 rounded-2xl text-xl shadow-lg hover:bg-green-500 transform active:scale-95 transition-all"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-4xl font-extrabold text-brand-dark mb-2 tracking-tight">SuperTareas</h1>
        <p className="text-brand-blue text-lg">¡La familia unida jamás será vencida!</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-gray-500 mb-4">Cargando familia...</p>
            <button 
                onClick={() => window.location.reload()}
                className="bg-brand-blue text-white px-4 py-2 rounded-lg font-bold"
            >
                Recargar
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full animate-fade-in-up">
            {users.map(user => (
            <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="flex flex-col items-center group"
            >
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center text-4xl md:text-5xl shadow-xl transition-transform transform group-hover:scale-110 group-hover:rotate-3 ${user.color} overflow-hidden`}>
                    {user.avatar.startsWith('data:') ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        user.avatar
                    )}
                </div>
                <span className="mt-3 font-bold text-gray-700 text-lg group-hover:text-brand-blue">{user.name}</span>
            </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default Login;