import {useState, type FormEvent} from 'react';
import {ArrowRight, Lock, Mail, UserPlus} from 'lucide-react';
import {signIn, signUp, type AuthState} from '../lib/adminAuth';

interface LoginScreenProps {
  onSuccess: () => void;
}

type Mode = 'login' | 'setup';

export default function LoginScreen({onSuccess}: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setBusy(true);
    setError('');
    setInfo('');

    if (mode === 'setup') {
      const result = await signUp(email, password);
      setBusy(false);
      if (!result.ok) {
        setError(result.error ?? 'Could not create the account.');
        return;
      }
      if (result.needsConfirmation) {
        setInfo(
          `Account created. Open the confirmation link we sent to ${email.trim()}, then come back and log in.`,
        );
        setMode('login');
        setPassword('');
        return;
      }
      setPassword('');
      onSuccess();
      return;
    }

    const result: AuthState = await signIn(email, password);
    setBusy(false);

    if (result.authenticated) {
      setPassword('');
      onSuccess();
      return;
    }
    setError(result.error ?? 'Could not sign in.');
  };

  const isSetup = mode === 'setup';

  return (
    <div className="studio-login">
      <form className="studio-login__form" onSubmit={handleSubmit} noValidate>
        <span className="studio-login__eyebrow">Private Area</span>
        <h1 className="studio-login__title">{isSetup ? 'Create Admin Account' : 'Admin Panel'}</h1>
        <p className="studio-login__sub">
          {isSetup
            ? 'One-time setup. Use your own email and a password of 8+ characters.'
            : 'Sign in to manage your portfolio content.'}
        </p>

        <label className="studio-field-row" htmlFor="studio-email">
          <span className="studio-field-row__label">Email</span>
          <span className="studio-input-wrap">
            <Mail size={18} strokeWidth={2} aria-hidden="true" />
            <input
              id="studio-email"
              className="studio-input studio-input--icon"
              type="email"
              name="email"
              value={email}
              placeholder="you@example.com"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError('');
                if (info) setInfo('');
              }}
            />
          </span>
        </label>

        <label className="studio-field-row" htmlFor="studio-password">
          <span className="studio-field-row__label">
            Password
            {isSetup ? <span className="studio-field-row__hint">At least 8 characters.</span> : null}
          </span>
          <span className="studio-input-wrap">
            <Lock size={18} strokeWidth={2} aria-hidden="true" />
            <input
              id="studio-password"
              className="studio-input studio-input--icon"
              type="password"
              name="password"
              value={password}
              placeholder={isSetup ? 'Create a password' : 'Enter password'}
              autoComplete={isSetup ? 'new-password' : 'current-password'}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
                if (info) setInfo('');
              }}
            />
          </span>
        </label>

        <button type="submit" className="studio-btn studio-btn--block" disabled={busy}>
          <span>
            {busy ? (isSetup ? 'Creating…' : 'Signing in…') : isSetup ? 'Create account' : 'Login'}
          </span>
          {isSetup ? (
            <UserPlus size={18} strokeWidth={2} aria-hidden="true" />
          ) : (
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          )}
        </button>

        {error ? (
          <p className="studio-error" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="studio-saved" role="status">
            {info}
          </p>
        ) : null}

        <button
          type="button"
          className="studio-linkbtn"
          onClick={() => switchMode(isSetup ? 'login' : 'setup')}
        >
          {isSetup ? 'Already have an account? Login' : 'First time here? Create admin account'}
        </button>
      </form>
    </div>
  );
}
