import { initials } from '../lib/money';
import { signInMock, signOut } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useUiStore } from '../ui/store';

export function AuthActions() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const pushToast = useUiStore((state) => state.pushToast);

  if (auth.status === 'loading') {
    return <p className="muted header-note">Checking sign-in…</p>;
  }

  if (auth.user) {
    return (
      <div className="user-chip">
        {auth.user.avatarUrl ? (
          <img src={auth.user.avatarUrl} alt="" width={32} height={32} />
        ) : (
          <span className="avatar" aria-hidden="true">{initials(auth.user.name)}</span>
        )}
        <span>{auth.user.name}</span>
        <button type="button" className="button secondary" onClick={() => void dispatch(signOut())}>
          Sign out
        </button>
      </div>
    );
  }

  async function signIn(): Promise<void> {
    const result = await dispatch(signInMock());
    if (signInMock.rejected.match(result)) {
      pushToast(typeof result.payload === 'string' ? result.payload : 'Demo sign-in failed', 'err');
    }
  }

  return (
    <div className="auth-actions">
      {auth.config.mock ? (
        <button type="button" className="button" onClick={() => void signIn()}>
          Continue as Avery
        </button>
      ) : null}
      {auth.config.github ? (
        <a className="button secondary" href="/auth/github">Sign in with GitHub</a>
      ) : null}
      {auth.status === 'error' ? <p className="muted">Sign-in is unavailable.</p> : null}
    </div>
  );
}
