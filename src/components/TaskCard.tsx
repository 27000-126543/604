import { Calendar, Users, User } from 'lucide-react'
import dayjs from 'dayjs'
import type { Task } from '@/api/types'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

const statusConfig: Record<Task['status'], { label: string; className: string }> = {
  open: {
    label: '待领取',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  in_progress: {
    label: '进行中',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  completed: {
    label: '已完成',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  expired: {
    label: '已过期',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const status = statusConfig[task.status]
  const participantCount = task.participant_count ?? task.participants?.length ?? 0
  const description = task.description.length > 60 
    ? task.description.slice(0, 60) + '...' 
    : task.description

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-5 cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-xl hover:border-accent',
        'active:scale-[0.98]'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-primary line-clamp-1 flex-1">
          {task.title}
        </h3>
        <span
          className={cn(
            'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border',
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
        {description}
      </p>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-accent" />
          <span>{dayjs(task.deadline).format('YYYY-MM-DD HH:mm')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-accent" />
          <span>
            <span className={cn(
              'font-medium',
              participantCount >= task.required_people ? 'text-success' : 'text-primary'
            )}>
              {participantCount}
            </span>
            /{task.required_people} 人
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm text-gray-600">
          发布者：
          <span className="font-medium text-primary">
            {task.publisher?.username ?? '未知'}
          </span>
        </span>
      </div>
    </div>
  )
}
