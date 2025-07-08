import React, { useState, useEffect } from 'react';
import { Paperclip } from 'lucide-react';

/**
 * A reusable file uploader component with preview.
 * @param {function} onFileSelect - Callback function when a file is selected.
 * @param {string} currentFileUrl - The URL of the currently saved file, for display.
 * @param {string} identifier - A unique ID for the file input.
 * @param {string} [acceptedFileTypes="image/*"] - The accepted file types for the input.
 */
const FileUploader = ({ onFileSelect, currentFileUrl, identifier, acceptedFileTypes = "image/*" }) => {
    const [preview, setPreview] = useState(currentFileUrl);
    const [fileName, setFileName] = useState(currentFileUrl ? 'Archivo actual' : 'Ningún archivo seleccionado');

    useEffect(() => {
        setPreview(currentFileUrl);
        if (currentFileUrl) {
            setFileName('Archivo actual');
        } else {
            setFileName('Ningún archivo seleccionado');
            setPreview(null);
        }
    }, [currentFileUrl]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            onFileSelect(selectedFile);
            setFileName(selectedFile.name);
            if (acceptedFileTypes.includes('image') && selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result);
                reader.readAsDataURL(selectedFile);
            } else {
                setPreview(null);
            }
        }
    };

    return (
        <div className="space-y-3">
            <div className="w-full bg-gray-700 rounded-lg flex items-center justify-center p-4 border-2 border-dashed border-gray-600 min-h-[100px]">
                {preview && acceptedFileTypes.includes('image') ? (
                    <img src={preview} alt="Vista previa" className="max-h-32 rounded-md object-contain" />
                ) : (
                    <div className="text-center text-gray-400">
                        <Paperclip size={32} className="mx-auto" />
                        <p className="mt-2 text-sm">{fileName}</p>
                    </div>
                )}
            </div>
            <input 
                type="file" 
                id={`file-upload-${identifier}`} 
                className="hidden" 
                onChange={handleFileChange} 
                accept={acceptedFileTypes} 
            />
            <label 
                htmlFor={`file-upload-${identifier}`} 
                className="cursor-pointer w-full inline-block text-center py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
            >
                Seleccionar archivo...
            </label>
        </div>
    );
};

export default FileUploader;
