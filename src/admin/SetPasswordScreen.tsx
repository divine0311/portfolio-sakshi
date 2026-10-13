import {useState, type FormEvent} from 'react';
import {KeyRound} from 'lucide-react';
import {setNewPassword, signOut} from '../lib/adminAuth';

interface SetPasswordScreenProps {
  onDone: () => void;
}

export default function SetPasswordScreen({onDone}: SetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    setError('');
    const result = await setNewPassword(password);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDone(true);
    window.setTimeout(onDone, 1500);
  };

  return (
    <div className="studio-login">
      <form className="studio-login__form" onSubmit={handleSubmit} noValidate>
        <span className="studio-login__eyebrow">Password Reset</span>
        <h1 className="studio-login__title">Set a new password</h1>
        <p className="studio-login__sub">
          {done
            ? 'Password updated. Taking you back…'
            : 'Choose a new password for your admin account.'}
        </p>

        <label className="studio-field-row" htmlFor="studio-new-password">
          <span className="studio-field-row__label">
            New password
            <span className="studio-field-row__hint">At least 8 characters.</span>
          </span>
          <span className="studio-input-wrap">
            <KeyRound size={18} strokeWidth={2} aria-hidden="true" />
            <input
              id="studio-new-password"
              className="studio-input studio-input--icon"
              type="password"
              name="new-password"
              value={password}
              placeholder="Enter new password"
              autoComplete="new-password"
              disabled={done}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
              }}
            />
          </span>
        </label>

        <label className="studio-field-row" htmlFor="studio-confirm-password">
          <span className="studio-field-row__label">Confirm new password</span>
          <span className="studio-input-wrap">
            <KeyRound size={18} strokeWidth={2} aria-hidden="true" />
            <input
              id="studio-confirm-password"
              className="studio-input studio-input--icon"
              type="password"
              name="confirm-password"
              value={confirm}
              placeholder="Repeat new password"
              autoComplete="new-password"
              disabled={done}
              onChange={(event) => {
                setConfirm(event.target.value);
                if (error) setError('');
              }}
            />
          </span>
        </label>

        <button type="submit" className="studio-btn studio-btn--block" disabled={busy || done}>
          <span>{busy ? 'Updating…' : done ? 'Password updated' : 'Update password'}</span>
        </button>

        {error ? (
          <p className="studio-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="studio-linkbtn"
          disabled={done}
          onClick={() => {
            void signOut();
            onDone();
          }}
        >
          Cancel and go back
        </button>
      </form>
    </div>
  );
}