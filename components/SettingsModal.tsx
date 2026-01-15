
import React from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  onClose: () => void;
  onResetSession: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, setSettings, onClose, onResetSession }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">AI Settings</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
            <div>
              <p className="text-white text-sm font-medium">Use OpenRouter</p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Override Gemini API</p>
            </div>
            <button 
              onClick={() => setSettings({ ...settings, useOpenRouter: !settings.useOpenRouter })}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.useOpenRouter ? 'bg-blue-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.useOpenRouter ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">OpenRouter API Key</label>
            <input 
              type="password"
              value={settings.openRouterKey}
              onChange={(e) => setSettings({ ...settings, openRouterKey: e.target.value })}
              placeholder="sk-or-v1-..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Model Name</label>
            <input 
              type="text"
              value={settings.openRouterModel}
              onChange={(e) => setSettings({ ...settings, openRouterModel: e.target.value })}
              placeholder="google/gemini-2.0-flash-exp:free"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-3">
          <button 
            onClick={() => {
              if (confirm("This will clear all chat history and the current scenario. Are you sure?")) {
                onResetSession();
              }
            }}
            className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-200 font-medium rounded-xl transition-all"
          >
            Reset Session
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
