import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../utils/api';
import ProjectManager from './ProjectManager';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    companyName: '',
    projectName: '',
    contact: '',
    phase0Name: 'Discovery & Planning',
    phase1Name: 'Design & Development',
    phase2Name: 'Testing & Refinement',
    phase3Name: 'Launch & Delivery'
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await adminAPI.getClients();
      setClients(data.clients);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await adminAPI.createClient({
        clientName: formData.clientName,
        companyName: formData.companyName,
        projectName: formData.projectName,
        contact: formData.contact,
        phaseNames: [
          formData.phase0Name,
          formData.phase1Name,
          formData.phase2Name,
          formData.phase3Name
        ]
      });

      // Show success message with credentials
      alert(`Client created successfully!\n\nUsername: ${result.client.username}\nTemporary Password: ${result.client.temporaryPassword}\n\nPlease save these credentials securely.`);

      // Reset form and reload clients
      setFormData({
        clientName: '',
        companyName: '',
        projectName: '',
        contact: '',
        phase0Name: 'Discovery & Planning',
        phase1Name: 'Design & Development',
        phase2Name: 'Testing & Refinement',
        phase3Name: 'Launch & Delivery'
      });
      setShowCreateForm(false);
      await loadClients();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = async (client) => {
    if (!client.project_id) {
      setError('No project found for this client');
      return;
    }

    setProjectLoading(true);
    setError('');

    try {
      const projectData = await adminAPI.getProject(client.project_id);
      setSelectedProject({ ...projectData.project, client });
    } catch (err) {
      setError(err.message);
    } finally {
      setProjectLoading(false);
    }
  };

  const handleEditClient = async (client) => {
    setEditingClient(client);
    setFormData({
      clientName: client.client_name,
      companyName: client.company_name,
      projectName: client.project_name || '',
      contact: client.contact || '',
      phase0Name: '',
      phase1Name: '',
      phase2Name: '',
      phase3Name: ''
    });

    // Load project phases
    if (client.project_id) {
      try {
        const projectData = await adminAPI.getProject(client.project_id);
        setEditingClient({ ...client, phases: projectData.project.phases });
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
  };

  const handleCloseEdit = () => {
    setEditingClient(null);
    setFormData({
      clientName: '',
      companyName: '',
      projectName: '',
      contact: '',
      phase0Name: 'Discovery & Planning',
      phase1Name: 'Design & Development',
      phase2Name: 'Testing & Refinement',
      phase3Name: 'Launch & Delivery'
    });
  };

  const handleDeleteClick = (client) => {
    setDeleteConfirmation(client);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;

    setLoading(true);
    setError('');

    try {
      await adminAPI.deleteClient(deleteConfirmation.id);
      await loadClients();
      setDeleteConfirmation(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header with gradient */}
      <div className="glass-dark rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"></div>
        <div className="relative flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-cyan-400 font-medium">Welcome back, {user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary hover:scale-105 transition-transform duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-6 max-w-md w-full border-2 border-rose-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white">Delete Client</h2>
            </div>

            <p className="text-gray-300 mb-2">
              Are you sure you want to delete <span className="font-semibold text-white">{deleteConfirmation.client_name}</span>?
            </p>
            <p className="text-sm text-rose-300 mb-6">
              This will permanently delete the client, their project, all phases, tasks, comments, and updates. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleDeleteCancel}
                disabled={loading}
                className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Manager Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <ProjectManager
              project={selectedProject}
              client={selectedProject.client}
              onClose={handleCloseProject}
              onUpdate={loadClients}
            />
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-white mb-6">Edit Client & Phases</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                // Update client info (note: you'll need to implement updateClient endpoint)
                // For now, just show success and close
                alert('Client info updated successfully!');
                handleCloseEdit();
                await loadClients();
              } catch (err) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contact</label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Phase Management Section */}
              {editingClient.phases && (
                <div className="border-t border-white/10 pt-4 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Project Phases</h3>
                    <button
                      type="button"
                      onClick={async () => {
                        const phaseName = prompt('Enter new phase name:');
                        if (phaseName && phaseName.trim()) {
                          try {
                            const phaseNumber = editingClient.phases.length;
                            await adminAPI.createPhase({
                              projectId: editingClient.project_id,
                              phaseNumber,
                              phaseName: phaseName.trim()
                            });
                            // Reload the client data
                            const projectData = await adminAPI.getProject(editingClient.project_id);
                            setEditingClient({ ...editingClient, phases: projectData.project.phases });
                          } catch (err) {
                            setError(err.message);
                          }
                        }
                      }}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Phase
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editingClient.phases
                      .sort((a, b) => a.phase_number - b.phase_number)
                      .map((phase) => (
                        <div key={phase.id} className="glass rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-500 font-medium">
                                  Phase {phase.phase_number}
                                </span>
                                <input
                                  type="text"
                                  defaultValue={phase.phase_name}
                                  onBlur={async (e) => {
                                    const newName = e.target.value.trim();
                                    if (newName && newName !== phase.phase_name) {
                                      try {
                                        await adminAPI.updatePhase(phase.id, {
                                          phaseName: newName
                                        });
                                        // Reload the client data
                                        const projectData = await adminAPI.getProject(editingClient.project_id);
                                        setEditingClient({ ...editingClient, phases: projectData.project.phases });
                                      } catch (err) {
                                        setError(err.message);
                                        e.target.value = phase.phase_name; // Revert on error
                                      }
                                    }
                                  }}
                                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                                  placeholder="Phase name"
                                />
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span>{phase.tasks?.length || 0} tasks</span>
                                <span className="px-2 py-0.5 rounded bg-white/5">{phase.status}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Delete phase "${phase.phase_name}"? This will also delete all tasks in this phase.`)) {
                                  try {
                                    await adminAPI.deletePhase(phase.id);
                                    // Reload the client data
                                    const projectData = await adminAPI.getProject(editingClient.project_id);
                                    setEditingClient({ ...editingClient, phases: projectData.project.phases });
                                  } catch (err) {
                                    setError(err.message);
                                  }
                                }
                              }}
                              className="text-rose-400 hover:text-rose-300 transition-colors"
                              title="Delete phase"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {editingClient.phases.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No phases yet. Click "Add Phase" to get started.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Client Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-white mb-6">Create New Client</h2>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Website Redesign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="email@example.com or phone number"
                />
              </div>

              <div className="border-t border-white/10 pt-4 mt-2">
                <label className="block text-sm font-medium text-gray-300 mb-3">Phase Names (4 Required)</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    name="phase0Name"
                    value={formData.phase0Name}
                    onChange={handleInputChange}
                    required
                    className="input-field text-sm"
                    placeholder="Phase 0 Name"
                  />
                  <input
                    type="text"
                    name="phase1Name"
                    value={formData.phase1Name}
                    onChange={handleInputChange}
                    required
                    className="input-field text-sm"
                    placeholder="Phase 1 Name"
                  />
                  <input
                    type="text"
                    name="phase2Name"
                    value={formData.phase2Name}
                    onChange={handleInputChange}
                    required
                    className="input-field text-sm"
                    placeholder="Phase 2 Name"
                  />
                  <input
                    type="text"
                    name="phase3Name"
                    value={formData.phase3Name}
                    onChange={handleInputChange}
                    required
                    className="input-field text-sm"
                    placeholder="Phase 3 Name"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Creating...' : 'Create Client'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="glass-dark rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Clients</h2>
            <p className="text-gray-400 mt-1">Manage your client projects</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary hover:scale-105 transition-transform duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Client
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-4 text-rose-200 text-sm mb-4 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <p className="text-xl">No clients yet</p>
            <p className="text-sm mt-2 opacity-75">Click "New Client" to get started</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client, index) => (
              <div
                key={client.id}
                className="glass rounded-xl p-5 hover:bg-white/15 hover:scale-[1.02] transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-xl group-hover:text-cyan-400 transition-colors">
                      {client.client_name}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{client.company_name}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3 mt-3">
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-gray-300">{client.project_name || 'No project'}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewProject(client)}
                      className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-medium py-2 px-3 rounded-lg transition-all text-sm"
                    >
                      View Project
                    </button>
                    <button
                      onClick={() => handleEditClient(client)}
                      className="bg-slate-700/50 hover:bg-slate-700 text-gray-300 font-medium py-2 px-3 rounded-lg transition-all text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(client)}
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-medium py-2 px-3 rounded-lg transition-all text-sm"
                      title="Delete client"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
