import React, { useState } from 'react';
import { User, Mail, Calendar, Edit3, Save, X, LogOut, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, userProfile, updateProfile, signOut, deleteAccount } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    display_name: userProfile?.display_name || user?.user_metadata?.display_name || '',
    bio: userProfile?.bio || '',
    favorite_mood: userProfile?.favorite_mood || 'philosophical'
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');

    try {
      await deleteAccount();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-blue-200">
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-200 p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">User Profile</h1>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                title="Edit Profile"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {userProfile?.display_name || user?.user_metadata?.display_name || 'Shower Thinker'}
            </h2>
            <p className="text-slate-600 flex items-center justify-center gap-2 mt-2">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
            {user?.email_confirmed_at && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Verified</span>
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Display Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none"
                  placeholder="How should we call you?"
                />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-800">
                  {userProfile?.display_name || user?.user_metadata?.display_name || 'Not set'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-800 min-h-[80px]">
                  {userProfile?.bio || 'No bio yet'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Favorite Thought Style
              </label>
              {isEditing ? (
                <select
                  value={formData.favorite_mood}
                  onChange={(e) => setFormData(prev => ({ ...prev, favorite_mood: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none"
                >
                  <option value="philosophical">🤔 Philosophical</option>
                  <option value="humorous">😄 Humorous</option>
                  <option value="scientific">🔬 Scientific</option>
                </select>
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-800">
                  {userProfile?.favorite_mood === 'philosophical' && '🤔 Philosophical'}
                  {userProfile?.favorite_mood === 'humorous' && '😄 Humorous'}
                  {userProfile?.favorite_mood === 'scientific' && '🔬 Scientific'}
                  {!userProfile?.favorite_mood && '🤔 Philosophical (default)'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Member Since
              </label>
              <div className="px-4 py-3 bg-slate-50 rounded-2xl text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 rounded-2xl border-2 bg-red-50 border-red-200 text-red-700">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl border-2 bg-green-50 border-green-200 text-green-700">
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {isEditing ? (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-400 disabled:to-green-500 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-4 rounded-2xl transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleSignOut}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-red-200">
            <div className="text-center">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Delete Account?</h3>
              <p className="text-slate-600 mb-6">
                This will permanently delete your account and all your shower thoughts. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-2xl hover:bg-slate-300 transition-all duration-300 font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all duration-300 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}