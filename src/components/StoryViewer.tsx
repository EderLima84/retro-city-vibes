import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  expires_at: string;
  profile: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  hasViewed: boolean;
}

interface StoryGroup {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  stories: Story[];
  hasViewed: boolean;
}

interface StoryViewerProps {
  storyGroup: StoryGroup;
  onClose: () => void;
}

export default function StoryViewer({ storyGroup, onClose }: StoryViewerProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const currentStory = storyGroup.stories[currentIndex];
  const STORY_DURATION = 5000; // 5 seconds

  useEffect(() => {
    if (!isPaused) {
      startProgress();
    } else {
      stopProgress();
    }
    return () => stopProgress();
  }, [currentIndex, isPaused]);

  useEffect(() => {
    // Mark story as viewed
    if (user && currentStory && currentStory.user_id !== user.id) {
      markAsViewed(currentStory.id);
    }
  }, [currentIndex, user]);

  const startProgress = () => {
    setProgress(0);
    const startTime = Date.now();
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;
      
      if (newProgress >= 100) {
        goToNext();
      } else {
        setProgress(newProgress);
      }
    }, 50);
  };

  const stopProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const markAsViewed = async (storyId: string) => {
    if (!user) return;
    
    await supabase
      .from('story_views')
      .insert({
        story_id: storyId,
        viewer_id: user.id
      })
      .select()
      .single();
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < storyGroup.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Modal Container - Instagram Style */}
      <div 
        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl max-w-md w-full aspect-[9/16] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {storyGroup.stories.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage src={storyGroup.avatar_url || undefined} />
              <AvatarFallback>{storyGroup.display_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm">{storyGroup.display_name}</p>
              <p className="text-white/80 text-xs">
                {new Date(currentStory.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={togglePause}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Story content */}
        <div className="relative w-full h-full flex items-center justify-center">
          {currentStory.media_type === 'image' ? (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={currentStory.media_url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
            />
          )}

          {/* Navigation areas */}
          <div className="absolute inset-0 flex">
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={goToPrevious}
            />
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={togglePause}
            />
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={goToNext}
            />
          </div>
        </div>

        {/* Navigation buttons */}
        {currentIndex > 0 && (
          <Button
            size="icon"
            variant="ghost"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:bg-white/20 opacity-70 hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        {currentIndex < storyGroup.stories.length - 1 && (
          <Button
            size="icon"
            variant="ghost"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:bg-white/20 opacity-70 hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
}
