import { ArrowLeft, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { Header } from '../components/Header';

export default function StorySettings() {
  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(rgb(228, 221, 210) 0%, rgb(217, 210, 196) 100%)',
    }}>
      <Header />
      
      <div className="max-w-[960px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 pb-24 lg:pb-8">
        {/* Back Button */}
        <Link
          to="/workshop"
          className="inline-flex items-center gap-2 font-['Manrope'] font-semibold text-[13px] md:text-[14px] text-[#6d665d] hover:text-[#bc5f3d] transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Вернуться в мастерскую
        </Link>

        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <div className="font-['Manrope'] font-semibold text-[11px] text-[#6d665d] tracking-[0.8px] uppercase mb-2">
            История
          </div>
          <h1 className="font-['Literata'] font-semibold text-[36px] md:text-[42px] lg:text-[48px] text-[#23211e] leading-[1.1] tracking-[-2px] mb-2 md:mb-3">
            Капитан Марвел
          </h1>
          <p className="font-['Manrope'] font-medium text-[13px] md:text-[14px] text-[#9a9088]">
            Обновлена 31.03.2026, 18:31:51
          </p>
        </div>

        {/* Settings Form */}
        <div className="bg-white/90 backdrop-blur-sm border border-[rgba(41,38,34,0.08)] rounded-2xl md:rounded-3xl overflow-hidden shadow-[0px_12px_40px_rgba(46,35,23,0.09)]">
          <div className="p-5 md:p-8 space-y-6 md:space-y-8">
            {/* Описание истории */}
            <div>
              <label className="block font-['Manrope'] font-bold text-[14px] text-[#23211e] mb-3">
                Описание истории <span className="text-[#9a9088] font-normal">не заполнено</span>
              </label>
              <textarea
                className="w-full px-4 py-3 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-medium text-[14px] text-[#23211e] placeholder:text-[#9a9088] focus:outline-none focus:border-[#bc5f3d] focus:ring-2 focus:ring-[rgba(188,95,61,0.10)] transition-all resize-none"
                rows={4}
                placeholder="Добавьте описание вашей истории..."
              />
            </div>

            {/* Tags Section */}
            <div>
              <label className="block font-['Manrope'] font-bold text-[14px] text-[#23211e] mb-4">
                Теги и категории
              </label>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Статус */}
                <div>
                  <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-2">
                    Статус
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3.5 py-2 bg-[#bc5f3d] text-white rounded-lg font-['Manrope'] font-medium text-[13px]">
                      В процессе
                    </button>
                    <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px] hover:bg-[rgba(41,38,34,0.02)] transition-all">
                      Завершён
                    </button>
                    <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px] hover:bg-[rgba(41,38,34,0.02)] transition-all">
                      Заморожен
                    </button>
                  </div>
                </div>

                {/* Фандом */}
                <div>
                  <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-2">
                    Фандом
                  </label>
                  <select className="w-full px-3.5 py-2.5 bg-white border border-[rgba(41,38,34,0.10)] rounded-lg font-['Manrope'] font-medium text-[13px] text-[#23211e] focus:outline-none focus:border-[#bc5f3d] focus:ring-1 focus:ring-[#bc5f3d] transition-all">
                    <option>DC</option>
                    <option>Marvel</option>
                    <option>Harry Potter</option>
                  </select>
                </div>

                {/* Жанр */}
                <div>
                  <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-2">
                    Жанр
                  </label>
                  <select className="w-full px-3.5 py-2.5 bg-white border border-[rgba(41,38,34,0.10)] rounded-lg font-['Manrope'] font-medium text-[13px] text-[#23211e] focus:outline-none focus:border-[#bc5f3d] focus:ring-1 focus:ring-[#bc5f3d] transition-all">
                    <option>Драма</option>
                    <option>Мистика</option>
                    <option>Приключения</option>
                    <option>Фэнтези</option>
                  </select>
                </div>

                {/* Рейтинг */}
                <div>
                  <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-2">
                    Рейтинг
                  </label>
                  <select className="w-full px-3.5 py-2.5 bg-white border border-[rgba(41,38,34,0.10)] rounded-lg font-['Manrope'] font-medium text-[13px] text-[#23211e] focus:outline-none focus:border-[#bc5f3d] focus:ring-1 focus:ring-[#bc5f3d] transition-all">
                    <option>NC-17</option>
                    <option>NC-21</option>
                    <option>PG-13</option>
                    <option>R</option>
                    <option>G</option>
                  </select>
                </div>

                {/* Размер */}
                <div>
                  <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-2">
                    Размер
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px] hover:bg-[rgba(41,38,34,0.02)] transition-all">
                      Дрэббл
                    </button>
                    <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px] hover:bg-[rgba(41,38,34,0.02)] transition-all">
                      Мини
                    </button>
                    <button className="px-3.5 py-2 bg-[#bc5f3d] text-white rounded-lg font-['Manrope'] font-medium text-[13px]">
                      Макси
                    </button>
                  </div>
                </div>

                {/* Предупреждения */}
                <div>
                  <label className="block font-['Manrope'] font-semibold text-[12px] text-[#6d665d] tracking-[0.5px] uppercase mb-2">
                    Предупреждения
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3.5 py-2 bg-[#bc5f3d] text-white rounded-lg font-['Manrope'] font-medium text-[13px]">
                      OOC
                    </button>
                    <button className="px-3.5 py-2 bg-white border border-[rgba(41,38,34,0.10)] text-[#6d665d] rounded-lg font-['Manrope'] font-medium text-[13px] hover:bg-[rgba(41,38,34,0.02)] transition-all">
                      Насилие
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 md:pt-6 border-t border-[rgba(41,38,34,0.06)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-0">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-[#d14343] hover:bg-[rgba(209,67,67,0.06)] rounded-lg font-['Manrope'] font-semibold text-[13px] md:text-[14px] transition-all order-2 sm:order-1">
                <Trash2 size={16} />
                Удалить историю
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 order-1 sm:order-2">
                <Link
                  to="/workshop"
                  className="px-4 md:px-5 py-2.5 md:py-3 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-bold text-[13px] md:text-[14px] text-[#23211e] text-center hover:bg-[rgba(41,38,34,0.02)] transition-all"
                >
                  Отменить
                </Link>
                <button className="px-4 md:px-5 py-2.5 md:py-3 bg-[#bc5f3d] hover:bg-[#a64f31] text-white rounded-xl font-['Manrope'] font-bold text-[13px] md:text-[14px] shadow-[0px_8px_20px_rgba(188,95,61,0.20)] hover:shadow-[0px_12px_28px_rgba(188,95,61,0.28)] transition-all">
                  Сохранить изменения
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}