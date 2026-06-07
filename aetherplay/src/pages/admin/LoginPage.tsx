import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthStorage } from "../../utils/authStorage";
import { loginAdmin } from "../../utils/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (AuthStorage.isTokenValid()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginAdmin(username, password);
      AuthStorage.setToken(data.token);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-[radial-gradient(circle_at_top_right,var(--color-login-bg-start),var(--color-login-bg-end))] font-sans">
      <div className="bg-login-card backdrop-blur-[12px] p-10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/10 w-full max-w-[380px]">
        {/* Header */}
        <div className="text-center mb-[30px]">
          <div className="w-20 h-20 bg-admin-primary/10 rounded-full flex items-center justify-center mx-auto mb-[15px] border-2 border-admin-primary/30 overflow-hidden">
            <img
              src="/img/Lynae_icon.png"
              alt="Admin"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
          </div>
          <h1 className="text-white text-[26px] font-bold mb-2">
            Welcome Back
          </h1>
          <p className="text-admin-muted text-sm">
            Sign in to access admin panel
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-error text-sm px-4 py-3 rounded-lg mb-5 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-admin-muted text-[13px] mb-2 font-medium">
              Username
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full py-3 px-4 pl-[42px] bg-admin-input-bg border-2 border-admin-input-border rounded-lg text-white text-sm outline-none transition-all duration-300 focus:border-admin-primary focus:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
              />
              <i className="fa-solid fa-user absolute left-[15px] text-admin-icon-muted text-sm" />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-admin-muted text-[13px] mb-2 font-medium">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full py-3 px-4 pl-[42px] bg-admin-input-bg border-2 border-admin-input-border rounded-lg text-white text-sm outline-none transition-all duration-300 focus:border-admin-primary focus:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
              />
              <i className="fa-solid fa-lock absolute left-[15px] text-admin-icon-muted text-sm" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-[14px] bg-gradient-to-br from-admin-primary to-admin-primary-dark border-none rounded-lg text-white text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(139,92,246,0.4)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <i
              className={`fa-solid ${
                loading ? "fa-spinner animate-spin" : "fa-arrow-right"
              }`}
            />
            <span>{loading ? "Authenticating..." : "Login"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
