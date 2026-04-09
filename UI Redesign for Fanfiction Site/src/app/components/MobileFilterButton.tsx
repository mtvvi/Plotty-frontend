import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

export function MobileFilterButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-[#bc5f3d] hover:bg-[#a64f31] text-white rounded-full shadow-[0px_12px_32px_rgba(188,95,61,0.32)] flex items-center justify-center active:scale-95 transition-all"
      >
        <SlidersHorizontal size={22} strokeWidth={2.5} />
      </button>

      {/* Mobile Filter Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-white rounded-t-3xl shadow-[0px_-12px_48px_rgba(46,35,23,0.20)] max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(41,38,34,0.08)]">
              <h2 className="font-['Manrope'] font-bold text-[18px] text-[#23211e]">
                Фильтры
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[rgba(41,38,34,0.04)] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#6d665d]">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* Фандом */}
              <div>
                <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-2.5">
                  Фандом
                </label>
                <select className="w-full px-3.5 py-2.5 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-medium text-[14px] text-[#23211e] focus:outline-none focus:border-[#bc5f3d] focus:ring-1 focus:ring-[#bc5f3d]">
                  <option>Любой вариант</option>
                  <option>DC</option>
                  <option>Marvel</option>
                  <option>Harry Potter</option>
                </select>
              </div>

              {/* Рейтинг */}
              <div>
                <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-2.5">
                  Рейтинг
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    G
                  </button>
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    NC-17
                  </button>
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    NC-21
                  </button>
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    PG-13
                  </button>
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    R
                  </button>
                </div>
              </div>

              {/* Статус */}
              <div>
                <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-2.5">
                  Статус
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    В процессе
                  </button>
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    Завершён
                  </button>
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    Заморожен
                  </button>
                </div>
              </div>

              {/* Жанры */}
              <div>
                <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-2.5">
                  Жанры
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    Драма
                  </button>
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    Мистика
                  </button>
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    Фэнтези
                  </button>
                  <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px]">
                    Юмор
                  </button>
                </div>
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div className="px-5 py-4 border-t border-[rgba(41,38,34,0.08)] flex gap-3" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button className="flex-1 px-4 py-3 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-bold text-[14px] text-[#23211e]">
                Очистить
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-3 bg-[#bc5f3d] text-white rounded-xl font-['Manrope'] font-bold text-[14px] shadow-[0px_6px_16px_rgba(188,95,61,0.18)]"
              >
                Применить
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
