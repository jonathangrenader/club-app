import React from 'react';

/**
 * Un componente reutilizable para áreas de texto.
 * @param {string} id - El ID del textarea.
 * @param {string} label - El texto de la etiqueta para el textarea.
 * @param {string} value - El valor actual del textarea.
 * @param {function} onChange - La función a llamar cuando el valor cambia.
 * @param {string} placeholder - El texto del marcador de posición.
 */
const TextAreaField = ({ id, label, value, onChange, placeholder }) => (
    <div>
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
        <textarea 
            id={id} 
            name={id} 
            value={value || ''} 
            onChange={onChange} 
            placeholder={placeholder} 
            rows="3" 
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
    </div>
);

export default TextAreaField;
