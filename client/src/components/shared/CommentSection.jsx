import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { commentsAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function CommentSection({ taskId = null, phaseId = null }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComments();
  }, [taskId, phaseId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      let data;
      if (taskId) {
        data = await commentsAPI.getTaskComments(taskId);
      } else if (phaseId) {
        data = await commentsAPI.getPhaseComments(phaseId);
      }
      setComments(data.comments || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      await commentsAPI.createComment({
        taskId,
        phaseId,
        commentText: newComment.trim()
      });
      setNewComment('');
      await loadComments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsAPI.deleteComment(commentId);
      await loadComments();
    } catch (err) {
      setError(err.message);
    }
  };

  const canDelete = (comment) => {
    return user?.role === 'admin' || comment.user_id === user?.id;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold text-gray-300">
          💬 Comments ({comments.length})
        </h4>
      </div>

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/50 rounded-lg p-3 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="input-field resize-none text-sm"
          disabled={submitting}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm italic">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'rounded-lg p-4 border',
                  comment.role === 'admin'
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-white/5 border-white/10'
                )}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                      comment.role === 'admin'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-600/50 text-gray-300'
                    )}>
                      {comment.role === 'admin' ? '👨‍💼' : '👤'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">
                          {comment.role === 'admin' ? 'Admin' : comment.client_name || comment.username}
                        </span>
                        {comment.role === 'admin' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 text-xs">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {canDelete(comment) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-rose-400 hover:text-rose-300 text-xs transition-colors"
                      title="Delete comment"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Comment Text */}
                <div
                  className="text-gray-300 text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: comment.comment_text
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
