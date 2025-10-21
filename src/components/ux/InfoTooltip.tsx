import React, { useState } from 'react';

interface InfoTooltipProps {
    text: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative inline-block ml-1">
            <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="w-4 h-4 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-blue-600"
            >
                i
            </button>
            {showTooltip && (
                <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-64 whitespace-normal">
                    {text}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
};

export default InfoTooltip;