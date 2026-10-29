import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, X, ExternalLink, Key, Server, Save } from 'lucide-react';
import { dbStorage } from '../services/storage';
import { SupabaseConfig } from '../types/inquiry';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = dbStorage.getSupabaseConfig();

  const [dbUrl, setDbUrl] = useState(currentConfig.database_url || '');
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.supabase_url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.supabase_anon_key || '');
  const [useDirect, setUseDirect] = useState(currentConfig.use_direct_supabase || false);

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    dbStorage.setSupabaseConfig({
      database_url: dbUrl,
      supabase_url: supabaseUrl,
      supabase_anon_key: anonKey,
      use_direct_supabase: useDirect,
    });
    onConfigUpdated();
    onClose();
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl || !anonKey) {
      setTestStatus('error');
      setTestMessage('Please provide both Supabase URL and Anon Public Key to test direct connection.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Pinging Supabase REST endpoint...');

    try {
      const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      if (res.ok || res.status === 200 || res.status === 404) {
        setTestStatus('success');
        setTestMessage('Connection to Supabase successfully verified!');
      } else {
        setTestStatus('error');
        setTestMessage(`Supabase returned status ${res.status}. Please check your Anon Key and Project URL.`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Network check failed: ${err.message || 'CORS or domain unreachable'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Supabase & PostgreSQL Database Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Manage backend connection strings and live Supabase synchronization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* PostgreSQL Connection String (Standard backend format) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Standard PostgreSQL Database URL (Backend Engine)
            </label>
            <div className="relative">
              <Server className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Used by FastAPI SQLAlchemy backend with psycopg2 connection pooling.
            </span>
          </div>

          {/* Direct Supabase REST Credentials (Optional for Live Demo) */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Direct Supabase Live Sync (Optional)
                </span>
                <span className="text-[11px] text-slate-500">
                  Enable live write/read directly to your Supabase project in this browser session.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDirect}
                  onChange={(e) => setUseDirect(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {useDirect && (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                  >
                    {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                  </button>

                  {testStatus === 'success' && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                {testMessage && (
                  <p className={`text-xs mt-1 ${testStatus === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
                    {testMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Database Setup Notice */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-900">
            <span className="font-semibold block mb-0.5">Assessment Database Schema:</span>
            <span>
              Execute <code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded">schema.sql</code> in the Supabase SQL editor to create the required <code className="font-mono">inquiries</code> and <code className="font-mono">admins</code> tables.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
