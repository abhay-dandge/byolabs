import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { User } from '@byolabs/shared';
import { Loader2, Info, AlertTriangle } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
        };
        oauth2: {
          initCodeClient: (config: any) => { requestCode: () => void };
          initTokenClient: (config: any) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export const DEFAULT_GOOGLE_CLIENT_ID =
  '145989035319-kermjuheku4se52tnjd555ffhcr6ic0m.apps.googleusercontent.com';

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
  onSuccess: (data: { user: User; token: string }) => void;
  onError: (error: string) => void;
  onPending?: (message: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode = 'signin',
  onSuccess,
  onError,
  onPending,
}) => {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string>(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID
  );
  const [originNotice, setOriginNotice] = useState<string | null>(null);

  // Fetch live client configuration from backend API
  useEffect(() => {
    api
      .getGoogleConfig()
      .then((cfg) => {
        if (cfg.clientId) {
          setClientId(cfg.clientId);
        }
      })
      .catch(() => {
        // Fall back to pre-configured DEFAULT_GOOGLE_CLIENT_ID
      });
  }, []);

  // Check current host environment
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost =
    currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '0.0.0.0';
  const isProductionDomain = currentHost.includes('unnatidevelopment.in');
  const isRawIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(currentHost);

  const handleCredentialResponse = useCallback(
    async (credential: string) => {
      setLoading(true);
      setOriginNotice(null);
      try {
        const res = await api.googleLogin({ credential });
        onSuccess({ user: res.user, token: res.token });
      } catch (err: any) {
        if (err.message && err.message.includes('PENDING')) {
          if (onPending) {
            onPending(err.message);
          } else {
            onError(err.message);
          }
        } else {
          onError(err.message || 'Google authentication failed');
        }
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError, onPending]
  );

  const handleCodeResponse = useCallback(
    async (code: string) => {
      setLoading(true);
      setOriginNotice(null);
      try {
        const res = await api.googleLogin({ code, redirectUri: 'postmessage' });
        onSuccess({ user: res.user, token: res.token });
      } catch (err: any) {
        if (err.message && err.message.includes('PENDING')) {
          if (onPending) {
            onPending(err.message);
          } else {
            onError(err.message);
          }
        } else {
          onError(err.message || 'Google authentication failed');
        }
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError, onPending]
  );

  // Initialize Google One-Tap if script is available
  useEffect(() => {
    const activeId = clientId || DEFAULT_GOOGLE_CLIENT_ID;
    if (window.google?.accounts?.id && activeId) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeId,
          callback: (response: any) => {
            if (response.credential) {
              handleCredentialResponse(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Optionally prompt One-Tap on supported origins
        if (isProductionDomain || isLocalhost) {
          window.google.accounts.id.prompt();
        }
      } catch (e) {
        console.warn('[GoogleAuth] Google accounts ID init warning:', e);
      }
    }
  }, [clientId, handleCredentialResponse, isProductionDomain, isLocalhost]);

  // Main interactive click handler for Google button
  const handleGoogleClick = async () => {
    if (loading) return;
    setOriginNotice(null);

    const activeId = clientId || DEFAULT_GOOGLE_CLIENT_ID;

    // Check if user is accessing via raw IP address in production
    if (isRawIp) {
      setOriginNotice(
        "Google OAuth Security Policy: Google does not allow raw IP addresses (e.g. http://" +
          currentHost +
          ") as Authorized JavaScript Origins. Please access the platform via https://lab.unnatidevelopment.in or use Email/Password login."
      );
    }

    // Ensure GIS script is loaded
    if (!window.google?.accounts?.oauth2) {
      setLoading(true);
      let attempts = 0;
      while (!window.google?.accounts?.oauth2 && attempts < 15) {
        await new Promise((r) => setTimeout(r, 200));
        attempts++;
      }
      setLoading(false);
    }

    if (window.google?.accounts?.oauth2) {
      try {
        setLoading(true);

        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: activeId,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: (response: any) => {
            if (response.code) {
              handleCodeResponse(response.code);
            } else if (response.error) {
              setLoading(false);
              if (response.error === 'popup_closed_by_user') {
                return;
              }
              onError(response.error_description || response.error);
            }
          },
          error_callback: (err: any) => {
            setLoading(false);
            console.error('[GoogleOAuth] Popup error:', err);
            if (err?.type === 'popup_failed_to_open') {
              onError(
                'Google popup was blocked by your browser. Please allow popups for this site and click again.'
              );
            } else if (err?.type === 'popup_closed') {
              // User closed popup window
            } else {
              onError(err?.message || 'Google Sign-In popup failed to open');
            }
          },
        });

        client.requestCode();

        // Safety timeout to reset loading spinner if user dismisses popup outside callbacks
        setTimeout(() => {
          setLoading((prev) => (prev ? false : false));
        }, 8000);
        return;
      } catch (err: any) {
        setLoading(false);
        console.error('[GoogleOAuth] initCodeClient error:', err);
        onError(err.message || 'Failed to open Google Sign-In');
        return;
      }
    }

    // Fallback if Google library failed to load
    onError(
      'Google Identity Services library is not loaded yet. Please check your internet connection or ad-blocker.'
    );
  };

  // Helper for quick testing
  const handleDevQuickTest = async () => {
    setLoading(true);
    try {
      const res = await api.googleLogin({ demoEmail: 'abhay.d.patil96@gmail.com' });
      onSuccess({ user: res.user, token: res.token });
    } catch (err: any) {
      onError(err.message || 'Quick test login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Interactive Google Sign-In Button */}
      <button
        type="button"
        id="google-signin-btn"
        onClick={handleGoogleClick}
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/60 text-white font-medium text-sm shadow-md transition-all flex items-center justify-center space-x-3 group relative cursor-pointer active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait"
      >
        {loading ? (
          <div className="flex items-center space-x-2 text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Connecting to Google...</span>
          </div>
        ) : (
          <>
            {/* Google 4-Color Vector Logo */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-slate-200 group-hover:text-white transition-colors">
              {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
            </span>
          </>
        )}
      </button>

      {/* Helpful origin or security guidance notice */}
      {originNotice && (
        <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-800/70 text-amber-200 text-xs space-y-2">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Authorized Domain Notice</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                {originNotice}
              </p>
            </div>
          </div>
          <div className="pt-1.5 border-t border-amber-800/40 flex items-center justify-between">
            <span className="text-[11px] text-amber-300/70">Or test with configured user:</span>
            <button
              type="button"
              onClick={handleDevQuickTest}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-medium transition cursor-pointer"
            >
              Sign in as abhay.d.patil96@gmail.com
            </button>
          </div>
        </div>
      )}

      {/* Localhost Origin Notice */}
      {!originNotice && isLocalhost && (
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Localhost mode active</span>
          </div>
          <button
            type="button"
            onClick={handleDevQuickTest}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
          >
            Quick test login
          </button>
        </div>
      )}
    </div>
  );
};
