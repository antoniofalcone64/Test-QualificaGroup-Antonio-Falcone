import React, { useState } from 'react';

interface MultiSelectProps {
    options: string[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = (option: string) => {
        const newValue = value.includes(option)
            ? value.filter(v => v !== option)
            : [...value, option];
        onChange(newValue);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border rounded text-sm text-left bg-white hover:bg-gray-50"
            >
                {value.length > 0 ? `${value.length} selezionati` : placeholder}
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                    {options.map(option => (
                        <label key={option} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={value.includes(option)}
                                onChange={() => handleToggle(option)}
                                className="mr-2"
                            />
                            <span className="text-sm">{option}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;