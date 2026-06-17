import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: Array<'user' | 'admin'>
  requireRole?: 'user' | 'admin'
}

export default function ProtectedRoute({ children, roles, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const location = useLocation()

  const requiredRoles = roles || (requireRole ? [requireRole] : undefined)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center max-w-md w-full animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-red-alert" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-3">
            无权限访问
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            抱歉，您的账号没有权限访问此页面。
            如需访问，请联系管理员获取相应权限。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 rounded-xl bg-gray-light text-primary font-medium hover:bg-gray-200 transition-colors"
            >
              返回上一页
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="px-6 py-3 rounded-xl bg-orange-vibrant text-white font-medium hover:bg-orange-vibrant/90 transition-colors shadow-md shadow-orange-vibrant/25"
            >
              返回首页
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              当前角色：
              <span className="font-medium text-gray-600">
                {user.role === 'admin' ? '管理员' : '普通用户'}
              </span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
