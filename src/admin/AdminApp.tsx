import {useEffect, useState} from 'react';
import LoginScreen from './LoginScreen';
import StudioDashboard from './StudioDashboard';
import {onAuthChange, signOut, type AuthState} from '../lib/adminAuth';

export default function AdminApp() {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    email: null,
    loading: true,
    error: null,
  });

  useEffect(() => onAuthChange(setState), []);

  const handleLogout = () => {
    void signOut().then(() => {
      setState({authenticated: false, email: null, loading: false, error: null});
    });
  };

  if (state.loading) {
    return (
      <div className="studio-boot">
        <p className="studio-boot__text">Checking your session…</p>
      </div>
    );
  }

  if (!state.authenticated) {
    return <LoginScreen onSuccess={() => setState((s) => ({...s, authenticated: true}))} />;
  }

  return <StudioDashboard onLogout={handleLogout} email={state.email} />;
}
