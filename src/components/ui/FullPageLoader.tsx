import React from 'react';

const FullPageLoader: React.FC = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95">
    <span className="w-16 h-16 mb-6 border-8 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    <div className="text-lg font-medium text-gray-700">Caricamento in corso...</div>
  </div>
);

export default FullPageLoader;
