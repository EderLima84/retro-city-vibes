import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface StoryUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function StoryUpload({ onClose, onSuccess }: StoryUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande! Máximo 10MB');
      return;
    }

    const isVideo = selectedFile.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!user || !file) return;

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      // Create story record
      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType
        });

      if (insertError) throw insertError;

      onSuccess();
    } catch (error) {
      console.error('Error uploading story:', error);
      toast.error('Erro ao publicar story');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Story</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!preview ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Label htmlFor="story-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar uma foto ou vídeo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Máximo 10MB
                  </p>
                </div>
              </Label>
              <Input
                id="story-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              {mediaType === 'image' ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <video
                  src={preview}
                  className="w-full h-64 object-cover rounded-lg"
                  controls
                />
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? 'Publicando...' : 'Publicar Story'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
