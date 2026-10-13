import {useState} from 'react';
import {changePassword, sendResetEmail} from '../../lib/adminAuth';

interface SettingsSectionProps {
  email: string | null;
}

type Tone = 'ok' | 'bad';
type Tab = 'change' | 'forgot';

export default function SettingsSection({email}: SettingsSectionProps) {
  const [tab, setTab] = useState<Tab>('change');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState(email ?? '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{tone: Tone; text: string} | null>(null);

  const flash = (tone: Tone, text: string) => {
    setNotice({tone, text});
    window.setTimeout(() => setNotice(null), 6000);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      flash('bad', 'New password and confirm password do not match.');
      return;
    }
    setBusy(true);
    const result = await changePassword(currentPassword, newPassword);
    setBusy(false);

    if (!result.ok) {
      flash('bad', result.error);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    flash('ok', 'Password updated.');
  };

  const handleReset = async () => {
    if (resetEmail.trim() === '') {
      flash('bad', 'Enter the email address to send the reset link to.');
      return;
    }
    setBusy(true);
    const result = await sendResetEmail(resetEmail);
    setBusy(false);
    flash(result.ok ? 'ok' : 'bad', result.ok ? 'Reset link sent. Check your inbox.' : result.error);
  };

  return (
    <div className="studio-editor">
      <div className="studio-pilltabs" role="tablist" aria-label="Account settings">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'change'}
          className={`studio-pilltab ${tab === 'change' ? 'studio-pilltab--active' : ''}`}
          onClick={() => setTab('change')}
        >
          Change password
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'forgot'}
          className={`studio-pilltab ${tab === 'forgot' ? 'studio-pilltab--active' : ''}`}
          onClick={() => setTab('forgot')}
        >
          Forgot password
        </button>
      </div>

      {tab === 'change' ? (
        <fieldset className="studio-group">
          <legend className="studio-group__legend">Change password</legend>
          <p className="studio-note">
            Signed in as {email ?? 'Unknown'}. Your current password is checked before the new one is
            saved.
          </p>

          <label className="studio-field-row">
            <span className="studio-field-row__label">Current password</span>
            <input
              className="studio-input"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>

          <label className="studio-field-row">
            <span className="studio-field-row__label">
              New password
              <span className="studio-field-row__hint">At least 8 characters.</span>
            </span>
            <input
              className="studio-input"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>

          <label className="studio-field-row">
            <span className="studio-field-row__label">Confirm new password</span>
            <input
              className="studio-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          <div className="studio-savebar">
            <button
              type="button"
              className="studio-btn"
              onClick={handleChangePassword}
              disabled={busy || currentPassword === '' || newPassword === '' || confirmPassword === ''}
            >
              <span>{busy ? 'Updating…' : 'Update password'}</span>
            </button>
          </div>

          <button type="button" className="studio-linkbtn" onClick={() => setTab('forgot')}>
            Current password bhool gaye? Forgot password
          </button>
        </fieldset>
      ) : (
        <fieldset className="studio-group">
          <legend className="studio-group__legend">Forgot password</legend>
          <p className="studio-note">
            Enter your account email and we will send a reset link. It opens this admin page so you can
            set a new password.
          </p>

          <label className="studio-field-row">
            <span className="studio-field-row__label">Account email</span>
            <input
              className="studio-input"
              type="email"
              autoComplete="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
            />
          </label>

          <div className="studio-savebar">
            <button type="button" className="studio-btn studio-btn--secondary" onClick={handleReset} disabled={busy}>
              <span>{busy ? 'Sending…' : 'Send reset link'}</span>
            </button>
          </div>
        </fieldset>
      )}

      {notice ? (
        <p className={notice.tone === 'ok' ? 'studio-saved' : 'studio-error'} role="status">
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}