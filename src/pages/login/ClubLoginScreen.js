import React, { useState } from 'react';
import InputField from '../../components/InputField';
import { Loader2, RefreshCw, LogIn } from 'lucide-react';

/**
 * Pantalla para que el usuario ingrese el ID del club.
 * @param {function} onClubLogin - Función a llamar cuando se envía el ID del club.
 * @param {string} error - Mensaje de error a mostrar.
 * @param {function} onResetDemo - Función para reiniciar los datos de demostración.
 * @param {boolean} [forMember=false] - Indica si el login es para un socio.
 */
const ClubLoginScreen = ({ onClubLogin, error, onResetDemo, forMember = false }) => {
    const [clubId, setClubId] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onClubLogin(clubId.trim());
    };

    const handleReset = async () => {
        setIsResetting(true);
        await onResetDemo();
        setIsResetting(false);
    };

    return (
        <div className="w-full max-w-sm mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
            <div className="text-center mb-6">
                <img src="/logo.png" alt="Logo de The Club Cloud" className="h-20 mx-auto mb-4"/>
                <h2 className="text-2xl font-bold text-white mt-4">{forMember ? "Portal de Socios" : "Acceso para Clubes"}</h2>
                <p className="text-gray-400">Introduce el ID de tu club para continuar.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField id="clubId" label="ID del Club" placeholder="Ej: DEMO" value={clubId} onChange={(e) => setClubId(e.target.value.toUpperCase())} />
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full mt-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center justify-center">
                    <LogIn size={18} className="mr-2"/>Continuar
                </button>
            </form>
            {!forMember && (
                <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                    <button onClick={handleReset} disabled={isResetting} className="text-sm text-yellow-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center w-full">
                        {isResetting ? <Loader2 size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />}
                        {isResetting ? 'Reiniciando...' : 'Reiniciar Datos DEMO'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClubLoginScreen;
