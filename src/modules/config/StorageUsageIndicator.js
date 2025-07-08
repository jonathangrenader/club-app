import React from 'react';
import { HardDrive } from 'lucide-react';

const StorageUsageIndicator = ({ usageInBytes, limitInBytes }) => {
    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const percentage = limitInBytes > 0 ? ((usageInBytes || 0) / limitInBytes) * 100 : 0;

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center"><HardDrive size={20} className="mr-2 text-blue-400" /> Almacenamiento</h3>
            <div className="space-y-2">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                    <span>{formatBytes(usageInBytes || 0)} de {formatBytes(limitInBytes)}</span>
                    <span>{percentage.toFixed(2)}%</span>
                </div>
            </div>
        </div>
    );
};

export default StorageUsageIndicator;
