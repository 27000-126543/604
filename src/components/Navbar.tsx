import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Target,
  LayoutGrid,
  PlusCircle,
  ListTodo,
  UserCircle,
  LogOut,
  LogIn,
  UserPlus,
  Settings,
  Coins,
  Menu,
  X
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/store/toast'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('已退出登录')
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-primary hidden sm:block">
              任务协作管理系统
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                >
                  <LayoutGrid className="w-5 h-5" />
                  任务大厅
                </Link>

                {user?.role === 'user' && (
                  <>
                    <Link
                      to="/tasks/publish"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                    >
                      <PlusCircle className="w-5 h-5" />
                      发布任务
                    </Link>
                    <Link
                      to="/tasks/mine"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                    >
                      <ListTodo className="w-5 h-5" />
                      我的任务
                    </Link>
                  </>
                )}

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                  >
                    <Settings className="w-5 h-5" />
                    管理后台
                  </Link>
                )}

                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-vibrant/10 rounded-lg">
                    <Coins className="w-4 h-4 text-orange-vibrant" />
                    <span className="font-semibold text-orange-vibrant">{user?.points ?? 0}</span>
                  </div>

                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm max-w-[100px] truncate">
                      {user?.username}
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-red-alert hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden lg:block">退出登录</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                >
                  <LogIn className="w-5 h-5" />
                  登录
                </Link>
                <Link
                  to="/login?mode=register"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-vibrant text-white hover:bg-orange-vibrant/90 transition-colors font-medium shadow-md shadow-orange-vibrant/25"
                >
                  <UserPlus className="w-5 h-5" />
                  注册
                </Link>
              </div>
            )}
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'md:hidden border-t border-gray-100 overflow-hidden transition-all duration-300',
          mobileMenuOpen ? 'max-h-[500px]' : 'max-h-0'
        )}
      >
        <nav className="px-4 py-3 space-y-1">
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
              >
                <LayoutGrid className="w-5 h-5" />
                任务大厅
              </Link>

              {user?.role === 'user' && (
                <>
                  <Link
                    to="/tasks/publish"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                  >
                    <PlusCircle className="w-5 h-5" />
                    发布任务
                  </Link>
                  <Link
                    to="/tasks/mine"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                  >
                    <ListTodo className="w-5 h-5" />
                    我的任务
                  </Link>
                </>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                >
                  <Settings className="w-5 h-5" />
                  管理后台
                </Link>
              )}

              <div className="pt-3 mt-3 border-t border-gray-100 space-y-1">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user?.username}</p>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Coins className="w-4 h-4 text-orange-vibrant" />
                        <span className="font-semibold text-orange-vibrant">{user?.points ?? 0} 积分</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:text-red-alert hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  退出登录
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium border border-gray-200"
              >
                <LogIn className="w-5 h-5" />
                登录
              </Link>
              <Link
                to="/login?mode=register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-orange-vibrant text-white hover:bg-orange-vibrant/90 transition-colors font-medium shadow-md shadow-orange-vibrant/25"
              >
                <UserPlus className="w-5 h-5" />
                注册
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
