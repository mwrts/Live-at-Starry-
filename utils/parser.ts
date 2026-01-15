
import { MessageSegment, CharacterKey } from '../types';
// Fixed: CHARACTERS is exported from '../characters', not '../constants'
import { CHARACTERS } from '../characters';

export const parseCharacterSegments = (text: string): MessageSegment[] => {
  // Regex to find |||||NAME|||||
  const regex = /\|\|\|\|\|([A-Z-]+)\|\|\|\|\|/g;
  const segments: MessageSegment[] = [];
  
  let lastIndex = 0;
  let match;
  let currentCharacter: CharacterKey | null = null;

  while ((match = regex.exec(text)) !== null) {
    const name = match[1] as CharacterKey;
    
    // If we have a previous character, capture their content up to this new marker
    if (currentCharacter && lastIndex < match.index) {
      const content = text.substring(lastIndex, match.index).trim();
      if (content) {
        segments.push({ character: currentCharacter, content });
      }
    }
    
    currentCharacter = name;
    lastIndex = match.index + match[0].length;
  }

  // Capture the remaining text for the last character found
  if (currentCharacter && lastIndex < text.length) {
    const content = text.substring(lastIndex).trim();
    if (content) {
      segments.push({ character: currentCharacter, content });
    }
  }

  // Fallback if no markers were found
  if (segments.length === 0 && text.trim()) {
    segments.push({ character: 'NIJIKA', content: text.trim() });
  }

  return segments;
};
