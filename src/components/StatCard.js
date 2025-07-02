import React from 'react';

/**
 * Una tarjeta para mostrar una estadística clave con título, valor e icono.
 * @param {string} title - El título de la estadística.
 * @param {string | number} value - El valor de la estadística.
 * @param {React.ElementType} icon - El componente de icono a mostrar.
 */
const StatCard = ({ title, value, icon: Icon }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center space-x-4">
        <div className="bg-gray-700 p-3 rounded-full">
            <Icon className="text-blue-400" size={24} />
        </div>
        <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

export default StatCard;
