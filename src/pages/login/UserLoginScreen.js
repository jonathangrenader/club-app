import React, { useState } from 'react';
import InputField from '../../components/InputField';
import { LogIn, ArrowLeft, Building } from 'lucide-react';

/**
 * Pantalla para que un usuario (admin/staff/instructor) inicie sesión.
 * @param {function} onUserLogin - Función a llamar cuando se envía el formulario.
 * @param {function} onBack - Función para volver a la pantalla anterior.
 * @param {string} clubName - El nombre del club.
 * @param {string} error - Mensaje de error a mostrar.
 * @param {string} clubLogo - URL del logo del club.
 */
const UserLoginScreen = ({ onUserLogin, onBack, clubName, error, clubLogo }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const handleSubmit = (e) => { e.preventDefault(); onUserLogin(email, password); };
    
    return (
        <div className="w-full max-w-sm mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
            <div className="text-center mb-6">
                {clubLogo ? <img src={clubLogo} alt="Logo del Club" className="h-20 mx-auto mb-4 object-contain"/> : <Building size={48} className="mx-auto text-blue-400" />}
                <h2 className="text-2xl font-bold text-white mt-4">Login en {clubName}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField id="email" label="Email" type="email" placeholder="admin@demo.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
                <InputField id="password" label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full mt-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center justify-center">
                    <LogIn size={18} className="mr-2"/>Entrar
                </button>
            </form>
            <button onClick={onBack} className="w-full mt-4 text-center text-sm text-gray-400 hover:text-white flex items-center justify-center">
                <ArrowLeft size={14} className="inline mr-1"/>Volver
            </button>
        </div>
    );
};

export default UserLoginScreen;
