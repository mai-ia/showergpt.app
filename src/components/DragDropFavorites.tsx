import React, { useState, useEffect, memo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Heart, GripVertical, X } from 'lucide-react';
import { ShowerThought } from '../types';
import { getUserFavorites, reorderFavorites } from '../services/thoughtsService';
import { useAuth } from '../contexts/AuthContext';
import ThoughtCard from './ThoughtCard';

interface DragDropFavoritesProps {
  onClose: () => void;
  refreshTrigger: number;
}

const DragDropFavorites = memo(function DragDropFavorites({ onClose, refreshTrigger }: DragDropFavoritesProps) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<ShowerThought[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, [refreshTrigger, user]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const userFavorites = await getUserFavorites(user?.id);
      setFavorites(userFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(favorites);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFavorites(items);

    try {
      await reorderFavorites(user?.id, items.map(item => item.id));
    } catch (error) {
      console.error('Error reordering favorites:', error);
      // Revert on error
      loadFavorites();
    }
  };

  const handleFavoriteChange = () => {
    loadFavorites();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-2xl shadow-lg">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Organize Favorites
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Drag and drop to reorder your favorite thoughts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading your favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 p-8 rounded-3xl max-w-md mx-auto">
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-red-100 to-red-200 dark:from-red-800 dark:to-red-700 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                    <Heart className="w-12 h-12 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
                  No favorites yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Save some thoughts to organize them here! 💭
                </p>
              </div>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="favorites">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`
                      grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-colors duration-200
                      ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4' : ''}
                    `}
                  >
                    {favorites.map((thought, index) => (
                      <Draggable key={thought.id} draggableId={thought.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              relative transition-all duration-200
                              ${snapshot.isDragging ? 'rotate-3 scale-105 z-50' : ''}
                            `}
                          >
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-2 right-2 z-10 p-2 bg-white dark:bg-slate-700 rounded-full shadow-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <GripVertical className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </div>

                            {/* Thought Card */}
                            <div className="group">
                              <ThoughtCard
                                thought={thought}
                                onFavoriteChange={handleFavoriteChange}
                              />
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
          )}
        </div>

        {/* Instructions */}
        {favorites.length > 0 && (
          <div className="px-6 pb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
                <GripVertical className="w-5 h-5" />
                <span className="font-medium">
                  Drag the grip icon to reorder your favorite thoughts
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if refreshTrigger changes
  return prevProps.refreshTrigger === nextProps.refreshTrigger;
});

export default DragDropFavorites;