import { Search } from 'lucide-react';
import { Header } from '../components/Header';
import { FilterSidebar } from '../components/FilterSidebar';
import { StoryCard } from '../components/StoryCard';
import { MobileStoryCard } from '../components/MobileStoryCard';
import { MobileFilterButton } from '../components/MobileFilterButton';

export default function Catalog() {
  const stories = [
    {
      id: '1',
      title: 'Капитан Марвел',
      fandom: 'DC',
      genre: 'Драма',
      rating: 'NC-17',
      status: 'В процессе',
      tags: ['Макси', 'Мистика', 'NC-21'],
      chapters: 8,
      likes: 342,
      comments: 89,
      views: 1847,
      created: '31.01.2026',
      updated: '31.03.2026',
      coverImage: 'https://images.unsplash.com/photo-1652258249953-729e2bd7d1aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwc3Vuc2V0JTIwY2FtcGZpcmUlMjB3YXJyaW9yfGVufDF8fHx8MTc3NTY1ODcyOHww&ixlib=rb-4.1.0&q=80&w=400',
    },
    {
      id: '2',
      title: 'Перевал',
      fandom: 'Ведьмак',
      genre: 'Фэнтези',
      rating: 'NC-21',
      status: 'В процессе',
      tags: ['Драма', 'Мистика', 'Дрэббл'],
      chapters: 5,
      likes: 156,
      comments: 43,
      views: 892,
      created: '27.02.2026',
      updated: '30.03.2026',
    },
    {
      id: '3',
      title: 'Тайны Хогвартса',
      fandom: 'Harry Potter',
      genre: 'Приключения',
      rating: 'PG-13',
      status: 'Завершён',
      tags: ['Макси', 'Юмор', 'OOC'],
      chapters: 24,
      likes: 1247,
      comments: 312,
      views: 5234,
      created: '15.11.2025',
      updated: '28.03.2026',
      coverImage: 'https://images.unsplash.com/photo-1569586858955-9c81683468fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwbGlicmFyeSUyMG1hZ2ljJTIwYm9va3N8ZW58MXx8fHwxNzc1NjU4NzMxfDA&ixlib=rb-4.1.0&q=80&w=400',
    },
  ];

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(rgb(228, 221, 210) 0%, rgb(217, 210, 196) 100%)',
    }}>
      <Header />
      
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 pb-24 lg:pb-8">
        {/* Search Bar */}
        <div className="mb-6 md:mb-8">
          <div className="relative max-w-3xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6d665d]" size={20} />
            <input
              type="text"
              placeholder="Поиск по названию истории"
              className="w-full pl-12 pr-4 py-3 md:py-4 bg-white/90 backdrop-blur-sm border border-[rgba(41,38,34,0.08)] rounded-2xl font-['Manrope'] font-medium text-[14px] md:text-[15px] text-[#23211e] placeholder:text-[#9a9088] focus:outline-none focus:border-[#bc5f3d] focus:ring-2 focus:ring-[rgba(188,95,61,0.10)] transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex gap-8 items-start">
          {/* Filters - Desktop Only */}
          <div className="hidden lg:block">
            <FilterSidebar />
          </div>

          {/* Stories List */}
          <div className="flex-1">
            <div className="mb-4 md:mb-6">
              <h2 className="font-['Manrope'] font-semibold text-[14px] text-[#6d665d] tracking-[0.3px]">
                Найдено 2 истории
              </h2>
            </div>

            {/* Desktop Cards */}
            <div className="hidden md:block space-y-4">
              {stories.map((story) => (
                <StoryCard key={story.id} {...story} />
              ))}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {stories.map((story) => (
                <MobileStoryCard key={story.id} {...story} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-[rgba(41,38,34,0.08)] px-2 py-2.5 z-50" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgba(188,95,61,0.08)]">
            <Search size={20} className="text-[#bc5f3d]" strokeWidth={2.5} />
            <span className="font-['Manrope'] font-bold text-[10.5px] text-[#bc5f3d] tracking-[0.2px]">
              Каталог
            </span>
          </button>
          <button className="flex flex-col items-center gap-1.5 px-3 py-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#6d665d]">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span className="font-['Manrope'] font-semibold text-[10.5px] text-[#6d665d] tracking-[0.2px]">
              Мастерская
            </span>
          </button>
          <button className="flex flex-col items-center gap-1.5 px-3 py-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#6d665d]">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="font-['Manrope'] font-semibold text-[10.5px] text-[#6d665d] tracking-[0.2px]">
              Профиль
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Filter Button */}
      <MobileFilterButton />
    </div>
  );
}