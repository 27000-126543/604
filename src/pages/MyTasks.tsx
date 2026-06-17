import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, User, CheckCircle2, XCircle, Upload, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';
import { getMyTasks, submitProof } from '@/api/tasks';
import type { Task, TaskParticipant } from '@/api/types';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

type TabType = 'published' | 'participated';

const statusMap = {
  open: { label: '待领取', color: 'bg-green-100 text-green-700 border-green-200' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: '已完成', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  expired: { label: '已过期', color: 'bg-red-100 text-red-700 border-red-200' },
};

const proofStatusMap = {
  pending: { label: '待审核', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  approved: { label: '已通过', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: 'bg-danger/10 text-danger border-danger/20', icon: XCircle },
};

export default function MyTasks() {
  const toast = useToast();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('published');
  const [loading, setLoading] = useState(true);
  const [publishedTasks, setPublishedTasks] = useState<Task[]>([]);
  const [participatedTasks, setParticipatedTasks] = useState<Task[]>([]);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proofContent, setProofContent] = useState('');
  const [proofError, setProofError] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);

  const inProgressCount = participatedTasks.filter(t => t.status === 'in_progress').length;

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getMyTasks();
      setPublishedTasks(data.published);
      setParticipatedTasks(data.participated);
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取任务失败';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenSubmitModal = (task: Task) => {
    setSelectedTask(task);
    setProofContent('');
    setProofError('');
    setSubmitModalOpen(true);
  };

  const handleSubmitProof = async () => {
    if (proofContent.trim().length < 5) {
      setProofError('凭证内容至少需要5个字符');
      return;
    }
    if (!selectedTask) return;

    setSubmittingProof(true);
    try {
      await submitProof(selectedTask.id, { proof: proofContent.trim() });
      toast.success('凭证提交成功');
      setSubmitModalOpen(false);
      fetchTasks();
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交失败';
      toast.error(message);
    } finally {
      setSubmittingProof(false);
    }
  };

  const getMyParticipant = (task: Task): TaskParticipant | undefined => {
    return task.participants?.find(p => p.user_id === user?.id);
  };

  return (
    <div className="min-h-screen bg-gray-light">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary font-serif mb-2">我的任务</h1>
          <p className="text-gray-600">管理您发布和参与的任务</p>
        </div>

        <div className="bg-gradient-to-r from-primary to-primary-600 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center">
              <Clock className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-primary-100 text-sm">当前进行中任务数</p>
              <p className="text-3xl font-bold text-white">
                <span className="text-accent">{inProgressCount}</span>
                <span className="text-primary-200 text-xl">/3</span>
              </p>
            </div>
          </div>
          {inProgressCount >= 3 && (
            <div className="flex items-center gap-1.5 px-4 py-2 bg-danger/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-danger" />
              <span className="text-sm text-danger font-medium">已达上限</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-8 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200 w-fit">
          <button
            onClick={() => setActiveTab('published')}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === 'published'
                ? 'bg-accent text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            我发布的
          </button>
          <button
            onClick={() => setActiveTab('participated')}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === 'participated'
                ? 'bg-accent text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            我参与的
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'published' && publishedTasks.length === 0 && (
              <Empty>
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary/40" />
                  </div>
                  <p className="text-gray-600 text-lg mb-2">暂无发布的任务</p>
                  <p className="text-gray-400 text-sm">去发布第一个任务吧</p>
                </div>
              </Empty>
            )}

            {activeTab === 'published' && publishedTasks.map((task, index) => {
              const participantCount = task.participant_count ?? task.participants?.length ?? 0;
              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-primary">{task.title}</h3>
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', statusMap[task.status as keyof typeof statusMap].color)}>
                      {statusMap[task.status as keyof typeof statusMap].label}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-accent" />
                      <span>{participantCount}/{task.required_people} 人</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span>截止：{dayjs(task.deadline).format('YYYY-MM-DD HH:mm')}</span>
                    </div>
                  </div>

                  {task.participants && task.participants.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-3 font-medium">参与者列表</p>
                      <div className="space-y-3">
                        {task.participants.map(p => {
                          const proofStatus = p.proof_submission?.status;
                          const StatusIcon = proofStatus ? proofStatusMap[proofStatus as keyof typeof proofStatusMap].icon : null;
                          return (
                            <div
                              key={p.id}
                              className="bg-gray-light rounded-xl p-4"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{p.user?.username}</span>
                                {proofStatus && StatusIcon && (
                                  <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-0.5', proofStatusMap[proofStatus as keyof typeof proofStatusMap].color)}>
                                    <StatusIcon className="w-3 h-3" />
                                    {proofStatusMap[proofStatus as keyof typeof proofStatusMap].label}
                                  </span>
                                )}
                                {!proofStatus && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium border bg-gray-200 text-gray-600 border-gray-300">
                                    参与中
                                  </span>
                                )}
                              </div>
                              {p.proof_submission?.proof_content && (
                                <div className="bg-white rounded-lg p-3 mb-2">
                                  <p className="text-xs text-gray-500 mb-1 font-medium">提交的凭证</p>
                                  <p className="text-sm text-gray-700">{p.proof_submission.proof_content}</p>
                                </div>
                              )}
                              {proofStatus === 'rejected' && p.proof_submission?.reject_reason && (
                                <div className="bg-danger/5 rounded-lg p-3 border border-danger/10">
                                  <p className="text-xs text-danger font-medium mb-1">拒绝原因</p>
                                  <p className="text-sm text-danger/80">{p.proof_submission.reject_reason}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {activeTab === 'participated' && participatedTasks.length === 0 && (
              <Empty>
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-primary/40" />
                  </div>
                  <p className="text-gray-600 text-lg mb-2">暂无参与的任务</p>
                  <p className="text-gray-400 text-sm">去任务大厅领取感兴趣的任务吧</p>
                </div>
              </Empty>
            )}

            {activeTab === 'participated' && participatedTasks.map((task, index) => {
              const participant = getMyParticipant(task);
              const proofSubmission = participant?.proof_submission;
              const proofStatus = proofSubmission?.status;
              const participantCount = task.participant_count ?? task.participants?.length ?? 0;

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-primary">{task.title}</h3>
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', statusMap[task.status as keyof typeof statusMap].color)}>
                      {statusMap[task.status as keyof typeof statusMap].label}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-accent" />
                      <span>{participantCount}/{task.required_people} 人</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span>截止：{dayjs(task.deadline).format('YYYY-MM-DD HH:mm')}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    {!proofSubmission && task.status === 'in_progress' && (
                      <button
                        onClick={() => handleOpenSubmitModal(task)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-700 text-white text-sm font-medium rounded-xl transition-all active:scale-[0.98] shadow-md shadow-accent/25"
                      >
                        <Upload className="w-4 h-4" />
                        提交凭证
                      </button>
                    )}

                    {proofStatus && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={cn('inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border', proofStatusMap[proofStatus as keyof typeof proofStatusMap].color)}>
                            {(() => {
                              const Icon = proofStatusMap[proofStatus as keyof typeof proofStatusMap].icon;
                              return <Icon className="w-4 h-4" />;
                            })()}
                            审核状态：{proofStatusMap[proofStatus as keyof typeof proofStatusMap].label}
                          </div>

                          {proofStatus === 'rejected' && (
                            <button
                              onClick={() => handleOpenSubmitModal(task)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-all"
                            >
                              <RotateCcw className="w-4 h-4" />
                              重新提交
                            </button>
                          )}
                        </div>

                        {proofSubmission.proof_content && (
                          <div className="bg-gray-light rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-1.5 font-medium">提交的凭证</p>
                            <p className="text-sm text-gray-700">{proofSubmission.proof_content}</p>
                          </div>
                        )}

                        {proofStatus === 'rejected' && proofSubmission.reject_reason && (
                          <div className="bg-danger/5 rounded-xl p-4 border border-danger/10">
                            <p className="text-xs text-danger font-medium mb-1.5">拒绝原因</p>
                            <p className="text-sm text-danger/80">{proofSubmission.reject_reason}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {!proofSubmission && task.status !== 'in_progress' && task.status !== 'open' && (
                      <p className="text-sm text-gray-400">任务已结束</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          isOpen={submitModalOpen}
          onClose={() => !submittingProof && setSubmitModalOpen(false)}
          title="提交完成凭证"
          actions={[
            {
              label: '取消',
              onClick: () => setSubmitModalOpen(false),
              variant: 'secondary',
              disabled: submittingProof,
            },
            {
              label: submittingProof ? '提交中...' : '确认提交',
              onClick: handleSubmitProof,
              variant: 'primary',
              disabled: submittingProof,
            },
          ]}
        >
          <div className="space-y-5">
            {selectedTask && (
              <div className="bg-gray-light rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1 font-medium">任务名称</p>
                <p className="text-sm font-semibold text-primary">{selectedTask.title}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">完成凭证</label>
              <textarea
                value={proofContent}
                onChange={(e) => {
                  setProofContent(e.target.value);
                  if (proofError) setProofError('');
                }}
                placeholder="请描述任务完成情况（至少5个字符）"
                rows={5}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none',
                  proofError
                    ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                    : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'
                )}
              />
              <div className="flex justify-between mt-2">
                {proofError ? (
                  <p className="text-sm text-danger flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {proofError}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">{proofContent.length} 字</span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
