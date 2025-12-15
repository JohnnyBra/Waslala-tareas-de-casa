import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { Role } from '../types';
import { X, UserPlus, Save, Home } from 'lucide-react';

interface SystemAdminPanelProps {
    onClose: () => void;
}

export const SystemAdminPanel: React.FC<SystemAdminPanelProps> = ({ onClose }) => {
    const [newFamilyName, setNewFamilyName] = useState('');
    const [activeTab, setActiveTab] = useState<'families' | 'users'>('families');
    const [families, setFamilies] = useState(DataService.getFamilies());
    const [users, setUsers] = useState(DataService.getUsers());
    const [message, setMessage] = useState('');

    // User creation state
    const [newUserFamilyId, setNewUserFamilyId] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<Role>(Role.KID);
    const [newUserPin, setNewUserPin] = useState('0000');

    const handleCreateFamily = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFamilyName.trim()) return;

        DataService.addFamily(newFamilyName.trim());
        setFamilies(DataService.getFamilies());
        setNewFamilyName('');
        setMessage('Familia creada con éxito');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserFamilyId || !newUserName.trim()) {
            setMessage('Faltan datos');
            return;
        }

        DataService.createUser({
            id: 'u' + Date.now(),
            familyId: newUserFamilyId,
            name: newUserName.trim(),
            role: newUserRole,
            avatar: newUserRole === Role.ADMIN ? '👨' : '👶',
            color: 'bg-gray-400',
            pin: newUserPin
        });

        setUsers(DataService.getUsers());
        setNewUserName('');
        setNewUserPin('0000');
        setMessage('Usuario creado con éxito');
        setTimeout(() => setMessage(''), 3000);
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Panel de Administración del Sistema</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {message && (
                    <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center">
                        {message}
                    </div>
                )}

                <div className="flex border-b mb-6">
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'families' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('families')}
                    >
                        Familias
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Usuarios
                    </button>
                </div>

                {activeTab === 'families' && (
                    <div className="space-y-8">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h3 className="font-semibold text-lg mb-3 flex items-center">
                                <Home className="mr-2" size={20} />
                                Nueva Familia
                            </h3>
                            <form onSubmit={handleCreateFamily} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Nombre de la familia (ej: Gómez Pérez)"
                                    className="flex-1 p-2 border rounded-lg"
                                    value={newFamilyName}
                                    onChange={e => setNewFamilyName(e.target.value)}
                                />
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                                    <Save size={18} className="mr-2" />
                                    Crear
                                </button>
                            </form>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-600 mb-2">Familias Existentes</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {families.map(f => (
                                    <div key={f.id} className="p-4 border rounded-lg flex justify-between items-center bg-white shadow-sm">
                                        <span className="font-medium">{f.name}</span>
                                        <span className="text-xs text-gray-400 font-mono">{f.id}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-8">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h3 className="font-semibold text-lg mb-3 flex items-center">
                                <UserPlus className="mr-2" size={20} />
                                Nuevo Usuario
                            </h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <select
                                        className="p-2 border rounded-lg"
                                        value={newUserFamilyId}
                                        onChange={e => setNewUserFamilyId(e.target.value)}
                                    >
                                        <option value="">Selecciona Familia...</option>
                                        {families.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>

                                    <select
                                        className="p-2 border rounded-lg"
                                        value={newUserRole}
                                        onChange={e => setNewUserRole(e.target.value as Role)}
                                    >
                                        <option value={Role.KID}>Niño/a</option>
                                        <option value={Role.ADMIN}>Padre/Madre/Admin</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Nombre"
                                        className="p-2 border rounded-lg"
                                        value={newUserName}
                                        onChange={e => setNewUserName(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="PIN (4 dígitos)"
                                        maxLength={4}
                                        className="p-2 border rounded-lg"
                                        value={newUserPin}
                                        onChange={e => setNewUserPin(e.target.value)}
                                    />
                                </div>

                                <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center">
                                    <Save size={18} className="mr-2" />
                                    Añadir Usuario
                                </button>
                            </form>
                        </div>

                        <div>
                             <h3 className="font-semibold text-gray-600 mb-2">Usuarios Existentes (Todos)</h3>
                             <div className="max-h-64 overflow-y-auto border rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="p-2">Nombre</th>
                                            <th className="p-2">Rol</th>
                                            <th className="p-2">Familia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => {
                                            const familyName = families.find(f => f.id === u.familyId)?.name || 'Sin Familia';
                                            return (
                                                <tr key={u.id} className="border-t hover:bg-gray-50">
                                                    <td className="p-2">{u.name}</td>
                                                    <td className="p-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-gray-500">{familyName}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
