import React, { useState, useMemo } from 'react';
import { saveMember, deleteMember } from '../services/firebaseServices'; 
import InputField from '../components/InputField';
import ConfirmationModal from '../components/ConfirmationModal';
import QRDisplayModal from '../components/modals/QRDisplayModal';
import MemberFormModal from '../components/forms/MemberFormModal';
import { UserPlus, Edit, Trash2, QrCode, Search } from 'lucide-react';

const MembersModule = ({ db, currentClub, members, config, activities, handleFileUpload }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [currentMemberData, setCurrentMemberData] = useState(null);
    const [memberToDelete, setMemberToDelete] = useState(null);

    const handleOpenFormModal = (member = null) => {
        setCurrentMemberData(member ? {...member, password: '', confirmPassword: ''} : { name: '', email: '', memberType: '', status: 'Activo', pais: 'Argentina' });
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleSaveMemberWithService = async (memberData) => {
        try {
            await saveMember(db, currentClub.id, memberData);
            handleCloseFormModal();
        } catch (error) {
            console.error("Error al guardar el socio:", error);
            alert("Error al guardar el socio. Revise la consola para más detalles.");
        }
    };

    const handleOpenConfirmModal = (memberId) => {
        setMemberToDelete(memberId);
        setIsConfirmModalOpen(true);
    };

    const handleCloseConfirmModal = () => setMemberToDelete(null);
    
    const handleConfirmDeleteWithService = async () => {
        if (!memberToDelete) return;
        try {
            await deleteMember(db, memberToDelete);
            handleCloseConfirmModal();
        } catch (error) {
            console.error("Error al eliminar el socio:", error);
            handleCloseConfirmModal();
        }
    };
    
    const handleOpenQRModal = (member) => {
        const qrValue = JSON.stringify({
            type: 'member',
            id: member.id,
            clubId: currentClub.id,
            name: member.name,
            dni: member.dni,
            memberType: member.memberType,
        });
        setCurrentMemberData({ ...member, qrValue });
        setIsQRModalOpen(true);
    };

    const handleCloseQRModal = () => {
        setIsQRModalOpen(false);
        setTimeout(() => setCurrentMemberData(null), 300);
    }

    const filteredMembers = useMemo(() => {
        const memberList = members || []; 
        if (!searchTerm) return memberList;
        return memberList.filter(member =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.dni && member.dni.includes(searchTerm))
        );
    }, [members, searchTerm]);

    return (
        <>
            <MemberFormModal 
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                onSave={handleSaveMemberWithService}
                memberData={currentMemberData}
                setMemberData={setCurrentMemberData}
                config={config}
                activities={activities}
                handleFileUpload={handleFileUpload}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirmDeleteWithService}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar a este socio? Esta acción no se puede deshacer."
            />
            {currentMemberData && (
                <QRDisplayModal
                    isOpen={isQRModalOpen}
                    onClose={handleCloseQRModal}
                    qrValue={currentMemberData.qrValue}
                    memberName={currentMemberData.name}
                />
            )}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-white">Gestión de Socios ({filteredMembers.length})</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <InputField 
                            id="search" 
                            placeholder="Buscar por nombre o DNI..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            icon={Search}
                        />
                        <button onClick={() => handleOpenFormModal()} className="flex-shrink-0 flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                            <UserPlus size={18} className="mr-2" />
                            Añadir
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-300">Nombre</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Email</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Tipo de Socio</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Estado</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map(member => (
                                    <tr key={member.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="p-3 flex items-center gap-3">
                                            <img src={member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0D8ABC&color=fff`} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                            {member.name}
                                        </td>
                                        <td className="p-3">{member.email}</td>
                                        <td className="p-3">{member.memberType}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                member.status === 'Activo' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                            }`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="p-3 flex space-x-2">
                                            <button onClick={() => handleOpenQRModal(member)} className="p-1 text-gray-400 hover:text-white" title="Ver QR"><QrCode size={16} /></button>
                                            <button onClick={() => handleOpenFormModal(member)} className="p-1 text-gray-400 hover:text-white" title="Editar Socio"><Edit size={16} /></button>
                                            <button onClick={() => handleOpenConfirmModal(member.id)} className="p-1 text-gray-400 hover:text-red-400" title="Eliminar Socio"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-6 text-gray-400">
                                        No se encontraron socios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default MembersModule;