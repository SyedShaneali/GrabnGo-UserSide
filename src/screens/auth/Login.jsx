import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLogin } from "../../hooks/useLogin";
import { saveAccount } from "../../utlls/Accounts";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState("");
  const [password, setPassword] = useState("");

  const { login, loading, error, errorCode } = useLogin();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login({ credentials, password });
    if (result.success) {
      // Adds this user to the saved accounts list and makes them the active one
      // (also keeps token / user_name / user_email / user_id in localStorage)
      saveAccount({
        id: result.data?.user_id,
        name: result.data?.user_name || "",
        email: result.data?.user_email || "",
        token: result.data?.access_token,
      });

      // TODO: change to the real home route once it exists
      navigate("/home");
    }
  };

  const handleVerifyEmailRedirect = () => {
    navigate("/verify-otp", { state: { credentials } });
  };

  return (
    <div className="min-h-screen flex font-sans">

      {/* Left Panel — hidden on small screens, visible from md up */}
      <div
        className="hidden md:flex flex-1 relative flex-col justify-center items-center px-8 lg:px-16 py-20 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0d8f7a 0%, #085041 100%)" }}
      >
        <div
          className="absolute w-80 h-80 rounded-full -top-16 -left-16"
          style={{ border: "60px solid rgba(255,255,255,0.06)" }}
        />
        <div
          className="absolute w-64 h-64 rounded-full -bottom-12 -right-12"
          style={{ border: "50px solid rgba(255,255,255,0.05)" }}
        />
        <div
          className="absolute w-36 h-36 rounded-full bottom-28 left-10"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />

        <div className="flex items-center gap-3 mb-12 z-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <span className="text-white text-xl font-extrabold tracking-tight">GrabnGo</span>
        </div>

        <div className="text-center z-10">
          <h1 className="text-white text-4xl lg:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            Welcome Back!
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm mx-auto mb-10">
            Log in to your GrabnGo account and pick up right where you left off.
          </p>
          {["Fast & easy checkout", "Track orders in real time", "Exclusive deals every day"].map((text) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-full px-5 py-3 mb-3 max-w-xs mx-auto"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-white/90 text-sm font-semibold">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — full width on mobile, fixed width from md up */}
      <div
        className="w-full md:w-[480px] flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-12 lg:py-16 bg-white"
        style={{ boxShadow: "-8px 0 40px rgba(0,0,0,0.06)" }}
      >
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            GrabnGo user login
          </h2>
          <p className="text-gray-400 text-sm">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleLogin}>

          {/* Credentials */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wide uppercase">
              Email or Phone
            </label>
            <input
              type="text"
              placeholder="you@example.com"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-700 bg-gray-50 outline-none focus:border-[#0d8f7a] focus:ring-2 focus:ring-[#0d8f7a]/20 transition-all placeholder-gray-300"
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wide uppercase">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pr-12 text-sm text-gray-700 bg-gray-50 outline-none focus:border-[#0d8f7a] focus:ring-2 focus:ring-[#0d8f7a]/20 transition-all placeholder-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                aria-label="Toggle password"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot */}
          <div className="text-right mb-7">
            <Link to="/forgot-password" className="text-[#0d8f7a] text-xs font-bold hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm font-medium">
              <p className="mb-2">{error}</p>
              {errorCode === 2000 && (
                <button
                  type="button"
                  onClick={handleVerifyEmailRedirect}
                  className="text-[#0d8f7a] font-bold text-sm hover:underline"
                >
                  Verify Email →
                </button>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold text-base rounded-xl py-4 mb-5 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: "#0d8f7a" }}
          >
            {loading && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            )}
            {loading ? "Logging in..." : "Log In"}
          </button>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-[#0d8f7a] font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}