import {useEffect, useState} from 'react';
import LoginScreen from './LoginScreen';
import SetPasswordScreen from './SetPasswordScreen';
import StudioDashboard from './StudioDashboard';
import {onAuthChange, onPasswordRecovery, signOut, type AuthState} from '../lib/adminAuth';

export default function AdminApp() {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    email: null,
    loading: true,
    error: null,
  });
  const [recovery, setRecovery] = useState(false);

  useEffect(() => onAuthChange(setState), []);
  useEffect(
    () =>
      onPasswordRecovery(() => {
        // Visiting a reset link grants a recovery session; force the
        // set-new-password flow instead of the normal dashboard.
        setRecovery(true);
      }),
    [],
  );

  const handleLogout = () => {
    void signOut().then(() => {
      setState({authenticated: false, email: null, loading: false, error: null});
      setRecovery(false);
    });
  };

  if (state.loading) {
    return (
      <div className="studio-boot">
        <p className="studio-boot__text">Checking your session…</p>
      </div>
    );
  }

  if (recovery || state.authenticated) {
    return recovery ? (
      <SetPasswordScreen onDone={() => setRecovery(false)} />
    ) : (
      <StudioDashboard onLogout={handleLogout} email={state.email} />
    );
  }

  return <LoginScreen onSuccess={() => setState((s) => ({...s, authenticated: true}))} />;
}