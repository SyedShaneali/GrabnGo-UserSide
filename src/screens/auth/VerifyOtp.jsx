import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useOtp } from "../../hooks/useOtp";

const OTP_LENGTH = 6;       // TODO: change if your backend sends a different length
const RESEND_SECONDS = 60;

const isEmail = (v) => /^\S+@\S+\.\S+$/.test((v || "").trim());

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-700 bg-gray-50 outline-none focus:border-[#0d8f7a] focus:ring-2 focus:ring-[#0d8f7a]/20 transition-all placeholder-gray-300";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { sendOtp, verifyOtp, sending, verifying, error, clearError } = useOtp();

  // Register and Login both navigate here with { credentials: <email> }
  const initialEmail = (state?.email ?? state?.credentials ?? "").trim();

  const [email, setEmail]       = useState(isEmail(initialEmail) ? initialEmail : "");
  const [step, setStep]         = useState(isEmail(initialEmail) ? "otp" : "email");
  const [digits, setDigits]     = useState(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [formError, setFormError] = useState("");

  const inputsRef = useRef([]);
  const sentOnMount = useRef(false);

  // Send the code once when we arrive with a known email
  // (ref guard stops React StrictMode from sending twice in dev)
  useEffect(() => {
    if (step !== "otp" || sentOnMount.current) return;
    sentOnMount.current = true;
    (async () => {
      const res = await sendOtp(email);
      if (res.success) {
        setCooldown(RESEND_SECONDS);
        toast.success("Verification code sent to your email");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Focus first box when the OTP step shows
  useEffect(() => {
    if (step === "otp") inputsRef.current[0]?.focus();
  }, [step]);

  /* ── email step (only when we arrived without a usable email) ── */
  const handleSendFromEmailStep = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    setFormError("");
    const res = await sendOtp(email.trim());
    if (res.success) {
      sentOnMount.current = true;
      setStep("otp");
      setCooldown(RESEND_SECONDS);
      toast.success("Verification code sent to your email");
    }
  };

  /* ── otp boxes ── */
  const handleChange = (i, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, idx) => (next[idx] = d));
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const resetBoxes = () => {
    setDigits(Array(OTP_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) {
      setFormError(`Please enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    setFormError("");

    const res = await verifyOtp({ email: email.trim(), otp });
    if (res.success) {
      toast.success("Email verified! You can now log in.");
      navigate("/", { replace: true });
    } else {
      resetBoxes();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || sending) return;
    setFormError("");
    const res = await sendOtp(email.trim());
    if (res.success) {
      setCooldown(RESEND_SECONDS);
      resetBoxes();
      toast.success("A new code has been sent");
    }
  };

  const shownError = formError || error;

  return (
    <div className="min-h-screen flex font-sans">

      {/* Left Panel */}
      <div
        className="hidden md:flex md:w-1/2 relative flex-col justify-center items-center px-8 lg:px-16 py-20 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0d8f7a 0%, #085041 100%)" }}
      >
        <div className="absolute w-80 h-80 rounded-full -top-16 -left-16" style={{ border: "60px solid rgba(255,255,255,0.06)" }} />
        <div className="absolute w-64 h-64 rounded-full -bottom-12 -right-12" style={{ border: "50px solid rgba(255,255,255,0.05)" }} />
        <div className="absolute w-36 h-36 rounded-full bottom-28 left-10" style={{ background: "rgba(255,255,255,0.05)" }} />

        <div className="flex items-center gap-3 mb-12 z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
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
            Verify Your Email
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm mx-auto mb-10">
            One last step. Enter the code we emailed you to activate your account.
          </p>
          {["Keeps your account secure", "Takes less than a minute", "Code expires shortly"].map((text) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-full px-5 py-3 mb-3 max-w-xs mx-auto"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.25)" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-white/90 text-sm font-semibold">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-12 bg-white overflow-y-auto"
        style={{ boxShadow: "-8px 0 40px rgba(0,0,0,0.06)" }}
      >
        {step === "email" ? (
          <>
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                Verify your email
              </h2>
              <p className="text-gray-400 text-sm">
                Enter your email and we&apos;ll send you a verification code.
              </p>
            </div>

            <form onSubmit={handleSendFromEmailStep} noValidate>
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wide uppercase">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFormError(""); clearError(); }}
                  className={inputClass}
                  required
                />
              </div>

              {shownError && (
                <div role="alert" className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm font-medium">
                  {shownError}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full text-white font-bold text-base rounded-xl py-4 mb-5 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "#0d8f7a" }}
              >
                {sending ? "Sending..." : "Send Code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                Enter verification code
              </h2>
              <p className="text-gray-400 text-sm">
                We sent a {OTP_LENGTH}-digit code to{" "}
                <span className="font-bold text-gray-600 break-all">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} noValidate>
              {/* OTP boxes */}
              <div className="flex justify-between gap-2 sm:gap-3 mb-5" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={d}
                    onChange={(e) => { handleChange(i, e.target.value); setFormError(""); clearError(); }}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Digit ${i + 1}`}
                    className="w-full min-w-0 h-14 text-center text-xl font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#0d8f7a] focus:ring-2 focus:ring-[#0d8f7a]/20 transition-all"
                  />
                ))}
              </div>

              {shownError && (
                <div role="alert" className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm font-medium">
                  {shownError}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying}
                className="w-full text-white font-bold text-base rounded-xl py-4 mb-5 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "#0d8f7a" }}
              >
                {verifying && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                )}
                {verifying ? "Verifying..." : "Verify"}
              </button>

              {/* Resend */}
              <p className="text-center text-sm text-gray-400 mb-3">
                Didn&apos;t get the code?{" "}
                {cooldown > 0 ? (
                  <span className="text-gray-500 font-semibold">Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={sending}
                    className="text-[#0d8f7a] font-bold hover:underline disabled:opacity-60"
                  >
                    {sending ? "Sending..." : "Resend code"}
                  </button>
                )}
              </p>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-400">
          <Link to="/" className="text-[#0d8f7a] font-bold hover:underline">
            ← Back to Log In
          </Link>
        </p>
      </div>
    </div>
  );
}