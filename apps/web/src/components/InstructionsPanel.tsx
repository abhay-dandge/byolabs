import React, { useState } from 'react';
import { Lab, LabSession } from '@byolabs/shared';
import { api } from '../lib/api';
import { CheckCircle2, Circle, Play, AlertCircle, Copy, Check, ChevronRight } from 'lucide-react';

interface InstructionsPanelProps {
  lab: Lab;
  session: LabSession;
  onSessionUpdate: (session: LabSession) => void;
}

export const InstructionsPanel: React.FC<InstructionsPanelProps> = ({ lab, session, onSessionUpdate }) => {
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ taskId: string; success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const completedCount = session.completedTasks.length;
  const totalTasks = lab.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 100;

  const handleVerifyTask = async (taskId: string) => {
    setVerifyingTaskId(taskId);
    setFeedback(null);
    try {
      const res = await api.validateTask(session.id, taskId);
      setFeedback({ taskId, success: res.success, message: res.message });
      if (res.session) {
        onSessionUpdate(res.session);
      }
    } catch (err: any) {
      setFeedback({ taskId, success: false, message: err.message || 'Validation request failed' });
    } finally {
      setVerifyingTaskId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-200">
      {/* Header & Progress */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">Lab Instructions</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
            {completedCount}/{totalTasks} Completed
          </span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{lab.name}</h2>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm leading-relaxed font-sans">
        {/* Render Instructions Text */}
        <div className="prose prose-invert max-w-none space-y-4">
          {lab.instructionsMarkdown.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('# ')) {
              return <h1 key={idx} className="text-xl font-extrabold text-slate-100 border-b border-slate-800 pb-2">{paragraph.replace('# ', '')}</h1>;
            }
            if (paragraph.startsWith('## ')) {
              return <h2 key={idx} className="text-base font-bold text-cyan-300 mt-4 mb-2">{paragraph.replace('## ', '')}</h2>;
            }
            if (paragraph.startsWith('### ')) {
              return <h3 key={idx} className="text-sm font-semibold text-slate-200 mt-3 mb-1">{paragraph.replace('### ', '')}</h3>;
            }
            if (paragraph.includes('```')) {
              const lines = paragraph.split('\n');
              const code = lines.filter(l => !l.startsWith('```')).join('\n');
              return (
                <div key={idx} className="relative group my-3">
                  <pre className="bg-[#090d16] p-3 rounded-lg border border-slate-800 font-mono text-xs text-cyan-200 overflow-x-auto">
                    <code>{code}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="absolute top-2 right-2 p-1.5 rounded bg-slate-800/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                    title="Copy command"
                  >
                    {copiedCode === code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            }
            return <p key={idx} className="text-slate-300">{paragraph}</p>;
          })}
        </div>

        {/* Tasks Section */}
        {lab.tasks && lab.tasks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
              <ChevronRight className="w-4 h-4 text-cyan-400 mr-1" /> Required Tasks
            </h3>

            <div className="space-y-3">
              {lab.tasks.map((task, idx) => {
                const isDone = session.completedTasks.includes(task.id);
                const isVerifying = verifyingTaskId === task.id;
                const taskFeedback = feedback?.taskId === task.id ? feedback : null;

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <h4 className="font-semibold text-slate-100 text-sm">
                            Task {idx + 1}: {task.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleVerifyTask(task.id)}
                        disabled={isDone || isVerifying}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center transition ${
                          isDone
                            ? 'bg-emerald-900/30 text-emerald-300 cursor-default'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50'
                        }`}
                      >
                        {isVerifying ? (
                          <span className="flex items-center">Validating...</span>
                        ) : isDone ? (
                          <span className="flex items-center"><Check className="w-3.5 h-3.5 mr-1" /> Verified</span>
                        ) : (
                          <span className="flex items-center"><Play className="w-3 h-3 mr-1" /> Verify Task</span>
                        )}
                      </button>
                    </div>

                    {/* Verification Feedback Banner */}
                    {taskFeedback && (
                      <div
                        className={`mt-3 p-3 rounded-lg text-xs flex items-start space-x-2 ${
                          taskFeedback.success
                            ? 'bg-emerald-950/80 border border-emerald-800/60 text-emerald-300'
                            : 'bg-rose-950/80 border border-rose-800/60 text-rose-300'
                        }`}
                      >
                        {taskFeedback.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>{taskFeedback.message}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
