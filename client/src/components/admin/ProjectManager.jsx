import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { adminAPI } from '@/utils/api';
import StatusBadge from '@/components/shared/StatusBadge';
import ProgressBar from '@/components/shared/ProgressBar';
import CommentSection from '@/components/shared/CommentSection';
import NotesSection from '@/components/shared/NotesSection';
import { cn } from '@/lib/utils';

export default function ProjectManager({ project, client, onClose, onUpdate }) {
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPhases, setExpandedPhases] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [editingPhase, setEditingPhase] = useState(null);
  const [showAddTask, setShowAddTask] = useState(null);
  const [showAddUpdate, setShowAddUpdate] = useState(null);
  const [viewMode, setViewMode] = useState('admin'); // 'admin' or 'client'

  useEffect(() => {
    loadProject();
  }, [project.id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getProject(project.id);
      setProjectData(data.project);
      // Collapse all phases by default
      setExpandedPhases(new Set());
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
    if (!projectData?.phases || projectData.phases.length === 0) return 0;
    const totalTasks = projectData.phases.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
    if (totalTasks === 0) return 0;
    const completedTasks = projectData.phases.reduce(
      (sum, p) => sum + (p.tasks?.filter(t => t.status === 'Completed').length || 0),
      0
    );
    return (completedTasks / totalTasks) * 100;
  };

  const handleUpdatePhaseStatus = async (phaseId, status) => {
    try {
      await adminAPI.updatePhase(phaseId, { status });
      await loadProject();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await adminAPI.updateTask(taskId, { status });
      await loadProject();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      if (editingTask) {
        const updateData = {
          taskName: formData.get('taskName'),
        };

        const notes = formData.get('notes');
        if (notes) {
          updateData.notes = notes;
        }

        const dueDate = formData.get('dueDate');
        if (dueDate) {
          updateData.dueDate = dueDate;
        }

        await adminAPI.updateTask(editingTask.id, updateData);
      } else {
        const phaseId = showAddTask;
        const phase = projectData.phases.find(p => p.id === phaseId);
        const taskOrder = phase.tasks.length + 1;

        const taskData = {
          phaseId,
          taskName: formData.get('taskName'),
          taskOrder,
        };

        const notes = formData.get('notes');
        if (notes) {
          taskData.notes = notes;
        }

        const dueDate = formData.get('dueDate');
        if (dueDate) {
          taskData.dueDate = dueDate;
        }

        await adminAPI.createTask(taskData);
      }

      setEditingTask(null);
      setShowAddTask(null);
      await loadProject();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await adminAPI.deleteTask(taskId);
      await loadProject();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDragEnd = async (result, phaseId) => {
    if (!result.destination) return;

    const phase = projectData.phases.find(p => p.id === phaseId);
    if (!phase || !phase.tasks) return;

    const items = Array.from(phase.tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistically update UI
    const updatedPhases = projectData.phases.map(p => {
      if (p.id === phaseId) {
        return { ...p, tasks: items };
      }
      return p;
    });
    setProjectData({ ...projectData, phases: updatedPhases });

    // Send reorder request to backend
    try {
      const taskIds = items.map(task => task.id);
      await adminAPI.reorderTasks(phaseId, taskIds);
      await loadProject();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
      // Reload on error to get correct state
      await loadProject();
    }
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const updateData = {
        updateText: formData.get('updateText'),
      };

      // Only include phaseId if present
      if (showAddUpdate.phaseId) {
        updateData.phaseId = showAddUpdate.phaseId;
      }

      // Only include taskId if present
      if (showAddUpdate.taskId) {
        updateData.taskId = showAddUpdate.taskId;
      }

      // Only include milestoneDate if present
      const milestoneDate = formData.get('milestoneDate');
      if (milestoneDate) {
        updateData.milestoneDate = milestoneDate;
      }

      await adminAPI.createUpdate(updateData);

      setShowAddUpdate(null);
      await loadProject();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-white">{project.project_name}</h2>
            {viewMode === 'client' && (
              <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                👁️ Client Preview
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-1">
            {client.client_name} - {client.company_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setViewMode('admin')}
              className={cn(
                'px-4 py-2 rounded text-sm font-medium transition-all',
                viewMode === 'admin'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              👨‍💼 Admin View
            </button>
            <button
              onClick={() => setViewMode('client')}
              className={cn(
                'px-4 py-2 rounded text-sm font-medium transition-all',
                viewMode === 'client'
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              👤 Client View
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/50 rounded-lg p-3 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Overall Progress - Client View */}
      {viewMode === 'client' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-5"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Project Overview</h3>
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
                  {projectData?.phases?.length || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">Total Phases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {projectData?.phases?.filter(p => p.status === 'Completed').length || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {projectData?.phases?.filter(p => p.status === 'In Progress').length || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-400">
                  {projectData?.phases?.filter(p => p.status === 'Not Started').length || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">Not Started</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Phases */}
      <div className="space-y-4">
        {projectData?.phases?.map((phase) => (
          <motion.div
            key={phase.id}
            className="glass rounded-xl overflow-hidden"
            layout
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
                    size="sm"
                    showPercentage={true}
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
                    {/* Phase Status Controls - Admin Only */}
                    {viewMode === 'admin' && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-sm text-gray-400">Change Status:</span>
                        {['Not Started', 'In Progress', 'Completed', 'Blocked'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdatePhaseStatus(phase.id, status)}
                            className={cn(
                              'text-xs px-3 py-1 rounded-full border transition-all',
                              phase.status === status
                                ? 'bg-primary/20 text-primary border-primary'
                                : 'bg-slate-700/50 text-gray-400 border-slate-600 hover:border-gray-500'
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tasks */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-300">Tasks ({phase.tasks?.length || 0})</h4>
                        {viewMode === 'admin' && (
                          <button
                            onClick={() => setShowAddTask(phase.id)}
                            className="text-xs text-primary hover:underline"
                          >
                            + Add Task
                          </button>
                        )}
                      </div>

                      {phase.tasks && phase.tasks.length > 0 ? (
                        viewMode === 'admin' ? (
                          <DragDropContext onDragEnd={(result) => handleDragEnd(result, phase.id)}>
                            <Droppable droppableId={`phase-${phase.id}`}>
                              {(provided, snapshot) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className={cn(
                                    "space-y-2 transition-colors rounded-lg",
                                    snapshot.isDraggingOver && "bg-primary/5"
                                  )}
                                >
                                  {phase.tasks.map((task, idx) => (
                                    <Draggable
                                      key={task.id}
                                      draggableId={`task-${task.id}`}
                                      index={idx}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={cn(
                                            "bg-white/5 rounded-lg p-3 transition-all",
                                            snapshot.isDragging
                                              ? "shadow-lg shadow-primary/20 bg-white/10 scale-105"
                                              : "hover:bg-white/10"
                                          )}
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2 flex-1">
                                              {/* Drag Handle */}
                                              <div
                                                {...provided.dragHandleProps}
                                                className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-primary transition-colors"
                                              >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zM13 3h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                                                </svg>
                                              </div>

                                              <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex-shrink-0">
                                                    <span className="text-primary text-xs font-bold">{idx + 1}</span>
                                                  </div>
                                                  <span className="text-white text-sm font-medium">{task.task_name}</span>
                                                </div>

                                                {task.notes && (
                                                  <p className="text-gray-400 text-xs mt-1">{task.notes}</p>
                                                )}

                                                {task.due_date && (
                                                  <p className="text-gray-500 text-xs mt-1">
                                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                                  </p>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                              <StatusBadge status={task.status} size="sm" />
                                              <div className="flex gap-1">
                                                <button
                                                  onClick={() => setEditingTask(task)}
                                                  className="text-primary hover:text-cyan-300 text-xs"
                                                  title="Edit"
                                                >
                                                  ✏️
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteTask(task.id)}
                                                  className="text-rose-400 hover:text-rose-300 text-xs"
                                                  title="Delete"
                                                >
                                                  🗑️
                                                </button>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Task Status Changer */}
                                          <div className="flex gap-2 mt-3 flex-wrap">
                                            {['Not Started', 'In Progress', 'Completed', 'Blocked'].map((status) => (
                                              <button
                                                key={status}
                                                onClick={() => handleUpdateTaskStatus(task.id, status)}
                                                className={cn(
                                                  'text-xs px-2 py-0.5 rounded border transition-all',
                                                  task.status === status
                                                    ? 'bg-primary/20 text-primary border-primary'
                                                    : 'bg-slate-800/50 text-gray-500 border-slate-700 hover:border-gray-600'
                                                )}
                                              >
                                                {status}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        ) : (
                          // Client view - no drag and drop
                          <div className="space-y-2">
                            {phase.tasks.map((task, idx) => (
                              <div
                                key={task.id}
                                className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex-shrink-0">
                                        <span className="text-cyan-300 text-xs font-bold">{idx + 1}</span>
                                      </div>
                                      <span className="text-white text-sm font-medium">{task.task_name}</span>
                                    </div>

                                    {task.notes && (
                                      <p className="text-gray-400 text-xs mt-1">{task.notes}</p>
                                    )}

                                    {task.due_date && (
                                      <p className="text-gray-500 text-xs mt-1">
                                        Due: {new Date(task.due_date).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <StatusBadge status={task.status} size="sm" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <p className="text-gray-500 text-sm italic">No tasks yet</p>
                      )}
                    </div>

                    {/* Add Update Button - Admin Only */}
                    {viewMode === 'admin' && (
                      <button
                        onClick={() => setShowAddUpdate({ phaseId: phase.id })}
                        className="text-sm text-primary hover:underline"
                      >
                        + Add Progress Update
                      </button>
                    )}

                    {/* Updates */}
                    {phase.updates && phase.updates.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-300">Updates</h4>
                        {phase.updates.map((update) => (
                          <div key={update.id} className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                            <p className="text-gray-300 text-sm">{update.update_text}</p>
                            {update.milestone_date && (
                              <p className="text-cyan-400 text-xs mt-1">
                                📅 {new Date(update.milestone_date).toLocaleDateString()}
                              </p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(update.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comments Section */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <CommentSection phaseId={phase.id} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Project Notes Section */}
      <div className="mt-8">
        <NotesSection projectId={project.id} isAdminView={viewMode === 'admin'} />
      </div>

      {/* Add/Edit Task Modal */}
      {(editingTask || showAddTask) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">
              {editingTask ? 'Edit Task' : 'Add Task'}
            </h3>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Task Name *</label>
                <input
                  type="text"
                  name="taskName"
                  defaultValue={editingTask?.task_name}
                  required
                  className="input-field"
                  placeholder="Enter task name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={editingTask?.notes}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Add notes (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={editingTask?.due_date?.split('T')[0]}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  {editingTask ? 'Save Changes' : 'Add Task'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setShowAddTask(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Update Modal */}
      {showAddUpdate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Add Progress Update</h3>
            <form onSubmit={handleSaveUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Update Text *</label>
                <textarea
                  name="updateText"
                  required
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Enter progress update"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Milestone Date (Optional)</label>
                <input
                  type="date"
                  name="milestoneDate"
                  className="input-field"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  Add Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUpdate(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
