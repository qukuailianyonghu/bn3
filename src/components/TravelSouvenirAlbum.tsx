import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Check, Trash2, Pencil, MapPin, Plane, Video, Download, Play, Loader2, X, ImagePlus, Upload, Music } from 'lucide-react';

interface Souvenir {
  id: string;
  title: string;
  destination: string;
  image_url: string;
  description: string;
  created_at: string;
}

const PHOTO_DURATION = 3;
const TRANSITION_DURATION = 0.8;
const FPS = 30;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function TravelSouvenirAlbum({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', destination: '', image_url: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSouvenirs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('travel_souvenirs')
      .select('id, title, destination, image_url, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setSouvenirs(data as Souvenir[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadSouvenirs();
  }, [loadSouvenirs]);

  const resetForm = () => {
    setForm({ title: '', destination: '', image_url: '', description: '' });
    setAdding(false);
    setEditingId(null);
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('请选择 JPG、PNG、WebP 或 GIF 格式的照片。');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('照片大小不能超过 10MB。');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    setUploadProgress(0);

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('travel-souvenirs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error', error);
      alert('照片上传失败，请重试。');
      setUploading(false);
      setPreviewUrl(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('travel-souvenirs')
      .getPublicUrl(data.path);

    setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    setUploadProgress(100);
    setUploading(false);
  };

  const submit = async () => {
    if (!user || !form.title.trim() || !form.image_url.trim()) return;
    setSubmitting(true);
    if (editingId) {
      const { data, error } = await supabase
        .from('travel_souvenirs')
        .update({
          title: form.title.trim(),
          destination: form.destination.trim(),
          image_url: form.image_url.trim(),
          description: form.description.trim(),
        })
        .eq('id', editingId)
        .select('id, title, destination, image_url, description, created_at')
        .single();
      if (!error && data) {
        setSouvenirs(prev => prev.map(s => s.id === editingId ? (data as Souvenir) : s));
      }
    } else {
      const { data, error } = await supabase
        .from('travel_souvenirs')
        .insert({
          title: form.title.trim(),
          destination: form.destination.trim(),
          image_url: form.image_url.trim(),
          description: form.description.trim(),
          user_id: user.id,
        })
        .select('id, title, destination, image_url, description, created_at')
        .single();
      if (!error && data) {
        setSouvenirs(prev => [data as Souvenir, ...prev]);
      }
    }
    setSubmitting(false);
    resetForm();
  };

  const startEdit = (s: Souvenir) => {
    setEditingId(s.id);
    setForm({ title: s.title, destination: s.destination, image_url: s.image_url, description: s.description });
    setPreviewUrl(s.image_url);
    setAdding(true);
  };

  const deleteSouvenir = async (id: string) => {
    const { error } = await supabase.from('travel_souvenirs').delete().eq('id', id);
    if (!error) {
      setSouvenirs(prev => prev.filter(s => s.id !== id));
    }
  };

  // ── Background music generation (Web Audio API) ──
  const createBackgroundMusic = (audioCtx: AudioContext, duration: number): MediaStream => {
    const dest = audioCtx.createMediaStreamDestination();
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(dest);

    // Gentle reverb-like effect using a lowpass filter
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    filter.connect(masterGain);

    // Soft melody in C major pentatonic — warm and nostalgic
    const notes = [
      { freq: 523.25, time: 0, dur: 1.5 },    // C5
      { freq: 587.33, time: 1.2, dur: 1.5 },   // D5
      { freq: 659.25, time: 2.4, dur: 1.5 },   // E5
      { freq: 783.99, time: 3.6, dur: 2.0 },   // G5
      { freq: 659.25, time: 5.2, dur: 1.5 },   // E5
      { freq: 587.33, time: 6.4, dur: 1.5 },   // D5
      { freq: 523.25, time: 7.6, dur: 2.0 },   // C5
      { freq: 440.00, time: 9.2, dur: 1.5 },   // A4
      { freq: 523.25, time: 10.4, dur: 2.0 },  // C5
      { freq: 659.25, time: 12.0, dur: 2.0 },  // E5
      { freq: 587.33, time: 13.6, dur: 1.5 },  // D5
      { freq: 523.25, time: 14.8, dur: 2.5 },  // C5
    ];

    const playNote = (freq: number, startTime: number, noteDur: number) => {
      const noteCount = Math.ceil(duration / 16);
      for (let loop = 0; loop < noteCount; loop++) {
        const t = startTime + loop * 16;
        if (t >= duration) break;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        // Soft attack and gentle release
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + noteDur);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + noteDur + 0.1);

        // Add a soft harmonic (one octave up, quieter)
        const harmOsc = audioCtx.createOscillator();
        const harmGain = audioCtx.createGain();
        harmOsc.type = 'sine';
        harmOsc.frequency.value = freq * 2;
        harmGain.gain.setValueAtTime(0, t);
        harmGain.gain.linearRampToValueAtTime(0.08, t + 0.1);
        harmGain.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
        harmOsc.connect(harmGain);
        harmGain.connect(filter);
        harmOsc.start(t);
        harmOsc.stop(t + noteDur + 0.1);
      }
    };

    // Play melody notes
    notes.forEach(note => playNote(note.freq, note.time, note.dur));

    // Add a soft bass drone for warmth
    const bassOsc = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = 130.81; // C3
    bassGain.gain.value = 0.08;
    bassOsc.connect(bassGain);
    bassGain.connect(filter);
    bassOsc.start(0);
    bassOsc.stop(duration);

    // Slow LFO on bass for gentle movement
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(bassGain.gain);
    lfo.start(0);
    lfo.stop(duration);

    return dest.stream;
  };

  // ── Video generation ──
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  };

  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number, y: number, w: number, h: number,
    zoom: number, panX: number, panY: number,
  ) => {
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let drawW: number, drawH: number;
    if (imgRatio > boxRatio) {
      drawH = h * zoom;
      drawW = drawH * imgRatio;
    } else {
      drawW = w * zoom;
      drawH = drawW / imgRatio;
    }
    const dx = x + (w - drawW) / 2 + panX;
    const dy = y + (h - drawH) / 2 + panY;
    ctx.drawImage(img, dx, dy, drawW, drawH);
  };

  const generateVideo = async () => {
    if (souvenirs.length === 0) return;
    setGenerating(true);
    setGenProgress(0);

    try {
      const photos = souvenirs.slice(0, 10);
      const images: HTMLImageElement[] = [];
      for (let i = 0; i < photos.length; i++) {
        try {
          const img = await loadImage(photos[i].image_url);
          images.push(img);
          setGenProgress(Math.round(((i + 1) / photos.length) * 30));
        } catch {
          // skip images that fail to load
        }
      }

      if (images.length === 0) {
        alert('无法加载照片，请重试。');
        setGenerating(false);
        return;
      }

      const canvas = canvasRef.current!;
      const W = 720;
      const H = 1280;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      const totalFrames = Math.ceil(images.length * PHOTO_DURATION * FPS);

      const videoStream = canvas.captureStream(FPS);

      // Create audio context and generate soft background music
      const audioCtx = new AudioContext();
      const totalDuration = images.length * PHOTO_DURATION + 1;
      const audioStream = createBackgroundMusic(audioCtx, totalDuration);

      // Combine video + audio into one stream
      const combinedStream = new MediaStream();
      videoStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
      audioStream.getAudioTracks().forEach(t => combinedStream.addTrack(t));

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 4_000_000,
        audioBitsPerSecond: 128_000,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      const recordingDone = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });
      recorder.start();

      // Resume audio context (needed for autoplay policy)
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      for (let frame = 0; frame < totalFrames; frame++) {
        const t = frame / FPS;
        const segmentIndex = Math.floor(t / PHOTO_DURATION);
        const segmentT = (t % PHOTO_DURATION) / PHOTO_DURATION;
        const imgIndex = Math.min(segmentIndex, images.length - 1);

        const zoom = 1.0 + 0.15 * segmentT;
        const panX = Math.sin(segmentT * Math.PI) * 20 * (imgIndex % 2 === 0 ? 1 : -1);
        const panY = Math.cos(segmentT * Math.PI) * 15;

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);

        drawImageCover(ctx, images[imgIndex], 0, 0, W, H, zoom, panX, panY);

        const grad = ctx.createLinearGradient(0, H * 0.6, 0, H);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, H * 0.6, W, H * 0.4);

        const photo = photos[imgIndex];
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.fillText(photo.title, W / 2, H - 80);

        if (photo.destination) {
          ctx.font = '24px sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillText(photo.destination, W / 2, H - 40);
        }
        ctx.shadowBlur = 0;

        if (segmentT < TRANSITION_DURATION / PHOTO_DURATION && imgIndex > 0) {
          const fadeAlpha = 1 - segmentT / (TRANSITION_DURATION / PHOTO_DURATION);
          ctx.globalAlpha = fadeAlpha;
          const prevZoom = 1.0 + 0.15;
          drawImageCover(ctx, images[imgIndex - 1], 0, 0, W, H, prevZoom, 0, 0);
          ctx.globalAlpha = 1;
          ctx.fillStyle = grad;
          ctx.fillRect(0, H * 0.6, W, H * 0.4);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px sans-serif';
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 8;
          ctx.fillText(photo.title, W / 2, H - 80);
          if (photo.destination) {
            ctx.font = '24px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(photo.destination, W / 2, H - 40);
          }
          ctx.shadowBlur = 0;
        }

        setGenProgress(30 + Math.round((frame / totalFrames) * 70));
        await new Promise((r) => setTimeout(r, 1000 / FPS));
      }

      for (let i = 0; i < FPS; i++) {
        ctx.fillStyle = `rgba(26,26,46,${i / FPS})`;
        ctx.fillRect(0, 0, W, H);
        await new Promise((r) => setTimeout(r, 1000 / FPS));
      }

      recorder.stop();
      await recordingDone;

      // Clean up audio context
      audioCtx.close();

      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setShowVideo(true);
      setGenerating(false);
      setGenProgress(100);
    } catch (err) {
      console.error('Video generation failed', err);
      alert('视频生成失败，请重试。');
      setGenerating(false);
    }
  };

  const downloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = '旅行纪念册视频.webm';
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-oshiruco-50 z-50 overflow-y-auto">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 bg-gradient-to-r from-oshiruco-600 to-oshiruco-700 text-white px-5 py-4 flex items-center gap-3 shadow-md z-10">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            <h1 className="text-lg font-bold">旅行纪念册</h1>
          </div>
        </header>

        <div className="px-5 py-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-oshiruco-100 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="w-5 h-5 text-oshiruco-500" />
              <h2 className="font-bold text-oshiruco-900">旅行纪念册</h2>
            </div>
            <p className="text-sm text-oshiruco-600 leading-relaxed">
              上传你的旅行照片，收藏每一段旅途的美好瞬间。上传后可一键生成带背景音乐的旅行回忆视频。
            </p>
          </div>

          {/* Generate Video Button */}
          {souvenirs.length >= 2 && !generating && !showVideo && (
            <button
              onClick={generateVideo}
              className="w-full mb-5 py-4 bg-gradient-to-r from-oshiruco-500 to-oshiruco-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-oshiruco-500/30 hover:shadow-oshiruco-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              生成旅行回忆视频（含背景音乐）
            </button>
          )}

          {/* Generating progress */}
          {generating && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-oshiruco-100 mb-5 text-center">
              <Loader2 className="w-10 h-10 text-oshiruco-500 mx-auto mb-3 animate-spin" />
              <p className="font-semibold text-oshiruco-800 text-sm mb-2">正在生成旅行回忆视频...</p>
              <div className="w-full h-2 bg-oshiruco-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-oshiruco-400 to-oshiruco-600 rounded-full transition-all duration-300"
                  style={{ width: `${genProgress}%` }}
                />
              </div>
              <p className="text-xs text-oshiruco-400 mt-2">{genProgress}%</p>
            </div>
          )}

          {/* Video result */}
          {showVideo && videoUrl && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-oshiruco-100 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-oshiruco-600" />
                  <h3 className="font-bold text-oshiruco-900 text-sm">旅行回忆视频已生成</h3>
                <span className="flex items-center gap-1 text-[10px] text-oshiruco-400"><Music className="w-3 h-3" />含背景音乐</span>
                </div>
                <button
                  onClick={() => { setShowVideo(false); if (videoUrl) URL.revokeObjectURL(videoUrl); setVideoUrl(null); }}
                  className="w-7 h-7 rounded-full bg-oshiruco-50 text-oshiruco-400 flex items-center justify-center hover:bg-oshiruco-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                className="w-full rounded-xl max-h-[400px] object-contain bg-black"
              />
              <button
                onClick={downloadVideo}
                className="w-full mt-3 py-2.5 bg-oshiruco-600 text-white rounded-xl text-sm font-semibold hover:bg-oshiruco-700 transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> 下载视频
              </button>
            </div>
          )}

          {adding && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-oshiruco-200 mb-4">
              <div className="space-y-3">
                {/* Photo upload area */}
                <div>
                  <label className="text-xs font-semibold text-oshiruco-500 mb-1.5 block">照片 *</label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-40 rounded-xl border-2 border-dashed border-oshiruco-200 hover:border-oshiruco-400 transition flex flex-col items-center justify-center gap-2 overflow-hidden relative bg-oshiruco-50/50 disabled:opacity-60"
                  >
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="预览" className="w-full h-full object-cover absolute inset-0" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-white animate-spin" />
                              <span className="text-white text-xs font-medium">上传中... {uploadProgress}%</span>
                            </div>
                          ) : (
                            <span className="text-white text-xs font-medium bg-black/40 px-3 py-1.5 rounded-lg">点击重新选择</span>
                          )}
                        </div>
                      </>
                    ) : uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-oshiruco-400 animate-spin" />
                        <span className="text-oshiruco-400 text-xs font-medium">上传中... {uploadProgress}%</span>
                      </div>
                    ) : (
                      <>
                        <ImagePlus className="w-10 h-10 text-oshiruco-300" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-oshiruco-400">点击上传照片</span>
                        <span className="text-xs text-oshiruco-300">JPG / PNG / WebP / GIF，最大 10MB</span>
                      </>
                    )}
                  </button>
                </div>

                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="标题 *"
                  className="w-full px-3 py-2.5 rounded-xl border border-oshiruco-100 focus:border-oshiruco-300 outline-none text-sm"
                />
                <input
                  value={form.destination}
                  onChange={e => setForm({ ...form, destination: e.target.value })}
                  placeholder="目的地"
                  className="w-full px-3 py-2.5 rounded-xl border border-oshiruco-100 focus:border-oshiruco-300 outline-none text-sm"
                />
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="描述这段旅程的回忆..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-oshiruco-100 focus:border-oshiruco-300 outline-none text-sm resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={submit}
                    disabled={!form.title.trim() || !form.image_url.trim() || submitting || uploading}
                    className="flex-1 py-2.5 bg-oshiruco-600 text-white rounded-xl text-sm font-semibold hover:bg-oshiruco-700 transition flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> {editingId ? '保存' : '添加'}
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
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-white rounded-2xl animate-pulse border border-oshiruco-50" />
              ))}
            </div>
          ) : souvenirs.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-oshiruco-50">
              <Plane className="w-12 h-12 text-oshiruco-200 mx-auto mb-3" />
              <p className="font-semibold text-oshiruco-800 mb-1">还没有纪念照</p>
              <p className="text-sm text-oshiruco-400">上传你的第一张旅行纪念照吧！</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {souvenirs.map(s => (
                <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-oshiruco-100 overflow-hidden group">
                  <div className="relative h-32 overflow-hidden">
                    <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-1 right-1 flex gap-0.5">
                      <button
                        onClick={() => startEdit(s)}
                        className="w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteSouvenir(s.id)}
                        className="w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-red-500 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-2 right-2">
                      <p className="text-white font-bold text-xs truncate drop-shadow">{s.title}</p>
                      {s.destination && (
                        <p className="text-white/80 text-[10px] flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />{s.destination}
                        </p>
                      )}
                    </div>
                  </div>
                  {s.description && (
                    <p className="text-[11px] text-oshiruco-500 px-3 py-2 line-clamp-2 leading-relaxed">{s.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {!adding && (
            <button
              onClick={() => { setAdding(true); setEditingId(null); setForm({ title: '', destination: '', image_url: '', description: '' }); setPreviewUrl(null); }}
              className="w-full mt-4 py-3.5 border-2 border-dashed border-oshiruco-200 rounded-2xl text-oshiruco-500 font-semibold text-sm hover:border-oshiruco-400 hover:bg-oshiruco-50 transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-5 h-5" /> 上传纪念照
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
