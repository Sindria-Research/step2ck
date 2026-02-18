/**
 * Placeholder for future Google Sign-In. Backend POST /auth/google is ready;
 * wire this up when GOOGLE_CLIENT_ID is configured and you want to enable it.
 */
export function GoogleLoginButton() {
  return (
    <button
      type="button"
      disabled
      className="btn btn-secondary w-full focus-ring opacity-70 cursor-not-allowed"
      aria-disabled="true"
      title="Coming soon"
    >
      Sign in with Google (coming soon)
    </button>
  );
}
