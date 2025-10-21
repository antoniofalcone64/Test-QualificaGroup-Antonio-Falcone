import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FullPageErrorProps {
  message?: string;
}

const FullPageError: React.FC<FullPageErrorProps> = ({ message }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95">
    <AlertCircle className="text-red-500 mb-4" size={56} />
    <div className="text-xl font-semibold text-red-500 mb-2">Si è verificato un errore</div>
    {message && <div className="text-base text-gray-700 text-center max-w-[90vw]">{message}</div>}
  </div>
);

export default FullPageError;
