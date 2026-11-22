import React, { useState } from 'react';
import { ProcessingJob } from '../types/video';
import { Download, Share2, CheckCircle2, Clock, AlertCircle, RefreshCw, Trash2, Send } from 'lucide-react';
import { saveJobToGallery } from '../services/engineApi';
import { AutoPublishModal } from '../components/AutoPublishModal';

interface QueueScreenProps {
  jobs: ProcessingJob[];
  onRefreshJobs: () => void;
  onClearCompleted: () => void;
  onShowToast?: (msg: string) => void;
}

export const QueueScreen: React.FC<QueueScreenProps> = ({
  jobs,
  onRefreshJobs,
  onClearCompleted,
  onShowToast
}) => {
  const [selectedJobForPublish, setSelectedJobForPublish] = useState<ProcessingJob | null>(null);

  const handleShare = async (job: ProcessingJob) => {
    setSelectedJobForPublish(job);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 14px 30px 14px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>
            طابور المعالجة والنشر
          </h2>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            تجهيز ونشر عدة فيديوهات ورا بعض بنقرة زر
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onRefreshJobs}
            style={{
              backgroundColor: '#1b1f30',
              color: '#38bdf8',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #28304c'
            }}
            title="تحديث الحالة"
          >
            <RefreshCw size={15} />
          </button>

          {jobs.some(j => j.status === 'completed') && (
            <button
              onClick={onClearCompleted}
              style={{
                backgroundColor: '#1b1f30',
                color: '#f87171',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #28304c'
              }}
              title="مسح الفيديوهات المكتملة"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Jobs list */}
      {jobs.length === 0 ? (
        <div
          style={{
            backgroundColor: '#10121a',
            borderRadius: '16px',
            padding: '36px 20px',
            textAlign: 'center',
            border: '1px solid #1e2235',
            marginTop: 20
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: 10 }}>📥</div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', display: 'block', marginBottom: 6 }}>
            الطابور فارغ حالياً
          </span>
          <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
            اختر فيديو من الشاشة الرئيسية، واضغط "تجهيز وتصدير" لبدء المعالجة في الخلفية.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map(job => {
            const isDone = job.status === 'completed';
            const isProcessing = job.status === 'processing';
            const isQueued = job.status === 'queued';
            const isError = job.status === 'error';

            return (
              <div
                key={job.id}
                style={{
                  backgroundColor: '#111422',
                  borderRadius: '14px',
                  padding: '14px',
                  border: `1px solid ${isDone ? '#22c55e' : isProcessing ? '#fe2c55' : '#1e243a'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '8px',
                        backgroundColor: '#1c2032',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={20} color="#22c55e" />
                      ) : isProcessing ? (
                        <RefreshCw size={18} color="#fe2c55" className="spin-animation" />
                      ) : isError ? (
                        <AlertCircle size={20} color="#ef4444" />
                      ) : (
                        <Clock size={18} color="#94a3b8" />
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}
                      >
                        {job.videoName}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {job.currentStep || (isQueued ? 'في انتظار البدء...' : '')}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      backgroundColor: isDone
                        ? 'rgba(34,197,94,0.15)'
                        : isProcessing
                        ? 'rgba(254,44,85,0.15)'
                        : isError
                        ? 'rgba(239,68,68,0.15)'
                        : '#1c2032',
                      color: isDone ? '#4ade80' : isProcessing ? '#fe2c55' : isError ? '#f87171' : '#94a3b8'
                    }}
                  >
                    {isDone ? 'جاهز 🚀' : isProcessing ? `${job.progress}%` : isError ? 'خطأ' : 'بالانتظار'}
                  </span>
                </div>

                {/* Progress bar */}
                {(isProcessing || isQueued) && (
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#1b2033',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${job.progress}%`,
                        height: '100%',
                        backgroundColor: '#fe2c55',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                )}

                {/* Error details */}
                {isError && job.errorMessage && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#fca5a5',
                      backgroundColor: 'rgba(239,68,68,0.1)',
                      borderRadius: '8px',
                      padding: '8px',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      direction: 'ltr',
                      textAlign: 'left',
                      maxHeight: '120px',
                      overflowY: 'auto'
                    }}
                  >
                    {job.errorMessage}
                  </div>
                )}

                {/* Completed Action Buttons */}
                {isDone && job.outputFilename && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    {/* One-Click Dual Auto-Publish Button */}
                    <button
                      onClick={() => setSelectedJobForPublish(job)}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #fe2c55 0%, #1877f2 100%)',
                        color: '#fff',
                        padding: '11px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 4px 15px rgba(254,44,85,0.3)'
                      }}
                    >
                      <Send size={15} />
                      <span>نشر اتوماتيك (تيك توك + فيسبوك) 🚀</span>
                    </button>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={async () => {
                          try {
                            await saveJobToGallery(job);
                            onShowToast?.('✅ تم الحفظ في المعرض (مجلد Movies/TikTokStudio)');
                          } catch (e: any) {
                            onShowToast?.(String(e?.message || e));
                          }
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#22c55e',
                          color: '#000',
                          padding: '9px',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          border: 'none'
                        }}
                      >
                        <Download size={14} />
                        <span>حفظ في المعرض ({job.outputSizeMb || '12'} MB)</span>
                      </button>

                      <button
                        onClick={() => handleShare(job)}
                        style={{
                          backgroundColor: '#1f253d',
                          color: '#38bdf8',
                          padding: '9px 14px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          border: '1px solid #2e385c'
                        }}
                      >
                        <Share2 size={14} />
                        <span>مشاركة</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Auto Publish Modal */}
      {selectedJobForPublish && (
        <AutoPublishModal
          job={selectedJobForPublish}
          isOpen={true}
          onClose={() => setSelectedJobForPublish(null)}
          onSuccess={msg => {
            if (onShowToast) onShowToast(msg);
          }}
        />
      )}
    </div>
  );
};
