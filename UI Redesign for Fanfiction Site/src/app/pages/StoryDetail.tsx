import { Heart, MessageCircle, Eye, Share2 } from 'lucide-react';
import { Link } from 'react-router';
import { Header } from '../components/Header';

export default function StoryDetail() {
  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(rgb(228, 221, 210) 0%, rgb(217, 210, 196) 100%)',
    }}>
      <Header />
      
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 pb-24 lg:pb-8">
        {/* Story Header Card */}
        <div className="bg-white/90 backdrop-blur-sm border border-[rgba(41,38,34,0.08)] rounded-2xl md:rounded-3xl overflow-hidden shadow-[0px_12px_40px_rgba(46,35,23,0.09)] mb-6">
          <div className="flex flex-col md:flex-row">
            {/* Cover */}
            <div className="w-full md:w-80 bg-gradient-to-br from-[#f0e8db] to-[#e8dcc8] border-b md:border-b-0 md:border-r border-[rgba(41,38,34,0.06)] p-6 md:p-8 flex items-center justify-center">
              <div className="text-center max-w-[240px]">
                <div className="font-['Manrope'] font-semibold text-[11px] text-[#6d665d] tracking-[0.8px] uppercase mb-3">
                  Plotty Story
                </div>
                <div className="font-['Manrope'] font-bold text-[20px] text-[#23211e] leading-[1.3] tracking-[-0.3px] mb-3">
                  Капитан Марвел
                </div>
                <div className="font-['Manrope'] font-medium text-[13px] text-[#6d665d] leading-[1.5]">
                  Обложка появится автоматически, когда у первой главы будет иллюстрация.
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 md:p-8">
              {/* Category & Title */}
              <div className="mb-4 md:mb-6">
                <div className="font-['Manrope'] font-semibold text-[11px] text-[#6d665d] tracking-[0.8px] uppercase mb-2">
                  История
                </div>
                <h1 className="font-['Literata'] font-semibold text-[32px] md:text-[40px] lg:text-[48px] text-[#23211e] leading-[1.1] tracking-[-1.8px] mb-2 md:mb-3">
                  Капитан Марвел
                </h1>
                <div className="font-['Manrope'] font-medium text-[13px] text-[#9a9088]">
                  Обновлена 31.03.2026, 18:31:51
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                <span className="px-3 md:px-3.5 py-1.5 md:py-2 bg-[rgba(188,95,61,0.08)] rounded-xl font-['Manrope'] font-semibold text-[12px] md:text-[13px] text-[#bc5f3d]">
                  В процессе
                </span>
                <span className="px-3 md:px-3.5 py-1.5 md:py-2 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-medium text-[12px] md:text-[13px] text-[#6d665d]">
                  DC
                </span>
                <span className="px-3 md:px-3.5 py-1.5 md:py-2 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-medium text-[12px] md:text-[13px] text-[#6d665d]">
                  Драма
                </span>
                <span className="px-3 md:px-3.5 py-1.5 md:py-2 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-medium text-[12px] md:text-[13px] text-[#6d665d]">
                  NC-17
                </span>
                <span className="px-3 md:px-3.5 py-1.5 md:py-2 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-medium text-[12px] md:text-[13px] text-[#6d665d]">
                  Макси
                </span>
                <span className="px-3 md:px-3.5 py-1.5 md:py-2 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-medium text-[12px] md:text-[13px] text-[#6d665d]">
                  OOC
                </span>
              </div>

              {/* Actions & Social */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Link
                  to={`/story/1#chapter-1`}
                  className="w-full sm:w-auto px-5 md:px-6 py-2.5 md:py-3 bg-[#bc5f3d] hover:bg-[#a64f31] text-white rounded-xl font-['Manrope'] font-bold text-[14px] md:text-[15px] text-center shadow-[0px_8px_20px_rgba(188,95,61,0.20)] hover:shadow-[0px_12px_28px_rgba(188,95,61,0.28)] transition-all"
                >
                  Читать
                </Link>

                <div className="flex items-center gap-4 md:gap-5 w-full sm:w-auto justify-center sm:justify-start sm:ml-4">
                  <button className="flex items-center gap-2 text-[#6d665d] hover:text-[#bc5f3d] transition-colors">
                    <Heart size={18} md:size={20} />
                    <span className="font-['Manrope'] font-semibold text-[13px] md:text-[14px]">342</span>
                  </button>
                  <button className="flex items-center gap-2 text-[#6d665d] hover:text-[#bc5f3d] transition-colors">
                    <MessageCircle size={18} md:size={20} />
                    <span className="font-['Manrope'] font-semibold text-[13px] md:text-[14px]">89</span>
                  </button>
                  <div className="flex items-center gap-2 text-[#6d665d]">
                    <Eye size={18} md:size={20} />
                    <span className="font-['Manrope'] font-semibold text-[13px] md:text-[14px]">1847</span>
                  </div>
                  <button className="flex items-center gap-2 text-[#6d665d] hover:text-[#bc5f3d] transition-colors ml-2">
                    <Share2 size={16} md:size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button className="px-5 py-2.5 bg-white border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-bold text-[14px] text-[#23211e] hover:bg-[rgba(41,38,34,0.02)] transition-all">
            Описание
          </button>
          <button className="px-5 py-2.5 bg-[#bc5f3d] rounded-xl font-['Manrope'] font-bold text-[14px] text-white shadow-[0px_4px_12px_rgba(188,95,61,0.16)]">
            Главы
          </button>
        </div>

        {/* Chapters List */}
        <div className="space-y-3">
          {[
            { number: 1, title: 'Начало', updated: '31.03.2026, 18:32:01' },
            { number: 2, title: 'Путь героя', updated: '28.03.2026, 14:22:15' },
            { number: 3, title: 'Испытание', updated: '25.03.2026, 20:45:33' },
          ].map((chapter) => (
            <div
              key={chapter.number}
              className="bg-white/85 backdrop-blur-sm border border-[rgba(41,38,34,0.08)] rounded-2xl p-5 hover:shadow-[0px_8px_24px_rgba(46,35,23,0.08)] hover:border-[rgba(41,38,34,0.12)] transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-['Manrope'] font-bold text-[17px] text-[#23211e] tracking-[-0.3px] mb-1.5 group-hover:text-[#bc5f3d] transition-colors">
                    Глава {chapter.number}. {chapter.title}
                  </h3>
                  <p className="font-['Manrope'] font-medium text-[13px] text-[#9a9088]">
                    Обновлена {chapter.updated}
                  </p>
                </div>
                <Link
                  to={`/story/1#chapter-${chapter.number}`}
                  className="px-5 py-2.5 bg-[#bc5f3d] hover:bg-[#a64f31] text-white rounded-xl font-['Manrope'] font-bold text-[14px] shadow-[0px_6px_16px_rgba(188,95,61,0.18)] transition-all"
                >
                  Читать
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}