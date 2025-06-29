import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Heart, Reply, MoreVertical } from 'lucide-react';
import { useRealtime } from '../../hooks/useRealtime';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  thought_id: string;
  parent_id?: string;
  likes_count: number;
  created_at: string;
  user?: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface LiveCommentsProps {
  thoughtId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveComments({ thoughtId, isOpen, onClose }: LiveCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Subscribe to new comments
  useRealtime({
    table: 'comments',
    filter: `thought_id=eq.${thoughtId}`,
    onInsert: (payload) => {
      const comment = payload.new as Comment;
      setComments(prev => [comment, ...prev]);
    },
    onUpdate: (payload) => {
      const updatedComment = payload.new as Comment;
      setComments(prev => 
        prev.map(c => c.id === updatedComment.id ? updatedComment : c)
      );
    },
    onDelete: (payload) => {
      const deletedComment = payload.old as Comment;
      setComments(prev => prev.filter(c => c.id !== deletedComment.id));
    }
  });

  // Load initial comments
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !isOpen) return;

    const loadComments = async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            profiles!comments_user_id_fkey(username, full_name, avatar_url)
          `)
          .eq('thought_id', thoughtId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setComments(data || []);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };

    loadComments();
  }, [thoughtId, isOpen]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !isSupabaseConfigured() || !supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          content: newComment.trim(),
          thought_id: thoughtId,
          user_id: user.id,
          parent_id: replyTo
        }])
        .select()
        .single();

      if (error) throw error;

      setNewComment('');
      setReplyTo(null);

      // Create notification for thought author
      if (data) {
        await supabase.rpc('create_notification', {
          target_user_id: data.user_id, // This should be the thought author's ID
          notification_type: 'comment',
          notification_title: 'New Comment',
          notification_message: `${user.email} commented on your thought`,
          notification_data: { thought_id: thoughtId, comment_id: data.id }
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user || !isSupabaseConfigured() || !supabase) return;

    try {
      // Toggle like (simplified - in real app, check if already liked)
      const { error } = await supabase
        .from('comments')
        .update({ 
          likes_count: comments.find(c => c.id === commentId)?.likes_count + 1 || 1 
        })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Comments
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-2xl text-slate-600 dark:text-slate-400">×</span>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {comment.user?.username?.slice(0, 2).toUpperCase() || comment.user_id.slice(0, 2).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {comment.user?.full_name || comment.user?.username || 'Anonymous'}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-slate-700 dark:text-slate-300 mb-3">
                      {comment.content}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span>{comment.likes_count || 0}</span>
                      </button>
                      
                      <button
                        onClick={() => setReplyTo(comment.id)}
                        className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        <Reply className="w-4 h-4" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Form */}
        {user && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-700">
            {replyTo && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                Replying to comment
                <button
                  onClick={() => setReplyTo(null)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  Cancel
                </button>
              </div>
            )}
            
            <form onSubmit={handleSubmitComment} className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.email?.slice(0, 2).toUpperCase()}
              </div>
              
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}