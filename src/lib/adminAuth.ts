import {supabase} from './supabase';

export interface AuthState {
  authenticated: boolean;
  email: string | null;
  loading: boolean;
  /** Set when sign-in failed, or when Supabase has no admin user configured yet. */
  error: string | null;
}

const INITIAL: AuthState = {authenticated: false, email: null, loading: true, error: null};

export function onAuthChange(listener: (state: AuthState) => void): () => void {
  if (!supabase) {
    listener({...INITIAL, loading: false, error: 'Supabase is not configured.'});
    return () => {};
  }

  const apply = (session: {user?: {email?: string} | null} | null) => {
    listener({
      authenticated: !!session,
      email: session?.user?.email ?? null,
      loading: false,
      error: null,
    });
  };

  void supabase.auth.getSession().then(({data}) => apply(data.session));

  const {data: sub} = supabase.auth.onAuthStateChange((_event, session) => apply(session));
  return () => sub.subscription.unsubscribe();
}

export async function signIn(email: string, password: string): Promise<AuthState> {
  if (!supabase) return {...INITIAL, loading: false, error: 'Supabase is not configured.'};

  const {data, error} = await supabase.auth.signInWithPassword({email: email.trim(), password});
  if (error) {
    const invalid = /invalid login credentials/i.test(error.message);
    return {
      authenticated: false,
      email: null,
      loading: false,
      error: invalid ? 'Incorrect email or password.' : error.message,
    };
  }
  return {authenticated: true, email: data.user?.email ?? null, loading: false, error: null};
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

export interface SignUpResult {
  ok: boolean;
  /** True when Supabase sent a confirmation email and no session exists yet. */
  needsConfirmation: boolean;
  error?: string;
}

/**
 * First-run account creation. Relies on Supabase email confirmation being ON
 * (the default) so that an unconfirmed signup can never obtain a session.
 */
export async function signUp(email: string, password: string): Promise<SignUpResult> {
  if (!supabase) return {ok: false, needsConfirmation: false, error: 'Supabase is not configured.'};
  if (password.length < 8) {
    return {ok: false, needsConfirmation: false, error: 'Password must be at least 8 characters.'};
  }

  const {data, error} = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {emailRedirectTo: `${window.location.origin}/admin`},
  });

  if (error) {
    if (/already (registered|been registered|exists)/i.test(error.message)) {
      return {
        ok: false,
        needsConfirmation: false,
        error: 'An account already exists for this email. Use Login instead.',
      };
    }
    return {ok: false, needsConfirmation: false, error: error.message};
  }
  return {ok: true, needsConfirmation: data.session === null};
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ok: true} | {ok: false; error: string}> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured.'};
  if (newPassword.length < 8) return {ok: false, error: 'New password must be at least 8 characters.'};
  if (currentPassword === newPassword) {
    return {ok: false, error: 'New password must be different from the current one.'};
  }

  const {data: sessionData} = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return {ok: false, error: 'Your session expired. Please log in again.'};

  // Re-verify the current password first so a hijacked session cannot lock you
  // out of your own account.
  const {error: verifyError} = await supabase.auth.signInWithPassword({
    email: session.user?.email ?? '',
    password: currentPassword,
  });
  if (verifyError) return {ok: false, error: 'Current password is incorrect.'};

  const {error} = await supabase.auth.updateUser({password: newPassword});
  if (error) return {ok: false, error: error.message};
  return {ok: true};
}

export async function sendResetEmail(email: string): Promise<{ok: true} | {ok: false; error: string}> {
  if (!supabase) return {ok: false, error: 'Supabase is not configured.'};
  const {error} = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/admin`,
  });
  // Always report success so this endpoint cannot be used to discover which
  // email addresses have an account.
  if (error && /rate limit|too many/i.test(error.message)) {
    return {ok: false, error: 'Too many reset emails requested. Please try again in a few minutes.'};
  }
  return {ok: true};
}
