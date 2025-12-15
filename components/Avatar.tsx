import React from 'react';
import { AvatarConfig } from '../types';
import { AvatarAssets } from './AvatarAssets';
import { getItemById } from '../constants/avatarItems';

interface AvatarProps {
  config?: AvatarConfig;
  className?: string;
  size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ config, className, size = 150 }) => {
  if (!config || !config.baseId) {
    return (
        <div className={`flex items-center justify-center bg-gray-200 rounded-full ${className}`} style={{ width: size, height: size }}>
            <span className="text-4xl">?</span>
        </div>
    );
  }

  const Base = AvatarAssets[getItemById(config.baseId)?.svg || ''] || null;
  const Top = config.topId ? AvatarAssets[getItemById(config.topId)?.svg || ''] : null;
  const Bottom = config.bottomId ? AvatarAssets[getItemById(config.bottomId)?.svg || ''] : null;
  const Shoes = config.shoesId ? AvatarAssets[getItemById(config.shoesId)?.svg || ''] : null;
  const Accessory = config.accessoryId ? AvatarAssets[getItemById(config.accessoryId)?.svg || ''] : null;

  return (
    <svg
        viewBox="0 0 100 200"
        width={size}
        height={size * 2} // Maintain aspect ratio roughly
        className={className}
        style={{ overflow: 'visible' }}
    >
      {/* Layer Order: Base -> Shoes -> Bottom -> Top -> Accessory */}
      {Base && <Base />}
      {Shoes && <Shoes />}
      {Bottom && <Bottom />}
      {Top && <Top />}
      {Accessory && <Accessory />}
    </svg>
  );
};

export default Avatar;
