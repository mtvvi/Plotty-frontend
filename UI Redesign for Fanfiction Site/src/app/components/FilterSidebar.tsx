import { useState } from 'react';

export function FilterSidebar() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    genre: [],
    rating: [],
    status: [],
    size: [],
    fandom: [],
  });

  const toggleFilter = (category: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category] || [];
      const isSelected = current.includes(value);
      
      return {
        ...prev,
        [category]: isSelected 
          ? current.filter(v => v !== value)
          : [...current, value]
      };
    });
  };

  const isSelected = (category: string, value: string) => {
    return selectedFilters[category]?.includes(value) || false;
  };

  const FilterButton = ({ category, value, label }: { category: string; value: string; label: string }) => {
    const selected = isSelected(category, value);
    
    return (
      <button
        onClick={() => toggleFilter(category, value)}
        className={`px-3.5 py-2 rounded-lg font-['Manrope'] font-medium text-[13px] transition-all ${
          selected
            ? 'bg-[#bc5f3d] text-white shadow-sm'
            : 'bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] hover:border-[rgba(41,38,34,0.16)] hover:bg-[rgba(41,38,34,0.02)]'
        }`}
      >
        {label}
      </button>
    );
  };

  const clearAll = () => {
    setSelectedFilters({
      genre: [],
      rating: [],
      status: [],
      size: [],
      fandom: [],
    });
  };

  const hasFilters = Object.values(selectedFilters).some(arr => arr.length > 0);

  return (
    <div className="w-72 bg-white/90 backdrop-blur-sm border border-[rgba(41,38,34,0.08)] rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(41,38,34,0.06)]">
        <h2 className="font-['Manrope'] font-bold text-[16px] text-[#23211e]">
          Фильтры
        </h2>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="font-['Manrope'] font-semibold text-[13px] text-[#bc5f3d] hover:text-[#a64f31] transition-colors"
          >
            Очистить всё
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <div className="space-y-6">
        {/* Фандом */}
        <div>
          <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-3">
            Фандом
          </label>
          <select className="w-full px-3.5 py-2.5 bg-white border border-[rgba(41,38,34,0.10)] rounded-lg font-['Manrope'] font-medium text-[13px] text-[#23211e] focus:outline-none focus:border-[#bc5f3d] focus:ring-1 focus:ring-[#bc5f3d] transition-all">
            <option>Любой вариант</option>
            <option>DC</option>
            <option>Marvel</option>
            <option>Harry Potter</option>
          </select>
        </div>

        {/* Рейтинг */}
        <div>
          <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-3">
            Рейтинг
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton category="rating" value="g" label="G" />
            <FilterButton category="rating" value="nc-17" label="NC-17" />
            <FilterButton category="rating" value="nc-21" label="NC-21" />
            <FilterButton category="rating" value="pg-13" label="PG-13" />
            <FilterButton category="rating" value="r" label="R" />
          </div>
        </div>

        {/* Статус */}
        <div>
          <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-3">
            Статус
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton category="status" value="in-progress" label="В процессе" />
            <FilterButton category="status" value="completed" label="Завершён" />
            <FilterButton category="status" value="frozen" label="Заморожен" />
          </div>
        </div>

        {/* Размер */}
        <div>
          <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-3">
            Размер
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton category="size" value="drabble" label="Дрэббл" />
            <FilterButton category="size" value="mini" label="Мини" />
            <FilterButton category="size" value="midi" label="Миди" />
            <FilterButton category="size" value="maxi" label="Макси" />
          </div>
        </div>

        {/* Жанры */}
        <div>
          <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-3">
            Жанры
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton category="genre" value="drama" label="Драма" />
            <FilterButton category="genre" value="action" label="Мистика" />
            <FilterButton category="genre" value="adventure" label="Приключения" />
            <FilterButton category="genre" value="fantasy" label="Фэнтези" />
            <FilterButton category="genre" value="humor" label="Юмор" />
            <FilterButton category="genre" value="romance" label="Персонажность" />
          </div>
        </div>

        {/* Предупреждения */}
        <div>
          <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-3">
            Предупреждения
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton category="warnings" value="ooc" label="OOC" />
            <FilterButton category="warnings" value="violence" label="Насилие" />
            <FilterButton category="warnings" value="character-death" label="Смерть персонажа" />
            <FilterButton category="warnings" value="underage" label="Нецензурная лексика" />
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <button className="w-full mt-6 px-4 py-3 bg-[#bc5f3d] hover:bg-[#a64f31] text-white rounded-xl font-['Manrope'] font-bold text-[14px] shadow-[0px_8px_20px_rgba(188,95,61,0.20)] hover:shadow-[0px_12px_28px_rgba(188,95,61,0.28)] transition-all">
        Применить
      </button>
    </div>
  );
}
