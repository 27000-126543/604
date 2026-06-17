import { useState, useEffect } from 'react';
import { Shield, Check, X, User, FileText, Clock, Loader2, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { getPendingProofs, reviewProof } from '@/api/admin';
import type { ProofSubmission } from '@/api/types';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const toast = useToast();
  const [proofs, setProofs] = useState<ProofSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<ProofSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const data = await getPendingProofs();
      setProofs(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取凭证列表失败';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const handleApprove = async (proof: ProofSubmission) => {
    setProcessingId(proof.id);
    try {
      await reviewProof(proof.id, { approved: true, points: 10 });
      toast.success('审核通过，已奖励10积分');
      fetchProofs();
    } catch (error) {
      const message = error instanceof Error ? error.message : '审核失败';
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRejectModal = (proof: ProofSubmission) => {
    setSelectedProof(proof);
    setRejectReason('');
    setRejectError('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (rejectReason.trim().length < 2) {
      setRejectError('拒绝原因至少需要2个字符');
      return;
    }
    if (!selectedProof) return;

    setProcessingId(selectedProof.id);
    try {
      await reviewProof(selectedProof.id, {
        approved: false,
        reject_reason: rejectReason.trim(),
      });
      toast.success('已拒绝该凭证');
      setRejectModalOpen(false);
      fetchProofs();
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败';
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary font-serif">管理后台</h1>
              <p className="text-gray-600">凭证审核</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : proofs.length === 0 ? (
            <Empty>
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="w-10 h-10 text-success" />
                </div>
                <p className="text-gray-600 text-lg mb-2 font-medium">暂无待审核凭证</p>
                <p className="text-gray-400 text-sm">所有凭证都已处理完毕</p>
              </div>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-light border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">用户</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">任务标题</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">凭证内容</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">提交时间</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {proofs.map((proof, index) => (
                    <tr
                      key={proof.id}
                      className="hover:bg-gray-light/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">{proof.user?.username}</p>
                            <p className="text-xs text-gray-400">ID: {proof.user?.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-accent shrink-0" />
                          <span className="text-sm text-gray-700 font-medium">{proof.task?.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-xs line-clamp-2">{proof.proof_content}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Clock className="w-4 h-4 text-accent" />
                          <span className="text-sm">{dayjs(proof.submitted_at).format('YYYY-MM-DD HH:mm')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(proof)}
                            disabled={processingId === proof.id}
                            className={cn(
                              'flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98]',
                              processingId === proof.id
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-success hover:bg-success/90 text-white shadow-md shadow-success/25'
                            )}
                          >
                            {processingId === proof.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            通过
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(proof)}
                            disabled={processingId === proof.id}
                            className={cn(
                              'flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98]',
                              processingId === proof.id
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-danger hover:bg-danger/90 text-white shadow-md shadow-danger/25'
                            )}
                          >
                            {processingId === proof.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            拒绝
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal
          isOpen={rejectModalOpen}
          onClose={() => processingId === null && setRejectModalOpen(false)}
          title="拒绝凭证"
          actions={[
            {
              label: '取消',
              onClick: () => setRejectModalOpen(false),
              variant: 'secondary',
              disabled: processingId !== null,
            },
            {
              label: processingId !== null ? '处理中...' : '确认拒绝',
              onClick: handleReject,
              variant: 'danger',
              disabled: processingId !== null,
            },
          ]}
        >
          <div className="space-y-5">
            {selectedProof && (
              <div className="bg-gray-light rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-primary">{selectedProof.user?.username}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="text-sm text-gray-700">{selectedProof.task?.title}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">凭证内容</p>
                <p className="text-sm text-gray-700">{selectedProof.proof_content}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">拒绝原因</label>
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError('');
                }}
                placeholder="请输入拒绝原因"
                rows={4}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none',
                  rejectError
                    ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                    : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'
                )}
              />
              <div className="flex justify-between mt-2">
                {rejectError ? (
                  <p className="text-sm text-danger flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {rejectError}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">{rejectReason.length} 字</span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
