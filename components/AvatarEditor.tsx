import React, { useState, useEffect } from 'react';
import { User, AvatarConfig, AvatarItem } from '../types';
import { AVATAR_ITEMS } from '../constants/avatarItems';
import { DataService } from '../services/dataService';
import Avatar from './Avatar';
import { AvatarAssets } from './AvatarAssets';
import { ArrowLeft, ShoppingBag, Check } from 'lucide-react';

interface AvatarEditorProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void; // Trigger refresh of parent state
}

const TABS = [
  { id: 'base', label: 'Personaje' },
  { id: 'top', label: 'Ropa Superior' },
  { id: 'bottom', label: 'Ropa Inferior' },
  { id: 'shoes', label: 'Zapatos' },
  { id: 'accessory', label: 'Accesorios' },
];

const AvatarEditor: React.FC<AvatarEditorProps> = ({ user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('base');
  const [currentConfig, setCurrentConfig] = useState<AvatarConfig>(user.avatarConfig || {});
  const [ownedItems, setOwnedItems] = useState<string[]>(user.inventory || []);
  const [spendablePoints, setSpendablePoints] = useState(0);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    // Refresh stats to get accurate spendable points
    const stats = DataService.getUserStats(user.id);
    setSpendablePoints(stats.spendablePoints);

    // Ensure basic items are owned (cost 0 items)
    const freeItems = AVATAR_ITEMS.filter(i => i.cost === 0).map(i => i.id);
    const initialInventory = user.inventory || [];
    const missingFreeItems = freeItems.filter(id => !initialInventory.includes(id));

    if (missingFreeItems.length > 0) {
        // Technically we should save this, but for now just treat them as owned in UI
        setOwnedItems([...initialInventory, ...missingFreeItems]);
    }
  }, [user]);

  const handleEquip = (item: AvatarItem) => {
    const newConfig = { ...currentConfig };

    switch (item.type) {
        case 'base': newConfig.baseId = item.id; break;
        case 'top': newConfig.topId = item.id; break;
        case 'bottom': newConfig.bottomId = item.id; break;
        case 'shoes': newConfig.shoesId = item.id; break;
        case 'accessory':
            // Toggle accessory if already equipped
            if (newConfig.accessoryId === item.id) newConfig.accessoryId = undefined;
            else newConfig.accessoryId = item.id;
            break;
    }

    setCurrentConfig(newConfig);
    // Auto-save on equip? Or require "Save"? Let's auto-save for smoother UX
    DataService.updateAvatarConfig(user.id, newConfig);
    onUpdate();
  };

  const handleBuy = (item: AvatarItem) => {
    if (spendablePoints >= item.cost) {
        const success = DataService.purchaseItem(user.id, item.id, item.cost);
        if (success) {
            setOwnedItems([...ownedItems, item.id]);
            setSpendablePoints(prev => prev - item.cost);
            setMessage({ text: `¡Comprado: ${item.name}!`, type: 'success' });

            // Auto equip after buy?
            handleEquip(item);
        } else {
            setMessage({ text: 'Error en la compra', type: 'error' });
        }
    } else {
        setMessage({ text: 'No tienes suficientes puntos', type: 'error' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const filteredItems = AVATAR_ITEMS.filter(item => item.type === activeTab);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold font-nunito text-purple-600">Personalizar Avatar</h2>
        <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full">
            <span className="text-yellow-600 font-bold">💎 {spendablePoints}</span>
        </div>
      </div>

      {message && (
          <div className={`p-4 text-center text-white font-bold ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
              {message.text}
          </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Preview Area */}
        <div className="w-full md:w-1/3 bg-blue-50 flex items-center justify-center p-8 min-h-[300px]">
            <div className="relative">
                <Avatar config={currentConfig} size={250} />
            </div>
        </div>

        {/* Controls Area */}
        <div className="w-full md:w-2/3 flex flex-col h-full">
            {/* Tabs */}
            <div className="flex overflow-x-auto p-2 bg-gray-50 border-b gap-2">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap font-bold transition-colors ${
                            activeTab === tab.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-600 border'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
                {filteredItems.map(item => {
                    const isOwned = ownedItems.includes(item.id);
                    const isEquipped =
                        currentConfig.baseId === item.id ||
                        currentConfig.topId === item.id ||
                        currentConfig.bottomId === item.id ||
                        currentConfig.shoesId === item.id ||
                        currentConfig.accessoryId === item.id;

                    return (
                        <div key={item.id} className={`border rounded-lg p-3 flex flex-col items-center justify-between transition-all ${isEquipped ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'}`}>
                            {/* Simple Preview of the item logic is hard without rendering it on a dummy,
                                so we just use the name or a mini icon if we had one.
                                For now, we render the avatar with just this item if possible, or just the item SVG.
                            */}
                            <div className="h-24 w-24 flex items-center justify-center mb-2 bg-white rounded-full border overflow-hidden">
                                <svg viewBox="0 0 100 200" width="100%" height="100%">
                                    {item.svg && React.createElement(AvatarAssets[item.svg], { transform: "scale(0.8) translate(10, 10)" })}
                                </svg>
                            </div>

                            <h3 className="font-bold text-sm text-center mb-2">{item.name}</h3>

                            {isOwned ? (
                                <button
                                    onClick={() => handleEquip(item)}
                                    className={`w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${
                                        isEquipped
                                        ? 'bg-green-500 text-white cursor-default'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                    disabled={isEquipped}
                                >
                                    {isEquipped ? <><Check size={16}/> Puesto</> : 'Poner'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleBuy(item)}
                                    className="w-full py-2 rounded-lg bg-yellow-400 text-yellow-900 font-bold hover:bg-yellow-500 flex items-center justify-center gap-2"
                                >
                                    <ShoppingBag size={16} />
                                    {item.cost}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarEditor;
