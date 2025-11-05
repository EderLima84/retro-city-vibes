import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import StoryViewer from './StoryViewer';
import StoryUpload from './StoryUpload';

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

export default function Stories() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [myStories, setMyStories] = useState<Story[]>([]);

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user]);

  const loadStories = async () => {
    if (!user) return;

    // Load all active stories with profile info
    const { data: storiesData, error } = await supabase
      .from('stories')
      .select(`
        *,
        profiles!stories_user_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading stories:', error);
      return;
    }

    // Load viewed stories
    const { data: viewsData } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('viewer_id', user.id);

    const viewedStoryIds = new Set(viewsData?.map(v => v.story_id) || []);

    // Group stories by user and check if viewed
    const grouped = (storiesData || []).reduce((acc: StoryGroup[], story: any) => {
      const hasViewed = viewedStoryIds.has(story.id);
      const storyWithView = {
        ...story,
        profile: story.profiles,
        hasViewed
      };

      const existingGroup = acc.find(g => g.user_id === story.user_id);
      if (existingGroup) {
        existingGroup.stories.push(storyWithView);
        // Group is viewed only if all stories are viewed
        existingGroup.hasViewed = existingGroup.hasViewed && hasViewed;
      } else {
        acc.push({
          user_id: story.user_id,
          username: story.profiles.username,
          display_name: story.profiles.display_name,
          avatar_url: story.profiles.avatar_url,
          stories: [storyWithView],
          hasViewed
        });
      }
      return acc;
    }, []);

    // Separate my stories from others
    const mine = grouped.filter(g => g.user_id === user.id);
    const others = grouped.filter(g => g.user_id !== user.id);
    
    if (mine.length > 0) {
      setMyStories(mine[0].stories);
    } else {
      setMyStories([]);
    }

    // Sort: unviewed first, then by most recent
    others.sort((a, b) => {
      if (a.hasViewed !== b.hasViewed) {
        return a.hasViewed ? 1 : -1;
      }
      return new Date(b.stories[0].created_at).getTime() - new Date(a.stories[0].created_at).getTime();
    });

    setStoryGroups(others);
  };

  const handleStoryClick = (group: StoryGroup) => {
    setSelectedGroup(group);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    loadStories();
    toast.success('Story publicado!');
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 px-4">
        {/* My story button */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div
            onClick={() => myStories.length > 0 ? handleStoryClick({
              user_id: user!.id,
              username: '',
              display_name: 'Seu Story',
              avatar_url: null,
              stories: myStories,
              hasViewed: false
            }) : setShowUpload(true)}
            className="relative cursor-pointer"
          >
            <div className={`p-1 rounded-full ${myStories.length > 0 ? 'bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500' : 'bg-muted'}`}>
              <Avatar className="h-16 w-16 border-2 border-background">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>Você</AvatarFallback>
              </Avatar>
            </div>
            {myStories.length === 0 && (
              <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1">
                <Plus className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
          <span className="text-xs text-center max-w-[70px] truncate">
            {myStories.length > 0 ? 'Seu Story' : 'Adicionar'}
          </span>
        </div>

        {/* Other users' stories */}
        {storyGroups.map(group => (
          <div
            key={group.user_id}
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
            onClick={() => handleStoryClick(group)}
          >
            <div className={`p-1 rounded-full ${!group.hasViewed ? 'bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500' : 'bg-muted'}`}>
              <Avatar className="h-16 w-16 border-2 border-background">
                <AvatarImage src={group.avatar_url || undefined} />
                <AvatarFallback>{group.display_name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs text-center max-w-[70px] truncate">
              {group.display_name}
            </span>
          </div>
        ))}
      </div>

      {selectedGroup && (
        <StoryViewer
          storyGroup={selectedGroup}
          onClose={() => {
            setSelectedGroup(null);
            loadStories();
          }}
        />
      )}

      {showUpload && (
        <StoryUpload
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </>
  );
}
