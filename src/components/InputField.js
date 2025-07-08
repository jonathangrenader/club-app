import React from 'react';

/**
 * Componente de campo de entrada reutilizable con soporte para etiquetas, iconos y estado deshabilitado.
 * @param {string} id - El ID del campo de entrada.
 * @param {string} label - El texto de la etiqueta para el campo.
 * @param {string} type - El tipo de entrada (text, password, email, etc.).
 * @param {string} value - El valor actual del campo.
 * @param {function} onChange - La función a llamar cuando el valor cambia.
 * @param {string} placeholder - El texto del marcador de posición.
 * @param {boolean} disabled - Si el campo está deshabilitado.
 * @param {React.ElementType} icon - El componente de icono a mostrar.
 */
const InputField = ({ id, label, type, value, onChange, placeholder, disabled = false, icon: Icon }) => {
    return (
        <div className="relative">
            {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
            
            {/* Contenedor para el icono, se ajusta si hay una etiqueta o no */}
            {Icon && (
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${label ? 'top-7' : 'h-full'}`}>
                    <Icon className="text-gray-400" size={16} />
                </div>
            )}
            
            <input
                id={id}
                name={id}
                type={type}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed ${Icon ? 'pl-9' : ''}`}
            />
        </div>
    );
};

export default InputField;
