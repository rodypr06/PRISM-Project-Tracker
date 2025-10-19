import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { notesAPI } from '@/utils/api';
import { cn } from '@/lib/utils';

export default function NoteItem({
  note,
  isAdminView,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onDeleteAttachment,
  onUploadComplete
}) {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        await notesAPI.uploadAttachment(note.id, file);
      }
      if (onUploadComplete) {
        await onUploadComplete();
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const dropzone = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024,
    disabled: !isAdminView || uploading,
    noClick: !isAdminView
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType === 'text/plain') return '📃';
    return '📎';
  };

  return (
    <motion.div
      className="glass rounded-xl overflow-hidden"
      layout
    >
      {/* Note Header */}
      <div
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-white font-medium">{note.title}</h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>By {note.author_name || 'Unknown'}</span>
              <span>•</span>
              <span>{new Date(note.created_at).toLocaleString()}</span>
              {note.attachments && note.attachments.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-primary">📎 {note.attachments.length} file{note.attachments.length > 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>
          <motion.svg
            className="w-5 h-5 text-gray-400 ml-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </div>

      {/* Note Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-4">
              {/* Content */}
              <div className="prose prose-invert prose-sm max-w-none">
                {note.is_markdown ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      // Ensure paragraphs don't collapse
                      p: ({node, ...props}) => <p className="markdown-paragraph" {...props} />,
                      // Preserve line breaks
                      br: () => <br className="markdown-break" />,
                    }}
                  >
                    {note.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                )}
              </div>

              {/* Attachments */}
              {note.attachments && note.attachments.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-300">Attachments</h5>
                  <div className="space-y-2">
                    {note.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{getFileIcon(attachment.mime_type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {attachment.original_filename}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {formatFileSize(attachment.file_size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => notesAPI.downloadAttachment(attachment.id)}
                            className="text-primary hover:text-cyan-300 text-sm"
                            title="Download"
                          >
                            ⬇️
                          </button>
                          {isAdminView && (
                            <button
                              onClick={() => onDeleteAttachment(attachment.id)}
                              className="text-rose-400 hover:text-rose-300 text-sm"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Zone - Admin Only */}
              {isAdminView && (
                <div
                  {...dropzone.getRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer',
                    dropzone.isDragActive
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-600 hover:border-primary/50',
                    uploading && 'opacity-50 cursor-wait'
                  )}
                >
                  <input {...dropzone.getInputProps()} />
                  {uploading ? (
                    <div className="text-primary">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-300 text-sm mb-1">
                        📎 Drop files here or click to upload
                      </p>
                      <p className="text-gray-500 text-xs">
                        PDF, Word, or Text files (max 10MB)
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Actions */}
              {isAdminView && (
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(note);
                    }}
                    className="text-sm px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded border border-primary/50 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(note.id);
                    }}
                    className="text-sm px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded border border-rose-500/50 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
