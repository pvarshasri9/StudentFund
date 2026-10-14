import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.js';
import { Badge } from '../components/common/Badge.js';
import { ProgressBar } from '../components/common/ProgressBar.js';
import { Modal } from '../components/common/Modal.js';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { LiteracyModule } from '../types/index.js';

export const FinancialLiteracyPage: React.FC = () => {
  const { showToast } = useNotification();
  const [modules, setModules] = useState<LiteracyModule[]>([]);
  const [stats, setStats] = useState({ totalModules: 0, completedModules: 0, progressPercent: 0 });
  const [loading, setLoading] = useState(true);

  // Active module reader / quiz modal
  const [activeModule, setActiveModule] = useState<LiteracyModule | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ modules: LiteracyModule[]; stats: any }>('/literacy');
      setModules(data.modules);
      setStats(data.stats);
    } catch (err: any) {
      showToast(err.message || 'Failed to load literacy modules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleOpenModule = (mod: LiteracyModule) => {
    setActiveModule(mod);
    setSelectedAnswers(new Array(mod.quiz.length).fill(-1));
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    const updated = [...selectedAnswers];
    updated[qIdx] = optIdx;
    setSelectedAnswers(updated);
  };

  const handleSubmitQuiz = async () => {
    if (!activeModule) return;
    if (selectedAnswers.some(ans => ans === -1)) {
      showToast('Please answer all questions before submitting', 'warning');
      return;
    }

    setSubmittingQuiz(true);
    try {
      const data = await apiRequest('/literacy/submit-quiz', {
        method: 'POST',
        body: JSON.stringify({
          moduleId: activeModule.id,
          answers: selectedAnswers
        })
      });
      setQuizResult(data);
      setQuizSubmitted(true);
      if (data.passed) {
        showToast(`Congratulations! You passed with ${data.scorePercent}%!`, 'success');
      } else {
        showToast(`Score: ${data.scorePercent}%. Review the explanations and retry.`, 'info');
      }
      fetchModules();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit quiz', 'error');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2 border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Practical Financial Education
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-heading tracking-tight">
              Student Financial Literacy & Habits
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1 leading-relaxed">
              Curated for Indian university students: master money runway calculation, learn the 60-25-15 campus budgeting rule, avoid instant predatory loan traps, and test your knowledge with interactive quizzes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 min-w-[200px] text-center">
            <div className="text-xs text-slate-400 font-semibold mb-1">Learning Mastery</div>
            <div className="text-2xl font-bold text-emerald-400 font-heading mb-1.5">
              {stats.progressPercent}%
            </div>
            <ProgressBar value={stats.progressPercent} max={100} height="h-2" colorScheme="emerald" />
            <div className="text-[11px] text-slate-500 mt-1.5">
              {stats.completedModules} of {stats.totalModules} modules mastered
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map(mod => (
          <div
            key={mod.id}
            className={`p-5 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between ${
              mod.completed
                ? 'bg-slate-900/80 border-emerald-500/30'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <Badge variant={mod.completed ? 'emerald' : 'indigo'} size="sm">
                  {mod.category}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{mod.readTime}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5 font-heading">
                {mod.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {mod.description}
              </p>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 mb-4">
                <span className="font-semibold text-indigo-300 block mb-0.5">Key Student Takeaway:</span>
                <span className="text-[11px] leading-relaxed">{mod.keyTakeaway}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              {mod.completed ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mastered (Quiz Score: {mod.quizScore}%)</span>
                </div>
              ) : (
                <span className="text-slate-400">Quiz Incomplete</span>
              )}

              <button
                onClick={() => handleOpenModule(mod)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{mod.completed ? 'Review Lesson' : 'Start Lesson & Quiz'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reader & Quiz Modal */}
      {activeModule && (
        <Modal
          isOpen={!!activeModule}
          onClose={() => setActiveModule(null)}
          title={activeModule.title}
          subtitle={`${activeModule.category} • ${activeModule.readTime}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-xs text-slate-200">
            {/* Lesson Content Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Lesson Notes
              </h4>
              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                {activeModule.content.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {/* Practical Student Case Study */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Student Case Study: {activeModule.studentCaseStudy.studentName}
              </h4>
              <p className="text-[11px] text-slate-300">
                <strong>Scenario: </strong>{activeModule.studentCaseStudy.scenario}
              </p>
              <p className="text-[11px] text-rose-300">
                <strong>The Trap: </strong>{activeModule.studentCaseStudy.mistake}
              </p>
              <p className="text-[11px] text-emerald-300">
                <strong>Smart Student Solution: </strong>{activeModule.studentCaseStudy.smartSolution}
              </p>
            </div>

            {/* Interactive Quiz Section */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Knowledge Check Quiz
              </h4>

              <div className="space-y-4">
                {activeModule.quiz.map((q, qIdx) => (
                  <div key={qIdx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <p className="font-semibold text-white">
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[qIdx] === optIdx;
                        let optionStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

                        if (quizSubmitted && quizResult) {
                          if (optIdx === q.correctAnswerIndex) {
                            optionStyle = 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-bold';
                          } else if (isSelected) {
                            optionStyle = 'bg-rose-950/50 border-rose-500 text-rose-200';
                          }
                        } else if (isSelected) {
                          optionStyle = 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${optionStyle}`}
                          >
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-2.5 rounded-lg bg-slate-900 text-[11px] text-slate-400 border border-slate-800">
                        <strong className="text-white">Explanation: </strong>{q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  type="button"
                  disabled={submittingQuiz}
                  onClick={handleSubmitQuiz}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingQuiz ? 'Evaluating...' : 'Submit Answers & Verify Mastery'}
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <div className="text-sm font-bold text-white font-heading">
                    {quizResult.passed ? '🎉 Congratulations, Module Passed!' : 'Review and Retry to Pass'}
                  </div>
                  <p className="text-xs text-slate-400">
                    You scored {quizResult.scorePercent}% ({quizResult.correctCount} of {quizResult.totalQuestions} correct).
                  </p>
                  <button
                    onClick={() => setActiveModule(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
