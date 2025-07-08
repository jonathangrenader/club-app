import React, { forwardRef } from 'react';
import { Building } from 'lucide-react';

const TalonarioPreview = forwardRef(({ talonarioConfig, clubConfig, receiptData = {} }, ref) => {
    const { fields, title } = talonarioConfig;

    const renderField = (label, value) => (
        <div className="flex justify-between"><span className="text-gray-400">{label}:</span><span>{value}</span></div>
    );

    return (
        <div ref={ref} className="bg-gray-900 p-4 rounded-lg aspect-[9/16] w-full max-w-[280px] mx-auto flex flex-col text-white font-mono text-xs">
            {fields?.showLogo && (
                <div className="text-center mb-4">
                    {clubConfig.logoURL ? <img src={clubConfig.logoURL} alt="Logo" className="h-16 mx-auto mb-2 object-contain" /> : <Building size={40} className="mx-auto" />}
                </div>
            )}
            {fields?.showNombreClub && <h4 className="font-bold text-lg text-center">{clubConfig.name}</h4>}
            <h5 className="font-bold text-md text-center text-blue-300 my-2">{title}</h5>

            <div className="border-y-2 border-dashed border-gray-500 py-4 my-2 space-y-2">
                {fields?.showNombreSocio && renderField("Socio", receiptData?.socioName || "JUAN PEREZ")}
                {fields?.showDni && renderField("DNI", receiptData?.dni || "12.345.678")}
                {fields?.showPlan && renderField("Plan", receiptData?.plan || "SOCIO PLENO")}
                {fields?.showFechaPago && renderField("Fecha Pago", receiptData?.paymentDate || new Date().toLocaleDateString())}
                {fields?.showVencimiento && renderField("Vencimiento", receiptData?.vencimiento || "10/" + (new Date().getMonth() + 2) + "/" + new Date().getFullYear())}
            </div>

            {fields?.showImporte && (
                <div className="flex-grow flex flex-col justify-center items-center my-4">
                    <p className="text-gray-400">IMPORTE</p>
                    <p className="text-4xl font-bold text-green-400">${(receiptData?.amount || 9999).toFixed(2)}</p>
                </div>
            )}

            <div className="border-t-2 border-dashed border-gray-500 pt-4 text-xs mt-auto">
                <p className="text-gray-400">Observaciones:</p>
                <p>{receiptData?.observaciones || talonarioConfig.observaciones}</p>
            </div>
        </div>
    );
});

export default TalonarioPreview;
