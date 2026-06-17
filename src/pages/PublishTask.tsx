import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  AlignLeft,
  Calendar,
  Users,
  Loader2,
  Send,
  AlertCircle,
} from 'lucide-react'
import dayjs from 'dayjs'
import { createTask } from '@/api/tasks'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface FormData {
  title: string
  description: string
  deadline: string
  required_people: string
}

interface FormErrors {
  title?: string
  description?: string
  deadline?: string
  required_people?: string
}

export default function PublishTask() {
  const navigate = useNavigate()
  const toast = useToast()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    deadline: '',
    required_people: '1',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const minDateTime = dayjs().format('YYYY-MM-DDTHH:mm')

  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) return '请输入任务标题'
    if (value.length < 2) return '标题至少需要2个字符'
    if (value.length > 100) return '标题不能超过100个字符'
    return undefined
  }

  const validateDescription = (value: string): string | undefined => {
    if (!value.trim()) return '请输入任务描述'
    if (value.length < 10) return '描述至少需要10个字符'
    if (value.length > 200) return '描述不能超过200个字符'
    return undefined
  }

  const validateDeadline = (value: string): string | undefined => {
    if (!value) return '请选择截止日期'
    if (dayjs(value).isBefore(dayjs())) return '截止日期不能早于当前时间'
    return undefined
  }

  const validateRequiredPeople = (value: string): string | undefined => {
    const num = parseInt(value, 10)
    if (!value || isNaN(num)) return '请输入所需人数'
    if (num < 1) return '所需人数至少为1人'
    return undefined
  }

  const handleChange = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    let error: string | undefined
    switch (field) {
      case 'title':
        error = validateTitle(value)
        break
      case 'description':
        error = validateDescription(value)
        break
      case 'deadline':
        error = validateDeadline(value)
        break
      case 'required_people':
        error = validateRequiredPeople(value)
        break
    }
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const isFormValid = (): boolean => {
    const newErrors: FormErrors = {
      title: validateTitle(formData.title),
      description: validateDescription(formData.description),
      deadline: validateDeadline(formData.deadline),
      required_people: validateRequiredPeople(formData.required_people),
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some((e) => e !== undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid()) return

    setSubmitting(true)
    try {
      await createTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline,
        required_people: parseInt(formData.required_people, 10),
      })
      toast.success('任务发布成功')
      navigate('/tasks/mine')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发布失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const descLength = formData.description.length
  const descCountColor = descLength < 10 || descLength > 200 ? 'text-red-alert' : 'text-gray-400'

  return (
    <div className="min-h-screen bg-gray-light">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary font-serif mb-2">发布任务</h1>
          <p className="text-gray-600">填写任务信息，发布后其他人可以参与</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-accent" />
                任务标题
                <span className="text-red-alert">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="请输入任务标题（2-100字符）"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border outline-none transition-all',
                  errors.title
                    ? 'border-red-alert focus:border-red-alert focus:ring-2 focus:ring-red-alert/20'
                    : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'
                )}
              />
              {errors.title && (
                <p className="mt-1.5 text-sm text-red-alert flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <AlignLeft className="w-4 h-4 text-accent" />
                任务描述
                <span className="text-red-alert">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="请详细描述任务内容（10-200字符）"
                  rows={5}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none',
                    errors.description
                      ? 'border-red-alert focus:border-red-alert focus:ring-2 focus:ring-red-alert/20'
                      : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'
                  )}
                />
                <span className={cn('absolute bottom-3 right-3 text-xs', descCountColor)}>
                  {descLength}/200
                </span>
              </div>
              {errors.description && (
                <p className="mt-1.5 text-sm text-red-alert flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  截止日期
                  <span className="text-red-alert">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  min={minDateTime}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border outline-none transition-all',
                    errors.deadline
                      ? 'border-red-alert focus:border-red-alert focus:ring-2 focus:ring-red-alert/20'
                      : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'
                  )}
                />
                {errors.deadline && (
                  <p className="mt-1.5 text-sm text-red-alert flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.deadline}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 text-accent" />
                  所需人数
                  <span className="text-red-alert">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.required_people}
                  onChange={(e) => handleChange('required_people', e.target.value)}
                  placeholder="至少1人"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border outline-none transition-all',
                    errors.required_people
                      ? 'border-red-alert focus:border-red-alert focus:ring-2 focus:ring-red-alert/20'
                      : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'
                  )}
                />
                {errors.required_people && (
                  <p className="mt-1.5 text-sm text-red-alert flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.required_people}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              'mt-8 w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg',
              submitting
                ? 'bg-accent/70 text-white cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent-700 active:scale-[0.98] shadow-accent/30'
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                发布中...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                发布任务
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
