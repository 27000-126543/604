import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Target,
  Users,
  Trophy,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register';

interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>((searchParams.get('mode') as Mode) || 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: toastError } = useToast();
  const { login, register, isLoading, isAuthenticated } = useAuthStore();

  const from = (location.state as { from?: string })?.from || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    const urlMode = searchParams.get('mode') as Mode;
    if (urlMode === 'login' || urlMode === 'register') {
      setMode(urlMode);
    }
  }, [searchParams]);

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (username.trim().length < 3) {
      newErrors.username = '用户名至少3个字符';
    } else if (username.trim().length > 20) {
      newErrors.username = '用户名最多20个字符';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      newErrors.username = '用户名只能包含字母、数字和下划线';
    }

    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码至少6个字符';
    } else if (password.length > 32) {
      newErrors.password = '密码最多32个字符';
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        newErrors.confirmPassword = '请确认密码';
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = '两次输入的密码不一致';
      }
    }

    return newErrors;
  };

  useEffect(() => {
    if (touched.username || touched.password || touched.confirmPassword) {
      setErrors(validate());
    }
  }, [username, password, confirmPassword, mode]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true, confirmPassword: true });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (mode === 'login') {
        await login(username.trim(), password);
        success('登录成功');
      } else {
        await register(username.trim(), password, 'user');
        success('注册成功');
      }
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : (mode === 'login' ? '登录失败' : '注册失败');
      toastError(message);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setTouched({});
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-dark via-primary to-indigo-mid relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-vibrant rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 bg-orange-vibrant rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold">任务协作管理系统</span>
          </div>

          <h1 className="text-4xl font-bold mb-6 leading-tight">
            高效协作
            <br />
            <span className="text-orange-vibrant">共创卓越</span>
          </h1>
          <p className="text-lg text-primary-100 mb-12 leading-relaxed max-w-md">
            现代化的任务协作平台，帮助团队高效管理任务、追踪进度、激励成员，
            让每一份努力都得到应有的回报。
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-orange-vibrant" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">高效任务分发</h3>
                <p className="text-primary-200">快速发布任务，智能匹配合适的团队成员</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-orange-vibrant" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">团队协作</h3>
                <p className="text-primary-200">多人协作完成任务，实时追踪参与进度</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-orange-vibrant" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">积分激励</h3>
                <p className="text-primary-200">公平的积分奖励机制，激发团队活力</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-light">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary">任务协作管理系统</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex mb-8 bg-gray-light rounded-xl p-1">
              <button
                onClick={() => switchMode('login')}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
                  mode === 'login'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <LogIn className="w-4 h-4" />
                登录
              </button>
              <button
                onClick={() => switchMode('register')}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
                  mode === 'register'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <UserPlus className="w-4 h-4" />
                注册
              </button>
            </div>

            <h2 className="text-2xl font-bold text-primary mb-2">
              {mode === 'login' ? '欢迎回来' : '创建账户'}
            </h2>
            <p className="text-gray-500 mb-8">
              {mode === 'login'
                ? '请输入您的账号信息以继续'
                : '填写以下信息，开始您的协作之旅'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <div className="relative">
                  <User
                    className={cn(
                      'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors',
                      errors.username && touched.username ? 'text-red-alert' : 'text-gray-400'
                    )}
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => handleBlur('username')}
                    placeholder="请输入用户名"
                    className={cn(
                      'w-full pl-12 pr-4 py-3 border rounded-xl bg-gray-light transition-all focus:outline-none focus:ring-2',
                      errors.username && touched.username
                        ? 'border-red-alert bg-red-50 focus:ring-red-alert/20'
                        : 'border-gray-200 focus:ring-orange-vibrant/30 focus:border-orange-vibrant focus:bg-white'
                    )}
                  />
                </div>
                {errors.username && touched.username && (
                  <p className="mt-2 text-sm text-red-alert">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock
                    className={cn(
                      'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors',
                      errors.password && touched.password ? 'text-red-alert' : 'text-gray-400'
                    )}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="请输入密码"
                    className={cn(
                      'w-full pl-12 pr-12 py-3 border rounded-xl bg-gray-light transition-all focus:outline-none focus:ring-2',
                      errors.password && touched.password
                        ? 'border-red-alert bg-red-50 focus:ring-red-alert/20'
                        : 'border-gray-200 focus:ring-orange-vibrant/30 focus:border-orange-vibrant focus:bg-white'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-2 text-sm text-red-alert">{errors.password}</p>
                )}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    确认密码
                  </label>
                  <div className="relative">
                    <Lock
                      className={cn(
                        'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors',
                        errors.confirmPassword && touched.confirmPassword ? 'text-red-alert' : 'text-gray-400'
                      )}
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      placeholder="请再次输入密码"
                      className={cn(
                        'w-full pl-12 pr-12 py-3 border rounded-xl bg-gray-light transition-all focus:outline-none focus:ring-2',
                        errors.confirmPassword && touched.confirmPassword
                          ? 'border-red-alert bg-red-50 focus:ring-red-alert/20'
                          : 'border-gray-200 focus:ring-orange-vibrant/30 focus:border-orange-vibrant focus:bg-white'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="mt-2 text-sm text-red-alert">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2',
                  isLoading
                    ? 'bg-orange-vibrant/70 cursor-not-allowed'
                    : 'bg-orange-vibrant hover:bg-orange-vibrant/90 active:bg-orange-vibrant/80 shadow-lg shadow-orange-vibrant/25 hover:shadow-orange-vibrant/40'
                )}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {mode === 'login' ? '登录中...' : '注册中...'}
                  </>
                ) : (
                  <>
                    {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {mode === 'login' ? '登录' : '注册'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              {mode === 'login' ? (
                <p>
                  还没有账号？
                  <button
                    onClick={() => switchMode('register')}
                    className="text-orange-vibrant font-medium hover:text-orange-vibrant/80 ml-1"
                  >
                    立即注册
                  </button>
                </p>
              ) : (
                <p>
                  已有账号？
                  <button
                    onClick={() => switchMode('login')}
                    className="text-orange-vibrant font-medium hover:text-orange-vibrant/80 ml-1"
                  >
                    立即登录
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
