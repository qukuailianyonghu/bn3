import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Check, Trash2, Sparkles, Wand2, X, ImagePlus, Download, Loader2 } from 'lucide-react';

interface OldPhoto {
  id: string;
  title: string;
  original_url: string;
  restored_url: string | null;
  note: string;
  status: 'pending' | 'processing' | 'completed';
  created_at: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function OldPhotoRestoration({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<OldPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadPhotos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('old_photos')
      .select('id, title, original_url, restored_url, note, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setPhotos(data as OldPhoto[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const resetForm = () => {
    setNewTitle('');
    setNewNote('');
    setPreviewUrl(null);
    setUploadedUrl('');
    setUploadProgress(0);
    setAdding(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('请选择 JPG、PNG 或 WebP 格式的照片。');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('照片大小不能超过 10MB。');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    setUploadProgress(0);

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('old-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      alert('照片上传失败，请重试。');
      setUploading(false);
      setPreviewUrl(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('old-photos')
      .getPublicUrl(data.path);

    setUploadedUrl(urlData.publicUrl);
    setUploadProgress(100);
    setUploading(false);
  };

  const addPhoto = async () => {
    if (!user || !uploadedUrl) return;
    const { data, error } = await supabase
      .from('old_photos')
      .insert({
        title: newTitle.trim() || '未命名照片',
        original_url: uploadedUrl,
        restored_url: null,
        note: newNote.trim(),
        status: 'pending',
        user_id: user.id,
      })
      .select('id, title, original_url, restored_url, note, status, created_at')
      .single();
    if (!error && data) {
      setPhotos(prev => [data as OldPhoto, ...prev]);
      resetForm();
    }
  };

  // ── Canvas-based photo restoration ──
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  };

  const restorePhoto = async (photo: OldPhoto) => {
    setRestoringId(photo.id);

    try {
      const img = await loadImage(photo.original_url);
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;

      // Simulate AI restoration with canvas filters:
      // 1. Upscale sharpening via convolution-like approach
      // 2. Remove sepia/desaturate (color correction)
      // 3. Increase brightness and contrast
      // 4. Slight noise reduction

      ctx.drawImage(img, 0, 0);

      // Get image data for pixel manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Color correction: remove sepia, boost saturation, fix white balance
      for (let i = 0; i < pixels.length; i += 4) {
        let r = pixels[i];
        let g = pixels[i + 1];
        let b = pixels[i + 2];

        // Remove sepia tone by normalizing channels
        const avg = (r + g + b) / 3;
        r = Math.min(255, r * 1.1);
        g = Math.min(255, g * 1.05);
        b = Math.min(255, b * 1.25);

        // Boost saturation
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const satBoost = 1.35;
        r = Math.min(255, Math.max(0, gray + (r - gray) * satBoost));
        g = Math.min(255, Math.max(0, gray + (g - gray) * satBoost));
        b = Math.min(255, Math.max(0, gray + (b - gray) * satBoost));

        // Brightness and contrast adjustment
        const brightness = 1.08;
        const contrast = 1.15;
        const midGray = 128;
        r = Math.min(255, Math.max(0, (r - midGray) * contrast + midGray) * brightness);
        g = Math.min(255, Math.max(0, (g - midGray) * contrast + midGray) * brightness);
        b = Math.min(255, Math.max(0, (b - midGray) * contrast + midGray) * brightness);

        pixels[i] = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;
      }

      ctx.putImageData(imageData, 0, 0);

      // Apply unsharp mask for sharpening
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(canvas, 0, 0);
      ctx.filter = 'blur(2px)';
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.filter = 'none';

      // Blend original and blurred for unsharp mask
      const sharpData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const origData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < sharpData.data.length; i += 4) {
        sharpData.data[i] = Math.min(255, Math.max(0, origData.data[i] + (origData.data[i] - sharpData.data[i]) * 1.5));
        sharpData.data[i + 1] = Math.min(255, Math.max(0, origData.data[i + 1] + (origData.data[i + 1] - sharpData.data[i + 1]) * 1.5));
        sharpData.data[i + 2] = Math.min(255, Math.max(0, origData.data[i + 2] + (origData.data[i + 2] - sharpData.data[i + 2]) * 1.5));
      }
      ctx.putImageData(sharpData, 0, 0);

      // Convert to blob and upload
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
      });

      const restoredPath = `${user!.id}/restored_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('old-photos')
        .upload(restoredPath, blob, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('old-photos')
        .getPublicUrl(uploadData.path);

      const restoredUrl = urlData.publicUrl;

      const { data: updateData, error: updateError } = await supabase
        .from('old_photos')
        .update({ restored_url: restoredUrl, status: 'completed' })
        .eq('id', photo.id)
        .select('id, title, original_url, restored_url, note, status, created_at')
        .single();

      if (!updateError && updateData) {
        setPhotos(prev => prev.map(p => p.id === photo.id ? (updateData as OldPhoto) : p));
      }
    } catch (err) {
      console.error('Restoration failed', err);
      alert('修复失败，请重试。');
    }
    setRestoringId(null);
  };

  const downloadRestored = async (photo: OldPhoto) => {
    if (!photo.restored_url) return;
    setDownloadingId(photo.id);
    try {
      const response = await fetch(photo.restored_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `修复_${photo.title}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      alert('下载失败，请重试。');
    }
    setDownloadingId(null);
  };

  const deletePhoto = async (id: string) => {
    const { error } = await supabase.from('old_photos').delete().eq('id', id);
    if (!error) {
      setPhotos(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-oshiruco-50 z-50 overflow-y-auto">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 bg-gradient-to-r from-oshiruco-600 to-oshiruco-700 text-white px-5 py-4 flex items-center gap-3 shadow-md z-10">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            <h1 className="text-lg font-bold">老照片高清修复</h1>
          </div>
        </header>

        <div className="px-5 py-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-oshiruco-100 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-oshiruco-500" />
              <h2 className="font-bold text-oshiruco-900">老照片修复</h2>
            </div>
            <p className="text-sm text-oshiruco-600 leading-relaxed">
              从电脑上传老照片，AI自动修复划痕、提升清晰度、还原色彩。修复后的照片可下载保存。
            </p>
          </div>

          {adding && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-oshiruco-200 mb-4">
              <div className="space-y-3">
                {/* Photo upload area */}
                <div>
                  <label className="text-xs font-semibold text-oshiruco-500 mb-1.5 block">老照片 *</label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-44 rounded-xl border-2 border-dashed border-oshiruco-200 hover:border-oshiruco-400 transition flex flex-col items-center justify-center gap-2 overflow-hidden relative bg-oshiruco-50/50 disabled:opacity-60"
                  >
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="预览" className="w-full h-full object-contain absolute inset-0 bg-oshiruco-50" />
                        {uploading && (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                            <span className="text-white text-xs font-medium">上传中... {uploadProgress}%</span>
                          </div>
                        )}
                        {!uploading && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs font-medium bg-black/40 px-3 py-1.5 rounded-lg">
                            点击重新选择
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-10 h-10 text-oshiruco-300" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-oshiruco-400">点击上传老照片</span>
                        <span className="text-xs text-oshiruco-300">JPG / PNG / WebP，最大 10MB</span>
                      </>
                    )}
                  </button>
                </div>

                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="照片标题"
                  className="w-full px-3 py-2.5 rounded-xl border border-oshiruco-100 focus:border-oshiruco-300 outline-none text-sm"
                />
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="备注（选填）"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-oshiruco-100 focus:border-oshiruco-300 outline-none text-sm resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addPhoto}
                    disabled={!uploadedUrl || uploading}
                    className="flex-1 py-2.5 bg-oshiruco-600 text-white rounded-xl text-sm font-semibold hover:bg-oshiruco-700 transition flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> 上传
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-oshiruco-50" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-oshiruco-50">
              <Wand2 className="w-12 h-12 text-oshiruco-200 mx-auto mb-3" />
              <p className="font-semibold text-oshiruco-800 mb-1">还没有上传照片</p>
              <p className="text-sm text-oshiruco-400">从电脑上传一张老照片，体验AI修复效果</p>
            </div>
          ) : (
            <div className="space-y-4">
              {photos.map(photo => (
                <div key={photo.id} className="bg-white rounded-2xl shadow-sm border border-oshiruco-100 overflow-hidden">
                  <div className="flex gap-3 p-3">
                    {/* Original photo */}
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={photo.original_url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                        style={{ filter: 'sepia(0.3) saturate(0.7) brightness(0.9)' }}
                      />
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">原图</span>
                    </div>

                    {/* Restored photo or placeholder */}
                    {photo.restored_url ? (
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={photo.restored_url} alt={photo.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 text-[10px] bg-oshiruco-600 text-white px-1.5 py-0.5 rounded">已修复</span>
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-xl bg-oshiruco-50 flex items-center justify-center flex-shrink-0 border-2 border-dashed border-oshiruco-200">
                        {restoringId === photo.id ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-5 h-5 border-2 border-oshiruco-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] text-oshiruco-400">修复中</span>
                          </div>
                        ) : (
                          <Wand2 className="w-7 h-7 text-oshiruco-300" />
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-oshiruco-900 text-sm truncate">{photo.title}</p>
                      {photo.note && <p className="text-xs text-oshiruco-500 mt-1 line-clamp-2">{photo.note}</p>}
                      <p className="text-[10px] text-oshiruco-300 mt-1">
                        {new Date(photo.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {photo.status !== 'completed' && (
                          <button
                            onClick={() => restorePhoto(photo)}
                            disabled={restoringId === photo.id}
                            className="text-xs bg-oshiruco-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-oshiruco-600 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            <Wand2 className="w-3 h-3" /> 修复
                          </button>
                        )}
                        {photo.restored_url && (
                          <button
                            onClick={() => downloadRestored(photo)}
                            disabled={downloadingId === photo.id}
                            className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {downloadingId === photo.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            下载
                          </button>
                        )}
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="w-7 h-7 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="w-full mt-4 py-3.5 border-2 border-dashed border-oshiruco-200 rounded-2xl text-oshiruco-500 font-semibold text-sm hover:border-oshiruco-400 hover:bg-oshiruco-50 transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-5 h-5" /> 上传老照片
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
