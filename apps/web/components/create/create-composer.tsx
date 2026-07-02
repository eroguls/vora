'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChevronDown, FileAudio, FileImage, GripVertical, Loader2, MapPin, Trash2, UploadCloud } from 'lucide-react';
import { Button, Input, Textarea } from '@vora/ui';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

const formSchema = z.object({
  title: z.string().max(180).optional(),
  body: z.string().max(80000).optional(),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE', 'UNLISTED']).default('PUBLIC'),
  language: z.string().min(2).max(16).default('tr'),
  locationId: z.string().optional(),
});

type ComposerForm = z.infer<typeof formSchema>;

interface SelectedFile {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  error: string | null;
  uploaded?: Omit<PresignedUpload, 'uploadUrl'>;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

interface PresignedUpload {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
}

export function CreateComposer() {
  const router = useRouter();
  const token = useAuthStore((state) => state.accessToken);
  const [files, setFiles] = React.useState<SelectedFile[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [locations, setLocations] = React.useState<Array<{ id: string; country: string; city: string | null }>>([]);
  const form = useForm<ComposerForm>({ defaultValues: { visibility: 'PUBLIC', language: 'tr' } });

  React.useEffect(() => {
    api.get<Array<{ id: string; country: string; city: string | null }>>('/locations').then(setLocations).catch(() => setLocations([]));
  }, []);

  const addFiles = async (incoming: FileList | File[]) => {
    const next = await Promise.all(
      Array.from(incoming).map(async (file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        error: null,
        metadata: await readMetadata(file),
      })),
    );
    setFiles((current) => [...current, ...next].slice(0, 12));
  };

  const removeFile = (id: string) => {
    setFiles((current) => {
      const item = current.find((file) => file.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return current.filter((file) => file.id !== id);
    });
  };

  const moveFile = (id: string, direction: -1 | 1) => {
    setFiles((current) => {
      const index = current.findIndex((file) => file.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const submit = async (rawValues: ComposerForm, saveAsDraft = false) => {
    const values = formSchema.parse(rawValues);
    if (!token) {
      router.push('/login');
      return;
    }
    if (!values.title && !values.body && files.length === 0) {
      setMessage('Paylaşmak için bir şey yaz veya medya ekle.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const uploaded = [];
      for (let index = 0; index < files.length; index += 1) {
        const selected = files[index];
        try {
          const result: PresignedUpload = selected.uploaded
            ? { ...selected.uploaded, uploadUrl: '' }
            : await api.post<PresignedUpload>('/upload/presign', { fileName: selected.file.name, contentType: selected.file.type, fileSize: selected.file.size });
          if (!selected.uploaded) await uploadWithProgress(result.uploadUrl, selected.file, (progress) => setFiles((current) => current.map((item) => (item.id === selected.id ? { ...item, progress } : item))));
          uploaded.push({
            mediaType: result.mediaType,
            storageKey: result.storageKey,
            publicUrl: result.publicUrl,
            thumbnailUrl: result.mediaType === 'IMAGE' ? result.publicUrl : null,
            mimeType: selected.file.type,
            width: selected.metadata.width ?? null,
            height: selected.metadata.height ?? null,
            duration: selected.metadata.duration ?? null,
            fileSize: selected.file.size,
            sortOrder: index,
          });
        } catch (error) {
          setFiles((current) => current.map((item) => (item.id === selected.id ? { ...item, error: (error as Error).message || 'Yükleme başarısız' } : item)));
          throw error;
        }
      }
      const content = await api.post<{ author: { username: string }; slug: string }>('/content', {
        title: values.title || null,
        body: values.body || null,
        visibility: values.visibility,
        language: values.language,
        originalLanguage: values.language,
        locationId: values.locationId || null,
        media: uploaded,
        saveAsDraft,
      });
      router.push(`/@${content.author.username}/${content.slug}`);
    } catch (error) {
      setMessage((error as Error).message || 'Paylaşım tamamlanamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasLongVideo = files.some((item) => item.file.type.startsWith('video/') && (item.metadata.duration ?? 0) >= 180);

  return (
    <form className="space-y-4 bg-neutral-50 p-4" onSubmit={form.handleSubmit((values) => submit(values, false))}>
      <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Ne paylaşmak istiyorsun?</h2>
            <p className="mt-1 text-sm text-neutral-500">Yaz, medya ekle, paylaş. Türünü Vora otomatik anlar.</p>
          </div>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">Otomatik</span>
        </div>
        <Textarea id="body" rows={8} className="mt-4 text-base" placeholder="Bugün ne fark ettin? Bir gözlem, kısa not, hikaye veya rehber yaz..." {...form.register('body')} />
        <div className="mt-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center transition-colors hover:border-cyan-300 hover:bg-cyan-50/40" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void addFiles(event.dataTransfer.files); }}>
          <UploadCloud className="mx-auto h-7 w-7 text-cyan-600" />
          <p className="mt-2 text-sm font-semibold">Fotoğraf, video veya ses ekle</p>
          <p className="text-xs text-neutral-500">İstersen boş bırak; sadece yazı da paylaşabilirsin.</p>
          <label className="focus-ring mt-3 inline-flex cursor-pointer rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50">
            Medya seç
            <input className="sr-only" type="file" multiple accept="image/*,video/*,audio/*" onChange={(event) => event.target.files && void addFiles(event.target.files)} />
          </label>
        </div>
      </section>

      {files.length ? (
        <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Eklenen medya</h2>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{files.length}/12</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {files.map((item, index) => (
            <div key={item.id} className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3">
              <button type="button" className="focus-ring rounded-md p-2 text-neutral-500 hover:bg-neutral-100" aria-label="Sıralama tutamacı" onClick={() => moveFile(item.id, index === 0 ? 1 : -1)}>
                <GripVertical className="h-4 w-4" />
              </button>
              <Preview item={item} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{item.file.name}</p>
                <p className="text-neutral-500">{Math.round(item.file.size / 1024)} KB · {item.file.type || 'dosya'}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full bg-cyan-600" style={{ width: `${item.progress}%` }} />
                </div>
                {item.error ? <p className="mt-1 text-red-600">{item.error}</p> : null}
              </div>
              <button type="button" className="focus-ring rounded-md p-2 text-neutral-500 hover:text-red-600" onClick={() => removeFile(item.id)} aria-label="Dosyayı sil">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm shadow-neutral-100">
        <button type="button" className="focus-ring flex w-full items-center justify-between gap-3 text-left" onClick={() => setDetailsOpen((value) => !value)}>
          <span><span className="block font-semibold">İnce ayarlar</span><span className="mt-1 block text-sm text-neutral-500">Başlık, görünürlük, dil ve konum isteğe bağlıdır.</span></span>
          <ChevronDown className={`h-5 w-5 text-neutral-500 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
        </button>
        {detailsOpen ? (
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="font-medium">Başlık <span className="font-normal text-neutral-500">(isteğe bağlı)</span></span>
              <Input id="title" className="mt-1" placeholder="Örn. Berlin’de ev bulma deneyimim" {...form.register('title')} />
              {hasLongVideo && !form.watch('title') ? <p className="mt-1 text-sm text-cyan-700">Uzun video için başlık eklemek keşfedilebilirliği artırır.</p> : null}
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm">
                Görünürlük
                <select className="focus-ring mt-1 h-10 w-full rounded-md border border-neutral-300 bg-white px-3" {...form.register('visibility')}>
                  <option value="PUBLIC">Herkese açık</option>
                  <option value="FOLLOWERS">Takipçiler</option>
                  <option value="UNLISTED">Bağlantı ile</option>
                  <option value="PRIVATE">Gizli</option>
                </select>
              </label>
              <label className="text-sm">
                Dil
                <select className="focus-ring mt-1 h-10 w-full rounded-md border border-neutral-300 bg-white px-3" {...form.register('language')}>
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> Konum</span>
                <select className="focus-ring mt-1 h-10 w-full rounded-md border border-neutral-300 bg-white px-3" {...form.register('locationId')}>
                  <option value="">Konum yok</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>{[location.city, location.country].filter(Boolean).join(', ')}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}
      </section>

      {message ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}

      <div className="sticky bottom-16 -mx-4 flex flex-col-reverse gap-2 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur sm:flex-row sm:justify-end md:bottom-0">
        <Button type="button" variant="secondary" disabled={submitting} onClick={form.handleSubmit((values) => submit(values, true))}>
          Taslak kaydet
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Yayınla
        </Button>
      </div>
    </form>
  );
}

function Preview({ item }: { item: SelectedFile }) {
  if (item.file.type.startsWith('image/')) return <img src={item.previewUrl} alt="Dosya önizleme" className="h-16 w-16 rounded-md object-cover" />;
  if (item.file.type.startsWith('video/')) return <video src={item.previewUrl} className="h-16 w-16 rounded-md bg-black object-cover" muted playsInline />;
  if (item.file.type.startsWith('audio/')) return <div className="flex h-16 w-16 items-center justify-center rounded-md bg-cyan-50 text-cyan-700"><FileAudio className="h-6 w-6" /></div>;
  return <div className="flex h-16 w-16 items-center justify-center rounded-md bg-neutral-100"><FileImage className="h-6 w-6" /></div>;
}

async function readMetadata(file: File): Promise<SelectedFile['metadata']> {
  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => resolve({});
      image.src = URL.createObjectURL(file);
    });
  }
  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
    return new Promise((resolve) => {
      const element = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
      element.preload = 'metadata';
      element.onloadedmetadata = () => resolve({ duration: element.duration, width: (element as HTMLVideoElement).videoWidth || undefined, height: (element as HTMLVideoElement).videoHeight || undefined });
      element.onerror = () => resolve({});
      element.src = URL.createObjectURL(file);
    });
  }
  return {};
}

function uploadWithProgress(url: string, file: File, onProgress: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error('Dosya yüklenemedi.'));
      }
    };
    xhr.onerror = () => reject(new Error('Dosya yüklenemedi.'));
    xhr.send(file);
  });
}
