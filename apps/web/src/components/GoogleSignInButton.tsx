import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { User } from '@byolabs/shared';
import { Loader2, AlertCircle, Info } from 'lucide-react';

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
    import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  );
  const [gsiReady, setGsiReady] = useState(false);
  const [originNotice, setOriginNotice] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic config if needed
  useEffect(() => {
    api.getGoogleConfig()
      .then((cfg) => {
        if (cfg.clientId) {
          setClientId(cfg.clientId);
        }
      })
      .catch(() => {
        // Fall back to pre-configured client id
      });
  }, []);

  // Check if running on localhost to display helpful guidance if origin not in GCP
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '5173');

  const handleCredentialResponse = async (credential: string) => {
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
  };

  const handleCodeResponse = async (code: string) => {
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
  };

  // Initialize GIS library when available
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let attempts = 0;

    const setupGoogle = () => {
      if (window.google?.accounts?.id && clientId) {
        clearInterval(checkInterval);
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response.credential) {
                handleCredentialResponse(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(containerRef.current, {
              theme: 'filled_black',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: mode === 'signup' ? 'signup_with' : 'signin_with',
              logo_alignment: 'left',
              width: 384,
            });
          }
          setGsiReady(true);
        } catch (e) {
          console.error('Google accounts ID init error:', e);
        }
      } else if (attempts > 30) {
        clearInterval(checkInterval);
      }
      attempts++;
    };

    checkInterval = setInterval(setupGoogle, 200);
    setupGoogle();

    return () => clearInterval(checkInterval);
  }, [clientId, mode]);

  // Click handler for custom styled button
  const handleCustomGoogleClick = () => {
    setOriginNotice(null);

    // If Google OAuth2 popup client is available, trigger popup
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: (response: any) => {
            if (response.code) {
              handleCodeResponse(response.code);
            } else if (response.error) {
              if (response.error === 'popup_closed_by_user') {
                return;
              }
              onError(response.error_description || response.error);
            }
          },
          error_callback: (err: any) => {
            console.error('Google popup error:', err);
            if (isLocalhost && err?.type === 'popup_failed_to_open') {
              setOriginNotice(
                "Localhost Origin Notice: 'http://localhost:5173' is not yet in GCP Authorized JavaScript Origins (only 'https://lab.unnatidevelopment.in' is registered). You can test locally using the quick-test option below."
              );
            } else {
              onError(err?.message || 'Google Sign-In popup was blocked or failed');
            }
          },
        });
        client.requestCode();
        return;
      } catch (err: any) {
        console.warn('initCodeClient error:', err);
      }
    }

    // Fallback: prompt Google One-Tap or show notice
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          if (isLocalhost) {
            setOriginNotice(
              "Localhost Notice: 'http://localhost:5173' is not yet in GCP Authorized JavaScript Origins (only 'https://lab.unnatidevelopment.in' is registered in Google Cloud Console project gdg-test-458407)."
            );
          }
        }
      });
    } else {
      onError('Google Sign-In service is loading. Please check your internet connection.');
    }
  };

  // Helper for local development testing with the user's pre-configured account
  const handleDevQuickTest = async () => {
    setLoading(true);
    try {
      const res = await api.googleLogin({ demoEmail: 'abhay.d.patil96@gmail.com' });
      onSuccess({ user: res.user, token: res.token });
    } catch (err: any) {
      onError(err.message || 'Local test login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Official Google Identity Services Container */}
      <div
        ref={containerRef}
        className={`flex justify-center w-full min-h-[44px] overflow-hidden rounded-xl ${!gsiReady ? 'hidden' : ''}`}
      />

      {/* Fallback Custom Google Button (active when GIS is loading) */}
      {!gsiReady && (
        <button
          type="button"
          onClick={handleCustomGoogleClick}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-950/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/50 text-white font-medium text-sm shadow-md transition-all flex items-center justify-center space-x-3 group relative overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center space-x-2 text-slate-300">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Verifying with Google...</span>
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
      )}

      {/* Localhost Origin Notice & Developer Quick-Test Option */}
      {originNotice && isLocalhost && (
        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-200 text-xs space-y-2">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Local Dev Origin Notice</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                The Google OAuth client is configured for{' '}
                <span className="font-mono text-white">https://lab.unnatidevelopment.in</span>. To test live Google
                popup on localhost, add <span className="font-mono text-white">http://localhost:5173</span> to{' '}
                <em>Authorized JavaScript origins</em> in Google Cloud Console (Project:{' '}
                <span className="font-mono text-cyan-300">gdg-test-458407</span>).
              </p>
            </div>
          </div>
          <div className="pt-1 border-t border-amber-800/40 flex items-center justify-between">
            <span className="text-[11px] text-amber-300/70">Test flow with configured account:</span>
            <button
              type="button"
              onClick={handleDevQuickTest}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-medium transition"
            >
              Sign in as abhay.d.patil96@gmail.com
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
