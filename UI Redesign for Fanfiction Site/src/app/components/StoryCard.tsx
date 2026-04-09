import { Heart, MessageCircle, Eye } from 'lucide-react';
import { Link } from 'react-router';

interface StoryCardProps {
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

export function StoryCard({ 
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
  created, 
  updated,
  coverImage 
}: StoryCardProps) {
  return (
    <div className="group bg-white/85 backdrop-blur-sm border border-[rgba(41,38,34,0.08)] rounded-2xl overflow-hidden hover:shadow-[0px_12px_32px_rgba(46,35,23,0.10)] hover:border-[rgba(41,38,34,0.12)] transition-all duration-300">
      <div className="flex gap-5 p-5">
        {/* Cover Image */}
        <div className="flex-shrink-0">
          <div className="w-32 h-44 bg-gradient-to-br from-[#f0e8db] to-[#e8dcc8] rounded-xl overflow-hidden border border-[rgba(41,38,34,0.06)]">
            {coverImage ? (
              <img src={coverImage} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <span className="font-['Manrope'] font-semibold text-[10px] text-[#6d665d] tracking-[0.5px] uppercase mb-2">
                  Plotty Story
                </span>
                <span className="font-['Manrope'] font-bold text-[13px] text-[#23211e] leading-[1.3]">
                  {title}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Title & Meta */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <Link 
                  to={`/story/${id}`}
                  className="inline-block group-hover:text-[#bc5f3d] transition-colors"
                >
                  <h3 className="font-['Literata'] font-semibold text-[22px] text-[#23211e] leading-[1.2] tracking-[-0.4px] mb-1.5 truncate">
                    {title}
                  </h3>
                </Link>
                <p className="font-['Manrope'] font-medium text-[13px] text-[#6d665d] mb-3">
                  {fandom} · {genre} · {chapters} {chapters === 1 ? 'глава' : 'главы'}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1.5 bg-[rgba(188,95,61,0.08)] rounded-full font-['Manrope'] font-semibold text-[12px] text-[#bc5f3d]">
                {status}
              </span>
              <span className="px-3 py-1.5 bg-white border border-[rgba(41,38,34,0.10)] rounded-full font-['Manrope'] font-medium text-[12px] text-[#6d665d]">
                {rating}
              </span>
              {tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag}
                  className="px-3 py-1.5 bg-white border border-[rgba(41,38,34,0.10)] rounded-full font-['Manrope'] font-medium text-[12px] text-[#6d665d]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Footer: Social metrics & Date */}
          <div className="flex items-center justify-between pt-3 border-t border-[rgba(41,38,34,0.06)]">
            {/* Social Metrics */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[#6d665d] hover:text-[#bc5f3d] transition-colors cursor-pointer">
                <Heart size={16} />
                <span className="font-['Manrope'] font-semibold text-[13px]">{likes}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#6d665d] hover:text-[#bc5f3d] transition-colors cursor-pointer">
                <MessageCircle size={16} />
                <span className="font-['Manrope'] font-semibold text-[13px]">{comments}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#6d665d]">
                <Eye size={16} />
                <span className="font-['Manrope'] font-semibold text-[13px]">{views}</span>
              </div>
            </div>

            {/* Date */}
            <div className="font-['Manrope'] font-medium text-[12px] text-[#9a9088]">
              Обновлена {updated}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0 flex items-center">
          <Link
            to={`/story/${id}`}
            className="px-5 py-2.5 bg-[#bc5f3d] hover:bg-[#a64f31] text-white rounded-xl font-['Manrope'] font-bold text-[14px] shadow-[0px_8px_20px_rgba(188,95,61,0.20)] hover:shadow-[0px_12px_28px_rgba(188,95,61,0.28)] transition-all"
          >
            Открыть историю
          </Link>
        </div>
      </div>
    </div>
  );
}
