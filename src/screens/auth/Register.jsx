import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useRegister } from "../../hooks/useRegister";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useCurrencies } from "../../hooks/useCurrency";
import SearchableSelect from "../../components/common/Searchableselect";

// TODO: confirm with backend how home_country should be sent (code like "PK" or full name)
const HOME_COUNTRY = "PK";

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-700 bg-gray-50 outline-none focus:border-[#0d8f7a] focus:ring-2 focus:ring-[#0d8f7a]/20 transition-all placeholder-gray-300";

const labelClass = "block text-xs font-bold text-gray-500 mb-2 tracking-wide uppercase";

// The currency API shape isn't known here, so read the code/name defensively.
const currencyCode = (c) =>
  typeof c === "string" ? c : c.code ?? c.currency_code ?? c.short_name ?? c.name;
const currencyLabel = (c) => {
  if (typeof c === "string") return c;
  const code = currencyCode(c);
  return c.name && c.name !== code ? `${code} — ${c.name}` : code;
};

function EyeIcon({ open }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-5">
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="Toggle password"
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error } = useRegister();
  const { currencies, loading: currenciesLoading, error: currenciesError } = useCurrencies();

  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [phone, setPhone]                     = useState(); // E.164, e.g. +923001234567
  const [currency, setCurrency]               = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError]             = useState("");

  const currencyOptions = useMemo(
    () => currencies.map((c) => ({ value: currencyCode(c), label: currencyLabel(c) })),
    [currencies]
  );

  const validate = () => {
    if (name.trim().length < 2) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Please enter a valid email address.";
    if (!phone || !isValidPhoneNumber(phone)) return "Please enter a valid phone number.";
    if (!currency) return "Please select your default currency.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    setFormError(problem);
    if (problem) return;

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone, // E.164, e.g. +923001234567
      password,
      default_currency: currency,
      home_country: HOME_COUNTRY,
    });

    if (result.success) {
      toast.success("Account created! Please verify your email.");
      // Same screen Login sends unverified users to
      navigate("/verify-otp", { state: { credentials: email.trim() } });
    }
  };

  const shownError = formError || error;
  // Backend says e.g. "<email> is already exists" → offer a link to Log In
  const alreadyExists = !formError && /already/i.test(error || "");

  return (
    <div className="min-h-screen flex font-sans">
      <style>{`
        .PhoneInput.grab-phone {
          border: 1px solid #e5e7eb; border-radius: 12px; padding: 0 16px;
          background: #f9fafb; transition: all 0.15s; gap: 8px;
          --PhoneInputCountrySelectArrow-color: #9ca3af;
          --PhoneInputCountryFlag-height: 16px;
        }
        .PhoneInput.grab-phone:focus-within {
          border-color: #0d8f7a; box-shadow: 0 0 0 2px rgba(13,143,122,0.2);
        }
        .PhoneInput.grab-phone .PhoneInputInput {
          border: none; outline: none; background: transparent;
          padding: 14px 0; font-size: 14px; color: #374151; min-width: 0;
        }
        .PhoneInput.grab-phone .PhoneInputInput::placeholder { color: #d1d5db; }
      `}</style>

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
            Join GrabnGo
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm mx-auto mb-10">
            Create your account and start ordering, travelling and earning today.
          </p>
          {["Quick sign up in a minute", "Order from anywhere", "Earn while you travel"].map((text) => (
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
        className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-10 bg-white overflow-y-auto"
        style={{ boxShadow: "-8px 0 40px rgba(0,0,0,0.06)" }}
      >
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Create your account
          </h2>
          <p className="text-gray-400 text-sm">Fill in your details to get started</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Full name */}
          <div className="mb-5">
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div className="mb-5">
            <label className={labelClass}>Phone Number</label>
            <PhoneInput
              className="grab-phone"
              international
              countryCallingCodeEditable={false}
              defaultCountry="PK"
              placeholder="300 1234567"
              value={phone}
              onChange={setPhone}
            />
          </div>

          {/* Default currency */}
          <div className="mb-5">
            <label className={labelClass}>Default Currency</label>
            <SearchableSelect
              buttonClassName={inputClass}
              options={currencyOptions}
              value={currency}
              onChange={setCurrency}
              loading={currenciesLoading}
              placeholder="Select currency"
              searchPlaceholder="Search currency"
            />
            {currenciesError && (
              <p className="text-red-500 text-xs mt-1.5">{currenciesError}</p>
            )}
          </div>

          {/* Password + confirm */}
          <PasswordField
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordField
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {/* Error */}
          {shownError && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm font-medium"
            >
              <p>{shownError}</p>
              {alreadyExists && (
                <Link to="/" className="inline-block mt-2 text-[#0d8f7a] font-bold text-sm hover:underline">
                  Log in instead →
                </Link>
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
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/" className="text-[#0d8f7a] font-bold hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}