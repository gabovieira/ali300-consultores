import React from 'react';
import * as LucideIcons from 'lucide-react';

type IconName = string;

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ name, className = '', size = 24, color = 'currentColor' }) => {
  // @ts-ignore - Ignoramos TypeScript aquí porque sabemos que el icono existe
  const IconComponent = LucideIcons[name];
  
  if (!IconComponent) {
    console.warn(`Icon ${name} not found`);
    return (
      <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
        <div className="w-full h-full flex items-center justify-center text-xs bg-gray-700 rounded text-gray-300">
          {String(name).charAt(0)}
        </div>
      </div>
    );
  }
  
  return <IconComponent className={className} size={size} color={color} />;
};

export default Icon; 