
// Added CharacterKey type to represent valid character identifiers
export type CharacterKey = string;

export interface Character {
  id: string;
  name: string;
  avatar: string;
  color: string;
  description: string;
}

export interface MessageSegment {
  character: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  segments?: MessageSegment[];
  timestamp: string; // Using string for easier localstorage serialization
}

export interface AppSettings {
  useOpenRouter: boolean;
  openRouterKey: string;
  openRouterModel: string;
  contextLimit: number;
}
