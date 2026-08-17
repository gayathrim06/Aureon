import React, { useState } from 'react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { platformSettings } from '../../services/mockData';
import { Settings, Key, Shield, Globe, Clock, Lock, Sun, Save, CheckCircle2 } from 'lucide-react';

export const PlatformSettings = ({ onShowToast }) => {
  const [settings, setSettings] = useState(platformSettings);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); onShowToast && onShowToast({ type: 'success', title: 'Settings Saved', message: 'Platform configuration updated successfully.' }); };
  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const sections = [
    { title: 'JWT Token Configuration', icon: Key, color: 'text-blue-500', fields: [
      { key: 'jwtAccessExpiry', label: 'Access Token Expiry', type: 'text' },
      { key: 'jwtRefreshExpiry', label: 'Refresh Token Expiry', type: 'text' }
    ]},
    { title: 'Password & Security Policy', icon: Lock, color: 'text-rose-500', fields: [
      { key: 'passwordMinLength', label: 'Minimum Password Length', type: 'number' },
      { key: 'passwordRequireUppercase', label: 'Require Uppercase Letter', type: 'toggle' },
      { key: 'passwordRequireSpecialChar', label: 'Require Special Character', type: 'toggle' }
    ]},
    { title: 'Rate Limiting & Lockout', icon: Shield, color: 'text-amber-500', fields: [
      { key: 'maxFailedLogins', label: 'Max Failed Logins Before Lockout', type: 'number' },
      { key: 'lockoutDuration', label: 'Account Lockout Duration', type: 'text' },
      { key: 'rateLimitWindow', label: 'Rate Limit Window', type: 'text' },
      { key: 'rateLimitMax', label: 'Max Requests Per Window', type: 'number' }
    ]},
    { title: 'Session & Display', icon: Clock, color: 'text-purple-500', fields: [
      { key: 'sessionTimeout', label: 'Session Timeout (seconds)', type: 'number' },
      { key: 'defaultTheme', label: 'Default Theme', type: 'select', options: ['dark', 'light'] },
      { key: 'mfaEnforced', label: 'Enforce MFA for All Users', type: 'toggle' },
      { key: 'auditRetentionDays', label: 'Audit Log Retention (days)', type: 'number' }
    ]}
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb activeTab="Platform Settings" />
      <div className="flex justify-between items-center">
        <div><h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-500" />Platform Configuration</h1><p className="text-xs text-gray-500">JWT expiry, password policy, rate limits, CORS, and display preferences.</p></div>
        <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-colors">
          {saved ? <><CheckCircle2 className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Configuration</>}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section, si) => {
          const SIcon = section.icon;
          return (
            <div key={si} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><SIcon className={`w-4 h-4 ${section.color}`} />{section.title}</h3>
              <div className="space-y-4">
                {section.fields.map(f => (
                  <div key={f.key} className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{f.label}</label>
                    {f.type === 'toggle' ? (
                      <button onClick={() => update(f.key, !settings[f.key])} className={`w-10 h-5 rounded-full transition-colors ${settings[f.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${settings[f.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    ) : f.type === 'select' ? (
                      <select value={settings[f.key]} onChange={(e) => update(f.key, e.target.value)} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs w-28">{f.options.map(o => <option key={o} value={o}>{o}</option>)}</select>
                    ) : (
                      <input type={f.type} value={settings[f.key]} onChange={(e) => update(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs w-32 text-right font-mono" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
