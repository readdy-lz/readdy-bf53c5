import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DEMO_EMAIL, DEMO_PASSWORD, useAuth } from "@/context/AuthContext";

type Mode = "signin" | "signup";

type LocationState = { from?: string } | null;

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signIn, signUp, signInDemo, expired, clearExpired } = useAuth();

  const from = (location.state as LocationState)?.from || "/";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, from, navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
    setConfirm("");
  };

  const finish = () => navigate(from, { replace: true });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");

    const mail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setError("请输入一个有效的邮箱地址");
      return;
    }
    if (password.length < 6) {
      setError("密码至少需要 6 位");
      return;
    }
    if (mode === "signup" && password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const message = await signIn(mail, password);
        if (message) setError(message);
        else finish();
        return;
      }

      const result = await signUp(mail, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.needsConfirm) {
        setNotice("注册成功，验证邮件已经发出去了，点开邮件里的链接就能登录");
        setMode("signin");
        return;
      }
      finish();
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async () => {
    if (busy) return;
    setError("");
    setNotice("");
    setMode("signin");
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setBusy(true);
    try {
      const message = await signInDemo();
      if (message) setError(message);
      else finish();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background-50">
      <div className="hidden lg:flex relative w-[46%] min-w-[420px] shrink-0 overflow-hidden bg-foreground-900">
        <img
          src="https://readdy.ai/api/search-image?query=Minimal%20abstract%20illustration%20of%20layered%20sage%20green%20hills%20at%20dawn%20with%20soft%20mist%20and%20geometric%20light%20rays%2C%20warm%20cream%20sky%2C%20calm%20quiet%20atmosphere%2C%20editorial%20poster%20aesthetic%2C%20generous%20negative%20space%20at%20the%20top%2C%20muted%20natural%20palette&width=1000&height=1400&seq=wx-login-cover&orientation=portrait"
          alt="微聊"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/55 via-foreground-950/20 to-foreground-950/75"></div>
        <div className="relative z-10 flex flex-col w-full p-10">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-md bg-primary-500 text-background-50 flex items-center justify-center">
              <i className="ri-chat-smile-2-line text-[20px]"></i>
            </span>
            <span className="text-[15px] tracking-wide text-background-50">微聊</span>
          </div>
          <div className="mt-auto max-w-[360px]">
            <h1 className="text-[30px] leading-[1.28] text-background-50">
              和老朋友说说话，
              <br />
              从这里开始。
            </h1>
            <p className="mt-4 text-[13px] leading-[1.85] text-background-50/80">
              消息、语音、朋友圈都在一个地方。登录后，你的聊天记录和草稿会一直留着。
            </p>
            <div className="mt-8 flex items-center gap-5 text-[11.5px] text-background-50/70">
              <span className="flex items-center gap-1.5">
                <i className="ri-lock-2-line text-[13px]"></i>
                端到端会话保护
              </span>
              <span className="flex items-center gap-1.5">
                <i className="ri-device-line text-[13px]"></i>
                多端同步
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col px-4 md:px-10">
        <div className="lg:hidden flex items-center gap-2 pt-8">
          <span className="w-9 h-9 rounded-md bg-primary-500 text-background-50 flex items-center justify-center">
            <i className="ri-chat-smile-2-line text-[20px]"></i>
          </span>
          <span className="text-[15px] tracking-wide text-foreground-900">微聊</span>
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-[380px]">
            <h2 className="text-[22px] text-foreground-950">
              {mode === "signin" ? "登录微聊" : "创建账号"}
            </h2>
            <p className="mt-2 text-[12.5px] text-foreground-500 leading-relaxed">
              {mode === "signin"
                ? "用邮箱和密码继续，登录状态会保留在这台设备上"
                : "填一个常用邮箱，注册完就能直接开始聊天"}
            </p>

            {expired && (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-accent-50 px-3 py-2.5">
                <i className="ri-time-line text-[15px] text-accent-600 mt-0.5"></i>
                <p className="flex-1 text-[11.5px] leading-relaxed text-accent-800">
                  登录状态已过期，为了保护你的消息，需要重新登录一次。
                </p>
                <button
                  type="button"
                  onClick={clearExpired}
                  aria-label="关闭提示"
                  className="w-4 h-4 flex items-center justify-center text-accent-500 hover:text-accent-700 cursor-pointer"
                >
                  <i className="ri-close-line text-[13px]"></i>
                </button>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-1 p-1 rounded-md bg-background-100">
              {(["signin", "signup"] as Mode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => switchMode(item)}
                  className={`h-8 rounded text-[12.5px] transition-colors cursor-pointer ${
                    mode === item
                      ? "bg-background-50 text-foreground-950"
                      : "text-foreground-500 hover:text-foreground-800"
                  }`}
                >
                  {item === "signin" ? "登录" : "注册"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <label className="block">
                <span className="text-[11.5px] text-foreground-600">邮箱</span>
                <div className="mt-1.5 flex items-center gap-2 h-11 px-3 rounded-md bg-background-100 border border-background-200 focus-within:border-primary-400 transition-colors">
                  <i className="ri-mail-line w-4 h-4 flex items-center justify-center text-[15px] text-foreground-400"></i>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 min-w-0 bg-transparent text-[13.5px] text-foreground-950 outline-none placeholder:text-foreground-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[11.5px] text-foreground-600">密码</span>
                <div className="mt-1.5 flex items-center gap-2 h-11 px-3 rounded-md bg-background-100 border border-background-200 focus-within:border-primary-400 transition-colors">
                  <i className="ri-lock-2-line w-4 h-4 flex items-center justify-center text-[15px] text-foreground-400"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="至少 6 位字符"
                    className="flex-1 min-w-0 bg-transparent text-[13.5px] text-foreground-950 outline-none placeholder:text-foreground-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    className="w-5 h-5 flex items-center justify-center text-foreground-400 hover:text-foreground-700 cursor-pointer"
                  >
                    <i className={`${showPassword ? "ri-eye-off-line" : "ri-eye-line"} text-[15px]`}></i>
                  </button>
                </div>
              </label>

              {mode === "signup" && (
                <label className="block">
                  <span className="text-[11.5px] text-foreground-600">确认密码</span>
                  <div className="mt-1.5 flex items-center gap-2 h-11 px-3 rounded-md bg-background-100 border border-background-200 focus-within:border-primary-400 transition-colors">
                    <i className="ri-shield-check-line w-4 h-4 flex items-center justify-center text-[15px] text-foreground-400"></i>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      placeholder="再输入一次"
                      className="flex-1 min-w-0 bg-transparent text-[13.5px] text-foreground-950 outline-none placeholder:text-foreground-400"
                    />
                  </div>
                </label>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-md bg-accent-50 px-3 py-2">
                  <i className="ri-error-warning-line text-[14px] text-accent-600 mt-0.5"></i>
                  <p className="text-[11.5px] leading-relaxed text-accent-800">{error}</p>
                </div>
              )}

              {notice && (
                <div className="flex items-start gap-2 rounded-md bg-primary-50 px-3 py-2">
                  <i className="ri-information-line text-[14px] text-primary-600 mt-0.5"></i>
                  <p className="text-[11.5px] leading-relaxed text-primary-800">{notice}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className={`w-full h-11 rounded-md text-[13.5px] whitespace-nowrap transition-colors ${
                  busy
                    ? "bg-background-300 text-foreground-500 cursor-wait"
                    : "bg-primary-500 text-background-50 hover:bg-primary-600 cursor-pointer"
                }`}
              >
                {busy ? "处理中…" : mode === "signin" ? "登录" : "创建账号"}
              </button>
            </form>

            <div className="mt-6 rounded-md bg-background-100 p-3.5">
              <div className="flex items-center gap-1.5">
                <i className="ri-flashlight-line text-[14px] text-primary-600"></i>
                <span className="text-[12px] text-foreground-800">不想注册？用演示账号</span>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-foreground-500">
                {DEMO_EMAIL} / {DEMO_PASSWORD}
                <br />
                点一下直接填好并登录，第一次用会自动创建这个演示账号。
              </p>
              <button
                type="button"
                onClick={handleDemo}
                disabled={busy}
                className="mt-2.5 h-8 px-3 rounded-md bg-background-50 border border-background-200 text-[12px] text-foreground-800 whitespace-nowrap hover:border-primary-300 hover:text-primary-700 transition-colors cursor-pointer disabled:opacity-60"
              >
                一键登录演示账号
              </button>
            </div>

            <p className="mt-6 text-[11px] text-foreground-400 leading-relaxed">
              继续即表示同意服务条款与隐私政策。你的消息只用于展示这段对话，不会对外公开。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}