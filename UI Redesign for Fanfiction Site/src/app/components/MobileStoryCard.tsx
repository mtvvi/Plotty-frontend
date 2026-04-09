import { Heart, MessageCircle, Eye } from 'lucide-react';
import { Link } from 'react-router';

interface MobileStoryCardProps {
  id: string;
  title: string;
  fandom: string;
  genre: string;
  rating: string;
  status: string;
  tags: string[];
  chapters: number;
  likes: number;
  comments: number;
  views: number;
  created: string;
  updated: string;
  coverImage?: string;
}

export function MobileStoryCard({ 
  id, 
  title, 
  fandom, 
  genre, 
  rating, 
  status, 
  tags,
  chapters,
  likes, 
  comments, 
  views,
  updated,
  coverImage 
}: MobileStoryCardProps) {
  return (
    <Link to={`/story/${id}`}>
      <div className="bg-white/90 backdrop-blur-sm border border-[rgba(41,38,34,0.08)] rounded-2xl overflow-hidden active:scale-[0.98] transition-all">
        <div className="p-4">
          {/* Header with Cover */}
          <div className="flex gap-3 mb-3">
            {/* Cover */}
            <div className="flex-shrink-0">
              <div className="w-20 h-28 bg-gradient-to-br from-[#f0e8db] to-[#e8dcc8] rounded-lg overflow-hidden border border-[rgba(41,38,34,0.06)]">
                {coverImage ? (
                  <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                    <span className="font-['Manrope'] font-semibold text-[9px] text-[#6d665d] tracking-[0.4px] uppercase mb-1.5">
                      Plotty Story
                    </span>
                    <span className="font-['Manrope'] font-bold text-[10px] text-[#23211e] leading-[1.2] line-clamp-3">
                      {title}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-['Literata'] font-semibold text-[18px] text-[#23211e] leading-[1.2] tracking-[-0.3px] mb-2 line-clamp-2">
                {title}
              </h3>
              <p className="font-['Manrope'] font-medium text-[12px] text-[#6d665d] mb-2">
                {fandom} · {genre}
              </p>
              <p className="font-['Manrope'] font-medium text-[11px] text-[#9a9088]">
                {chapters} {chapters === 1 ? 'глава' : chapters < 5 ? 'главы' : 'глав'}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2.5 py-1 bg-[rgba(188,95,61,0.08)] rounded-lg font-['Manrope'] font-semibold text-[11px] text-[#bc5f3d]">
              {status}
            </span>
            <span className="px-2.5 py-1 bg-white border border-[rgba(41,38,34,0.10)] rounded-lg font-['Manrope'] font-medium text-[11px] text-[#6d665d]">
              {rating}
            </span>
            {tags.slice(0, 2).map((tag) => (
              <span 
                key={tag}
                className="px-2.5 py-1 bg-white border border-[rgba(41,38,34,0.10)] rounded-lg font-['Manrope'] font-medium text-[11px] text-[#6d665d]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[rgba(41,38,34,0.06)]">
            {/* Social Metrics */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[#6d665d]">
                <Heart size={14} />
                <span className="font-['Manrope'] font-semibold text-[12px]">{likes}</span>
              </div>
              <div className="flex items-center gap-1 text-[#6d665d]">
                <MessageCircle size={14} />
                <span className="font-['Manrope'] font-semibold text-[12px]">{comments}</span>
              </div>
              <div className="flex items-center gap-1 text-[#6d665d]">
                <Eye size={14} />
                <span className="font-['Manrope'] font-semibold text-[12px]">{views}</span>
              </div>
            </div>

            {/* Date */}
            <div className="font-['Manrope'] font-medium text-[11px] text-[#9a9088]">
              {updated}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
