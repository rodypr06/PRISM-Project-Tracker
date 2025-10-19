import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { clientAPI } from '@/utils/api';
import StatusBadge from '@/components/shared/StatusBadge';
import ProgressBar from '@/components/shared/ProgressBar';
import CommentSection from '@/components/shared/CommentSection';
import { cn } from '@/lib/utils';

export default function EnhancedClientDashboard() {
  const { user, logout } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPhases, setExpandedPhases] = useState(new Set());
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadProject();
  }, []);

  const loadProject = async () => {
    try {
      const data = await clientAPI.getProject();
      setProject(data.project);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = (phaseId) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const calculateProgress = (phase) => {
    if (!phase.tasks || phase.tasks.length === 0) return 0;
    const completed = phase.tasks.filter(t => t.status === 'Completed').length;
    return (completed / phase.tasks.length) * 100;
  };

  const calculateOverallProgress = () => {
    if (!project?.phases || project.phases.length === 0) return 0;
    const totalTasks = project.phases.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
    if (totalTasks === 0) return 0;
    const completedTasks = project.phases.reduce(
      (sum, p) => sum + (p.tasks?.filter(t => t.status === 'Completed').length || 0),
      0
    );
    return (completedTasks / totalTasks) * 100;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-dark rounded-2xl p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-300 mt-4">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-2xl p-6 mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">{user?.clientName}</h1>
            <p className="text-gray-400 mt-1">{user?.companyName}</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </motion.div>

      {error ? (
        <div className="glass-dark rounded-2xl p-6">
          <div className="bg-rose-500/20 border border-rose-500/50 rounded-lg p-3 text-rose-200">
            {error}
          </div>
        </div>
      ) : !project ? (
        <div className="glass-dark rounded-2xl p-12 text-center text-gray-400">
          <p className="text-lg">No project assigned yet</p>
        </div>
      ) : (
        <>
          {/* Project Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-2xl p-6 mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">{project.project_name}</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Overall Progress</span>
                  <span className="text-sm font-medium text-primary">
                    {calculateOverallProgress().toFixed(0)}%
                  </span>
                </div>
                <ProgressBar
                  percentage={calculateOverallProgress()}
                  size="lg"
                  showPercentage={false}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {project.phases?.length || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Total Phases</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    {project.phases?.filter(p => p.status === 'Completed').length || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    {project.phases?.filter(p => p.status === 'In Progress').length || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-400">
                    {project.phases?.filter(p => p.status === 'Not Started').length || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Not Started</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phases */}
          <div className="space-y-4">
            {project.phases?.map((phase, index) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl overflow-hidden"
              >
                {/* Phase Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{phase.phase_name}</h3>
                        <StatusBadge status={phase.status} size="sm" />
                      </div>
                      <ProgressBar
                        percentage={calculateProgress(phase)}
                        label={`${phase.tasks?.filter(t => t.status === 'Completed').length || 0} of ${phase.tasks?.length || 0} tasks completed`}
                        size="sm"
                        showPercentage={false}
                      />
                    </div>
                    <motion.svg
                      className="w-6 h-6 text-gray-400 ml-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      animate={{ rotate: expandedPhases.has(phase.id) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </div>
                </div>

                {/* Phase Content */}
                <AnimatePresence>
                  {expandedPhases.has(phase.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-5 space-y-4">
                        {/* Tasks */}
                        {phase.tasks && phase.tasks.length > 0 ? (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-300">Tasks</h4>
                            {phase.tasks.map((task, idx) => (
                              <div
                                key={task.id}
                                className={cn(
                                  'bg-white/5 rounded-lg p-3 transition-all cursor-pointer',
                                  'hover:bg-white/10'
                                )}
                                onClick={() => setSelectedTask(task)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className={cn(
                                      'w-2 h-2 rounded-full flex-shrink-0',
                                      task.status === 'Completed' ? 'bg-emerald-400' :
                                      task.status === 'In Progress' ? 'bg-amber-400' :
                                      task.status === 'Blocked' ? 'bg-rose-400' :
                                      'bg-gray-400'
                                    )} />
                                    <div className="flex-1">
                                      <p className="text-white text-sm font-medium">{task.task_name}</p>
                                      {task.notes && (
                                        <p className="text-gray-400 text-xs mt-1 line-clamp-1">{task.notes}</p>
                                      )}
                                      {task.due_date && (
                                        <p className="text-gray-500 text-xs mt-1">
                                          Due: {new Date(task.due_date).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <StatusBadge status={task.status} size="sm" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic">No tasks yet</p>
                        )}

                        {/* Updates */}
                        {phase.updates && phase.updates.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-300">📢 Recent Updates</h4>
                            {phase.updates.slice(0, 3).map((update) => (
                              <div key={update.id} className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                                <p className="text-gray-300 text-sm">{update.update_text}</p>
                                {update.milestone_date && (
                                  <p className="text-cyan-400 text-xs mt-1">
                                    📅 Milestone: {new Date(update.milestone_date).toLocaleDateString()}
                                  </p>
                                )}
                                <p className="text-gray-500 text-xs mt-1">
                                  {new Date(update.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comments */}
                        <div className="pt-4 border-t border-white/10">
                          <CommentSection phaseId={phase.id} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-dark rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">{selectedTask.task_name}</h3>
                <StatusBadge status={selectedTask.status} />
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedTask.notes && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Notes</h4>
                <p className="text-gray-400 text-sm">{selectedTask.notes}</p>
              </div>
            )}

            {selectedTask.due_date && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Due Date</h4>
                <p className="text-gray-400 text-sm">
                  📅 {new Date(selectedTask.due_date).toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-white/10">
              <CommentSection taskId={selectedTask.id} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
