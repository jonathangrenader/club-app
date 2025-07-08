import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import InputField from '../InputField';
import TextAreaField from '../TextAreaField';
import FileUploader from '../FileUploader';
import { Loader2, Upload, Save } from 'lucide-react';

const NewsFormModal = ({ isOpen, onClose, onSave, newsData, setNewsData, handleFileUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedFile(null);
        }
    }, [isOpen]);

    const handleUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        const url = await handleFileUpload(selectedFile, 'news_images');
        if (url) {
            setNewsData(prev => ({ ...prev, imageUrl: url }));
        }
        setIsUploading(false);
        setSelectedFile(null);
    };

    const handleSave = (status) => {
        onSave({ ...newsData, status });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={newsData?.id ? "Editar Noticia" : "Crear Nueva Noticia"}>
            <div className="space-y-4">
                <InputField id="title" name="title" label="Título" placeholder="¡Nuevo Anuncio!" value={newsData?.title || ''} onChange={(e) => setNewsData(prev => ({...prev, title: e.target.value}))} required />
                <TextAreaField id="content" name="content" label="Contenido" placeholder="Detalles de la noticia..." value={newsData?.content || ''} onChange={(e) => setNewsData(prev => ({...prev, content: e.target.value}))} required />
                <FileUploader
                    onFileSelect={setSelectedFile}
                    currentFileUrl={newsData?.imageUrl}
                    identifier="news-image"
                />
                 {selectedFile && (
                    <button type="button" onClick={handleUpload} disabled={isUploading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center disabled:bg-gray-500">
                         {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
                         {isUploading ? 'Subiendo...' : "Confirmar Imagen"}
                    </button>
                 )}
                 {newsData?.imageUrl && !selectedFile && <div className="text-sm text-gray-400">Imagen actual: <a href={newsData.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver Imagen</a></div>}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="button" onClick={() => handleSave('Borrador')} className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"><Save size={16} /> Guardar Borrador</button>
                    <button type="button" onClick={() => handleSave('Publicado')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Publicar Noticia</button>
                </div>
            </div>
        </Modal>
    );
};

export default NewsFormModal;