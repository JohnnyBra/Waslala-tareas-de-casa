import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Family, Role } from '../types';
import { useFamily } from './FamilyContext';
import { Settings, UserPlus, LogIn, Users } from 'lucide-react';
import { SystemAdminPanel } from './SystemAdminPanel';

export const LoginScreen: React.FC = () => {
  const { selectFamily } = useFamily();
  const [families, setFamilies] = useState<Family[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);

  useEffect(() => {
    // Refresh families
    setFamilies(DataService.getFamilies());
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
      e.preventDefault();
      // Hardcoded system admin pin for simplicity, or check against a special user?
      // Let's use a simple "admin" password for the "System Admin" role.
      if (adminPin === 'admin123') {
          setIsAuthenticatedAdmin(true);
      } else {
          alert('PIN Incorrecto');
      }
  };

  if (isAuthenticatedAdmin) {
      return (
          <SystemAdminPanel
            onClose={() => {
                setIsAuthenticatedAdmin(false);
                setFamilies(DataService.getFamilies()); // Refresh on close
            }}
          />
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Users size={40} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">SuperTareas</h1>
          <p className="text-gray-500 mt-2">Selecciona tu familia para entrar</p>
        </div>

        <div className="space-y-4">
          {families.map((family) => (
            <button
              key={family.id}
              onClick={() => selectFamily(family.id)}
              className="w-full bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all p-4 rounded-xl flex items-center justify-between group"
            >
              <span className="font-semibold text-lg text-gray-700 group-hover:text-blue-600">
                {family.name}
              </span>
              <LogIn className="text-gray-400 group-hover:text-blue-500" />
            </button>
          ))}

          {families.length === 0 && (
              <p className="text-center text-gray-400 italic">No hay familias registradas.</p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
            {!showAdmin ? (
                <button
                    onClick={() => setShowAdmin(true)}
                    className="flex items-center justify-center w-full text-gray-400 hover:text-gray-600 text-sm"
                >
                    <Settings size={16} className="mr-2" />
                    Administrar Sistema
                </button>
            ) : (
                <form onSubmit={handleAdminLogin} className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">PIN de Administrador</label>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={adminPin}
                            onChange={(e) => setAdminPin(e.target.value)}
                            className="flex-1 border rounded-lg px-3 py-2 text-center tracking-widest"
                            placeholder="PIN"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                            Entrar
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAdmin(false)}
                        className="text-xs text-gray-400 mt-2 w-full text-center hover:text-gray-600"
                    >
                        Cancelar
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};
