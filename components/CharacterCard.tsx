
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CharacterKey } from '../types';
import { CHARACTERS } from '../characters';

interface CharacterCardProps {
  characterKey: CharacterKey;
  content: string;
  isLast?: boolean;
  onRegenerate?: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ characterKey, content, isLast, onRegenerate }) => {
  const char = CHARACTERS[characterKey] || CHARACTERS['NIJIKA'];
  const isNarrator = characterKey === 'NARRATOR';

  if (isNarrator) {
    return (
      <div className="group flex flex-col gap-2 mb-8 animate-fade-in last:mb-0">
        <div className="flex items-center justify-center gap-4">
          <div className="h-[1px] flex-1 bg-white/10"></div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
            {char.name}
          </span>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>
        <div className="text-center italic text-slate-400 text-sm md:text-base leading-relaxed px-4 md:px-12 markdown-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-2 mb-8 animate-fade-in last:mb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 shadow-sm" style={{ borderColor: char.color }}>
            <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: char.color }}>
              {char.name}
            </span>
            <div className="h-[1px] w-full opacity-20 mt-1" style={{ backgroundColor: char.color }}></div>
          </div>
        </div>
        
        {isLast && onRegenerate && (
          <button 
            onClick={onRegenerate}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-white/30 hover:text-white/60"
            title="Regenerate this response"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      <div className="pl-13 text-slate-200 text-sm md:text-base leading-relaxed markdown-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default CharacterCard;
