
import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/components/ui/use-toast';
import { Upload, X, File, Film, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const MediaUpload = ({ onUploadComplete, bucketName, parentId }) => {
  const { selectedLocation } = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const uploadFile = useCallback(async (file, id) => {
    if (!selectedLocation) {
      toast({ title: "No location selected", description: "Please select a location before uploading.", variant: "destructive" });
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${selectedLocation.id}/${parentId}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      setUploadingFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: error.message } : f));
      toast({ title: `Upload failed for ${file.name}`, description: error.message, variant: 'destructive' });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    setUploadingFiles(prev => prev.filter(f => f.id !== id));
    onUploadComplete({ url: publicUrl, type: file.type, name: file.name });
    
    return publicUrl;
  }, [selectedLocation, parentId, bucketName, toast, onUploadComplete]);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const newFiles = files.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      status: 'uploading',
      progress: 0,
    }));
    
    setUploadingFiles(prev => [...prev, ...newFiles]);

    for (const fileObj of newFiles) {
        await uploadFile(fileObj.file, fileObj.id);
    }
  };

  const cancelUpload = (id) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <File className="h-6 w-6 text-primary" />;
    }
    if (file.type.startsWith('video/')) {
      return <Film className="h-6 w-6 text-primary" />;
    }
    return <File className="h-6 w-6 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      <div
        className="flex justify-center items-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleFileSelect}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">Images or videos (up to 50MB each)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploadingFiles.some(f => f.status === 'uploading')}
        />
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map(upload => (
            <div key={upload.id} className="flex items-center p-2 bg-muted rounded-lg">
              {getFileIcon(upload.file)}
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium truncate">{upload.file.name}</p>
                {upload.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {upload.status === 'error' && <p className="text-xs text-destructive">{upload.error}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => cancelUpload(upload.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
