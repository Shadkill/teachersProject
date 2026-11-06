import React from 'react';
import { X } from 'lucide-react';

export default function MercuryModal({ isOpen, onClose, subtitle, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Затемнение фона с размытием */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#171721]/80 backdrop-blur-md transition-opacity"
      />
      {/* Поверхность карточки #1e1e2a без теней */}
      <div
        style={{ backgroundColor: '#1e1e2a', borderRadius: '12px', padding: '32px' }}
        className="relative z-10 w-full max-w-lg border border-[#70707d]/30 text-[#ededf3]"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            {subtitle && (
              <span className="text-[12px] uppercase tracking-wider text-[#c3c3cc] block mb-1.5">
                {subtitle}
              </span>
            )}
            <h3 className="text-[24px] font-normal tracking-tight text-[#ededf3]">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#272735] text-[#c3c3cc] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}