import React from 'react';
import { Shield, Users } from 'lucide-react';

/**
 * Componente que muestra la pantalla inicial para seleccionar el portal de acceso.
 * @param {function} setPortalMode - Función para establecer el modo del portal ('admin' o 'member').
 */
const PortalSelector = ({ setPortalMode }) => (
    <div className="w-full max-w-md mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
        <img src="/logo.png" alt="The Club Cloud Logo" className="h-24 mx-auto mb-6"/>
        <h2 className="text-2xl font-bold text-white text-center mb-6">Bienvenido a The Club Cloud</h2>
        <p className="text-center text-gray-400 mb-8">Seleccione el portal al que desea acceder.</p>
        <div className="flex flex-col space-y-4">
            <button 
                onClick={() => setPortalMode('admin')} 
                className="w-full p-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
            >
                <Shield />
                Portal de Administración
            </button>
            <button 
                onClick={() => setPortalMode('member')} 
                className="w-full p-4 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
            >
                <Users />
                Portal de Socios
            </button>
        </div>
    </div>
);

export default PortalSelector;
