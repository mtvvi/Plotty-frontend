import { Plus, MoreVertical, Settings } from 'lucide-react';
import { Link } from 'react-router';
import { Header } from '../components/Header';

export default function Workshop() {
  const stories = [
    {
      id: '1',
      title: 'Капитан Марвел',
      description: 'Обложка появится автоматически, когда у первой главы будет иллюстрация.',
      chapters: 1,
      status: 'draft',
    },
    {
      id: '2',
      title: 'Перевал',
      description: '',
      chapters: 5,
      status: 'published',
    },
  ];

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(rgb(228, 221, 210) 0%, rgb(217, 210, 196) 100%)',
    }}>
      <Header />
      
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 pb-24 lg:pb-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="font-['Literata'] font-semibold text-[36px] md:text-[48px] lg:text-[56px] text-[#23211e] leading-[1.1] tracking-[-2.2px] mb-2 md:mb-3">
            Авторская мастерская
          </h1>
          <p className="font-['Manrope'] font-medium text-[14px] md:text-[15px] text-[#6d665d] leading-[1.6] max-w-2xl">
            Главная мастерская: выберите историю, управляйте главами и отслеживайте настроение историй отдельно
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex gap-2 md:gap-3 mb-6 md:mb-8">
          <button className="px-4 md:px-5 py-2.5 md:py-3 bg-[#bc5f3d] hover:bg-[#a64f31] text-white rounded-xl font-['Manrope'] font-bold text-[13px] md:text-[14px] shadow-[0px_6px_16px_rgba(188,95,61,0.18)] transition-all flex items-center gap-2">
            Мои истории
          </button>
          <button className="px-4 md:px-5 py-2.5 md:py-3 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-bold text-[13px] md:text-[14px] text-[#23211e] hover:bg-[rgba(41,38,34,0.02)] transition-all">
            Создать историю
          </button>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Story Card 1 - Featured/Active */}
          <div className="bg-gradient-to-br from-[#bc5f3d] to-[#a64f31] rounded-3xl p-8 text-white shadow-[0px_16px_48px_rgba(188,95,61,0.24)]">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="font-['Manrope'] font-semibold text-[11px] text-white/70 tracking-[0.8px] uppercase mb-3">
                  Plotty Story
                </div>
                <h2 className="font-['Literata'] font-semibold text-[32px] leading-[1.1] tracking-[-1px] mb-2">
                  Капитан Марвел
                </h2>
                <p className="font-['Manrope'] font-medium text-[14px] text-white/80 leading-[1.5] mb-4">
                  Обложка появится автоматически, когда у первой главы будет иллюстрация.
                </p>
                <div className="font-['Manrope'] font-semibold text-[13px] text-white/70">
                  1 глава
                </div>
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <Link
                to="/story/1"
                className="block w-full px-4 py-3 bg-white text-[#bc5f3d] rounded-xl font-['Manrope'] font-bold text-[14px] text-center hover:bg-white/95 transition-all"
              >
                Открыть страницу истории
              </Link>
              <Link
                to="/story/1/settings"
                className="block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-['Manrope'] font-bold text-[14px] text-center hover:bg-white/15 transition-all"
              >
                Настройки истории
              </Link>
              <button className="w-full px-4 py-3 bg-white text-[#bc5f3d] rounded-xl font-['Manrope'] font-bold text-[14px] hover:bg-white/95 transition-all">
                Создать новую главу
              </button>
            </div>
          </div>

          {/* Story Card 2 - Regular */}
          <div className="bg-white/90 backdrop-blur-sm border border-[rgba(41,38,34,0.08)] rounded-3xl p-8 hover:shadow-[0px_12px_32px_rgba(46,35,23,0.10)] hover:border-[rgba(41,38,34,0.12)] transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="font-['Manrope'] font-semibold text-[11px] text-[#6d665d] tracking-[0.8px] uppercase mb-3">
                  Plotty Story
                </div>
                <h2 className="font-['Literata'] font-semibold text-[32px] text-[#23211e] leading-[1.1] tracking-[-1px] mb-2 group-hover:text-[#bc5f3d] transition-colors">
                  Перевал
                </h2>
                <div className="font-['Manrope'] font-semibold text-[13px] text-[#6d665d] mb-4">
                  5 глав
                </div>
              </div>
              <button className="p-2 hover:bg-[rgba(41,38,34,0.04)] rounded-lg transition-colors text-[#6d665d]">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <Link
                to="/story/2"
                className="block w-full px-4 py-3 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-bold text-[14px] text-[#23211e] text-center hover:bg-[rgba(41,38,34,0.02)] transition-all"
              >
                Открыть страницу истории
              </Link>
              <Link
                to="/story/2/settings"
                className="block w-full px-4 py-3 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-bold text-[14px] text-[#23211e] text-center hover:bg-[rgba(41,38,34,0.02)] transition-all"
              >
                Настройки истории
              </Link>
            </div>
          </div>

          {/* Create New Story Card */}
          <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-[rgba(41,38,34,0.12)] rounded-3xl p-8 hover:border-[#bc5f3d] hover:bg-white/70 transition-all group cursor-pointer">
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="w-16 h-16 bg-[rgba(188,95,61,0.08)] group-hover:bg-[rgba(188,95,61,0.12)] rounded-2xl flex items-center justify-center mb-4 transition-all">
                <Plus size={28} className="text-[#bc5f3d]" />
              </div>
              <h3 className="font-['Manrope'] font-bold text-[18px] text-[#23211e] mb-2">
                Создать новую историю
              </h3>
              <p className="font-['Manrope'] font-medium text-[14px] text-[#6d665d] text-center max-w-xs">
                Начните писать свою следующую историю с помощью нейро-бета-ридера
              </p>
            </div>
          </div>
        </div>

        {/* Chapters Section - для активной истории */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Literata'] font-semibold text-[32px] text-[#23211e] tracking-[-1px]">
              Главы
            </h2>
            <span className="font-['Manrope'] font-medium text-[14px] text-[#9a9088]">
              1 глава
            </span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border border-[rgba(41,38,34,0.08)] rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-['Manrope'] font-bold text-[18px] text-[#23211e] tracking-[-0.3px] mb-2">
                    Глава 1. Начало
                  </h3>
                  <p className="font-['Manrope'] font-medium text-[13px] text-[#9a9088]">
                    Обновлена 31.03.2026, 18:32:01
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/story/1#chapter-1"
                    className="px-4 py-2 bg-white border border-[rgba(41,38,34,0.10)] rounded-lg font-['Manrope'] font-semibold text-[13px] text-[#23211e] hover:bg-[rgba(41,38,34,0.02)] transition-all"
                  >
                    Сгенерировать картинку
                  </Link>
                  <Link
                    to="/story/1#chapter-1"
                    className="px-4 py-2 bg-white border border-[rgba(41,38,34,0.10)] rounded-lg font-['Manrope'] font-semibold text-[13px] text-[#23211e] hover:bg-[rgba(41,38,34,0.02)] transition-all"
                  >
                    Читать
                  </Link>
                  <Link
                    to="/story/1#chapter-1"
                    className="px-4 py-2 bg-[#bc5f3d] hover:bg-[#a64f31] text-white rounded-lg font-['Manrope'] font-bold text-[13px] shadow-[0px_4px_12px_rgba(188,95,61,0.16)] transition-all"
                  >
                    Редактировать
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}