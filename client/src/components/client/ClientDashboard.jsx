import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clientAPI } from '../../utils/api';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-400';
      case 'In Progress':
        return 'text-amber-400';
      case 'Blocked':
        return 'text-rose-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const getPhaseProgress = () => {
    if (!project?.phases) return 0;
    const totalPhases = project.phases.length;
    const completedPhases = project.phases.filter(p => p.status === 'Completed').length;
    return Math.round((completedPhases / totalPhases) * 100);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header with gradient overlay */}
      <div className="glass-dark rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"></div>
        <div className="relative flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">{user?.clientName}</h1>
            <p className="text-cyan-400 font-medium">{user?.companyName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary hover:scale-105 transition-transform duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Project Overview */}
      {loading ? (
        <div className="glass-dark rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading your project...</p>
        </div>
      ) : error ? (
        <div className="glass-dark rounded-2xl p-6 animate-fade-in">
          <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-4 text-rose-200 flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        </div>
      ) : !project ? (
        <div className="glass-dark rounded-2xl p-16 text-center text-gray-400">
          <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p className="text-xl">No project assigned yet</p>
          <p className="text-sm mt-2 opacity-75">Please contact your project manager</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Project Header Card */}
          <div className="glass-dark rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-white">{project.project_name}</h2>
              <div className="text-right">
                <p className="text-sm text-gray-400">Overall Progress</p>
                <p className="text-2xl font-bold text-cyan-400">{getPhaseProgress()}%</p>
              </div>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${getPhaseProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-5">
            {project.phases?.map((phase, index) => {
              const progress = calculateProgress(phase.tasks);
              const isLocked = phase.status === 'Not Started';

              return (
                <div
                  key={phase.id}
                  className={`glass rounded-2xl transition-all duration-300 animate-slide-up ${
                    isLocked ? 'p-4 opacity-60' : 'p-6 hover:bg-white/15'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {isLocked ? (
                    // Collapsed view for "Not Started" phases
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-400">{phase.phase_name}</h3>
                          <p className="text-xs text-gray-500">Phase {phase.phase_number}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        Locked
                      </span>
                    </div>
                  ) : (
                    // Expanded view for active phases
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                              phase.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                              phase.status === 'In Progress' ? 'bg-amber-500/20 text-amber-400' :
                              phase.status === 'Blocked' ? 'bg-rose-500/20 text-rose-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {phase.phase_number}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{phase.phase_name}</h3>
                              <p className="text-sm text-gray-400">Phase {phase.phase_number}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                            phase.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            phase.status === 'In Progress' ? 'bg-amber-500/20 text-amber-400' :
                            phase.status === 'Blocked' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {phase.status}
                          </span>
                          <span className="text-xs text-gray-400">{progress}% Complete</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {phase.tasks && phase.tasks.length > 0 && (
                        <>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                phase.status === 'Completed' ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                                phase.status === 'In Progress' ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                                'bg-gradient-to-r from-cyan-500 to-blue-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>

                          {/* Tasks */}
                          <div className="space-y-2">
                            {phase.tasks.map((task, taskIndex) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
                              >
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                  task.status === 'Completed' ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' :
                                  task.status === 'In Progress' ? 'bg-amber-400 shadow-lg shadow-amber-500/50 animate-pulse' :
                                  task.status === 'Blocked' ? 'bg-rose-400 shadow-lg shadow-rose-500/50' :
                                  'bg-gray-500'
                                }`}></div>
                                <span className="text-gray-200 flex-1 group-hover:text-white transition-colors">
                                  {task.task_name}
                                </span>
                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                  task.status === 'Completed' ? 'text-emerald-400' :
                                  task.status === 'In Progress' ? 'text-amber-400' :
                                  task.status === 'Blocked' ? 'text-rose-400' :
                                  'text-gray-400'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
