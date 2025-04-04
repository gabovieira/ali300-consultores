import React from 'react';

interface DataDisplayCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

const DataDisplayCard: React.FC<DataDisplayCardProps> = React.memo(({
  title,
  value,
  icon,
  className = '',
  valueClassName = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 flex items-center ${className}`}>
      <div className="bg-primary/10 p-3 rounded-full mr-4">
        {icon}
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
});

// Añadir displayName para herramientas de desarrollo
DataDisplayCard.displayName = 'DataDisplayCard';

export default DataDisplayCard; 