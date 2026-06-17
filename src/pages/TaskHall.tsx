import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Filter,
  Calendar,
  Users,
  User,
  Loader2,
  ClipboardList,
} from 'lucide-react'
import dayjs from 'dayjs'
import TaskCard from '@/components/TaskCard'
import Empty from '@/components/Empty'
import Modal from '@/components/Modal'
import { getTasks, getTask, joinTask } from '@/api/tasks'
import type { Task } from '@/api/types'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/Toast'

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'open', label: '待领取' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'expired', label: '已过期' },
]

const statusLabelMap: Record<string, { label: string; className: string }> = {
  open: { label: '待领取', className: 'bg-green-100 text-green-700 border-green-200' },
  in_progress: { label: '进行中', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: '已完成', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  expired: { label: '已过期', className: 'bg-red-100 text-red-700 border-red-200' },
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="h-4 bg-gray-200 rounded w-28"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="pt-3 border-t border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  )
}

export default function TaskHall() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const { user } = useAuthStore()
  const toast = useToast()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params: { status?: string } = {}
      if (statusFilter) params.status = statusFilter
      const data = await getTasks(params)
      setTasks(data.items)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const filteredTasks = useMemo(() => {
    if (!searchText.trim()) return tasks
    const keyword = searchText.toLowerCase()
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(keyword) ||
        t.description.toLowerCase().includes(keyword)
    )
  }, [tasks, searchText])

  const handleCardClick = async (taskId: number) => {
    setDetailLoading(true)
    try {
      const task = await getTask(taskId)
      setSelectedTask(task)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!selectedTask) return
    setJoining(true)
    try {
      const updatedTask = await joinTask(selectedTask.id)
      toast.success('参与成功')
      setSelectedTask(updatedTask)
      fetchTasks()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '参与失败，请重试')
    } finally {
      setJoining(false)
    }
  }

  const participantCount = selectedTask?.participants?.length ?? 0
  const isFull = selectedTask ? participantCount >= selectedTask.required_people : false
  const canJoin = selectedTask?.status === 'open' && !isFull
  const alreadyJoined = selectedTask?.participants?.some((p) => p.user_id === user?.id)
  const taskStatus = selectedTask ? statusLabelMap[selectedTask.status] : null

  return (
    <div className="min-h-screen bg-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary font-serif mb-2">任务大厅</h1>
          <p className="text-gray-600">浏览并参与你感兴趣的任务</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索任务标题或描述..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-12 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none cursor-pointer min-w-[160px]"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16">
            <Empty>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="w-10 h-10 text-primary/40" />
                </div>
                <p className="text-gray-600 text-lg mb-2">暂无任务</p>
                <p className="text-gray-400 text-sm">
                  {searchText || statusFilter ? '尝试调整筛选条件' : '去发布第一个任务吧'}
                </p>
              </div>
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => handleCardClick(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      <Modal
        isOpen={!!selectedTask && !detailLoading}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title}
        className="max-w-2xl"
        actions={[
          {
            label: '关闭',
            onClick: () => setSelectedTask(null),
            variant: 'secondary',
          },
          {
            label: alreadyJoined ? '已参与' : isFull ? '名额已满' : selectedTask?.status !== 'open' ? '不可参与' : '参与任务',
            onClick: handleJoin,
            variant: 'primary',
            disabled: !canJoin || joining || !!alreadyJoined,
          },
        ]}
      >
        {selectedTask && taskStatus && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border',
                  taskStatus.className
                )}
              >
                {taskStatus.label}
              </span>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>截止：{dayjs(selectedTask.deadline).format('YYYY-MM-DD HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-accent" />
                  <span>
                    {participantCount}/{selectedTask.required_people} 人
                  </span>
                </div>
              </div>
            </div>

            {joining && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">正在参与...</span>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                任务描述
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedTask.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                发布者信息
              </h3>
              <div className="flex items-center gap-3 bg-gray-light rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedTask.publisher?.username ?? '未知用户'}
                  </p>
                  <p className="text-sm text-gray-500">
                    发布于 {dayjs(selectedTask.created_at).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
              </div>
            </div>

            {selectedTask.participants && selectedTask.participants.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  参与者列表 ({selectedTask.participants.length})
                </h3>
                <div className="space-y-2">
                  {selectedTask.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-gray-light rounded-lg px-4 py-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {p.user?.username ?? '未知用户'}
                        </p>
                        <p className="text-xs text-gray-500">
                          加入于 {dayjs(p.joined_at).format('YYYY-MM-DD HH:mm')}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {p.status === 'joined' && '参与中'}
                        {p.status === 'completed' && '已完成'}
                        {p.status === 'expired' && '已过期'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
