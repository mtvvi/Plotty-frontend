import { Link, useLocation } from 'react-router';
import { Menu } from 'lucide-react';

export function Header() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-[12px] bg-[rgba(247,242,234,0.82)] border-b border-[rgba(41,38,34,0.08)]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="font-['Literata'] font-bold text-[26px] md:text-[32px] text-[#23211e] tracking-[-1.2px]">
              Plotty
            </span>
          </Link>

          {/* Navigation - Desktop Only */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl font-['Manrope'] font-semibold text-[14px] transition-all ${
                isActive('/')
                  ? 'bg-[rgba(188,95,61,0.08)] text-[#bc5f3d]'
                  : 'text-[#23211e] hover:bg-[rgba(41,38,34,0.04)]'
              }`}
            >
              Каталог
            </Link>
            <Link
              to="/workshop"
              className={`px-4 py-2 rounded-xl font-['Manrope'] font-semibold text-[14px] transition-all ${
                isActive('/workshop')
                  ? 'bg-[rgba(188,95,61,0.08)] text-[#bc5f3d]'
                  : 'text-[#23211e] hover:bg-[rgba(41,38,34,0.04)]'
              }`}
            >
              Мастерская
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden sm:block font-['Manrope'] font-semibold text-[13px] md:text-[14px] text-[#6d665d]">
              ilya
            </span>
            <button className="px-3 md:px-4 py-1.5 md:py-2 bg-white/90 border border-[rgba(41,38,34,0.10)] rounded-xl font-['Manrope'] font-bold text-[13px] md:text-[14px] text-[#23211e] hover:bg-white transition-all">
              Выйти
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}