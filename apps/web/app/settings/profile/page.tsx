'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/app-shell';
import { api } from '../../../lib/api';
import { Button, Input, Textarea } from '@vora/ui';

interface PresignedUpload {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
}

export default function ProfileSettingsPage() {
  const query = useQuery({ queryKey: ['profile-me'], queryFn: () => api.get<any>('/profiles/me') });
  const [saved, setSaved] = React.useState(false);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <AppShell rightRail={false}>
      <div className="border-b border-neutral-200 p-4"><h1 className="text-lg font-semibold">Profil ayarları</h1></div>
      <form
        key={query.data?.id ?? 'loading'}
        className="space-y-4 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setUploading(true);
          setSaved(false);
          setError(null);
          const data = new FormData(event.currentTarget);
          try {
            const [uploadedAvatarUrl, uploadedCoverUrl] = await Promise.all([
              avatarFile ? uploadProfileImage(avatarFile) : Promise.resolve(null),
              coverFile ? uploadProfileImage(coverFile) : Promise.resolve(null),
            ]);
            const links = [
              { label: getText(data, 'linkLabel'), url: normalizeUrl(getText(data, 'linkUrl')) },
            ].filter((link) => link.label && link.url);
            await api.patch('/profiles/me', {
              displayName: getText(data, 'displayName'),
              bio: getNullableText(data, 'bio'),
              about: getNullableText(data, 'about'),
              profession: getNullableText(data, 'profession'),
              country: getNullableText(data, 'country'),
              city: getNullableText(data, 'city'),
              avatarUrl: uploadedAvatarUrl ?? normalizeUrl(getText(data, 'avatarUrl')),
              coverUrl: uploadedCoverUrl ?? normalizeUrl(getText(data, 'coverUrl')),
              languages: getText(data, 'languages').split(',').map((item) => item.trim()).filter(Boolean),
              links,
              isIndexable: data.get('isIndexable') === 'on',
              contactVisibility: data.get('contactVisibility') === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
            });
            setAvatarFile(null);
            setCoverFile(null);
            await query.refetch();
            setSaved(true);
          } catch (submitError) {
            setError((submitError as Error).message || 'Profil kaydedilemedi.');
          } finally {
            setUploading(false);
          }
        }}
      >
        <label className="block text-sm font-medium">Görünen ad<Input className="mt-1" name="displayName" defaultValue={query.data?.displayName} placeholder="Görünen ad" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Profil fotoğrafı
            {query.data?.avatarUrl ? <img className="mt-2 h-20 w-20 rounded-full border border-neutral-200 object-cover" src={query.data.avatarUrl} alt="Profil fotoğrafı" /> : null}
            <Input className="mt-2" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setAvatarFile(event.currentTarget.files?.[0] ?? null)} />
            <Input className="mt-2" name="avatarUrl" defaultValue={query.data?.avatarUrl ?? ''} placeholder="veya görsel URL'i" />
          </label>
          <label className="block text-sm font-medium">
            Kapak görseli
            {query.data?.coverUrl ? <img className="mt-2 h-20 w-full rounded-md border border-neutral-200 object-cover" src={query.data.coverUrl} alt="Kapak görseli" /> : null}
            <Input className="mt-2" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setCoverFile(event.currentTarget.files?.[0] ?? null)} />
            <Input className="mt-2" name="coverUrl" defaultValue={query.data?.coverUrl ?? ''} placeholder="veya görsel URL'i" />
          </label>
        </div>
        <label className="block text-sm font-medium">Kısa biyografi<Textarea className="mt-1" name="bio" defaultValue={query.data?.bio ?? ''} placeholder="Kısa biyografi" /></label>
        <label className="block text-sm font-medium">Uzun hakkımda<Textarea className="mt-1" name="about" defaultValue={query.data?.about ?? ''} placeholder="Uzun hakkımda" /></label>
        <Input name="profession" defaultValue={query.data?.profession ?? ''} placeholder="Meslek" />
        <div className="grid gap-3 sm:grid-cols-2"><Input name="country" defaultValue={query.data?.country ?? ''} placeholder="Ülke" /><Input name="city" defaultValue={query.data?.city ?? ''} placeholder="Şehir" /></div>
        <Input name="languages" defaultValue={(query.data?.languages ?? []).join(', ')} placeholder="Diller: tr, en" />
        <div className="grid gap-3 sm:grid-cols-2"><Input name="linkLabel" defaultValue={query.data?.links?.[0]?.label ?? ''} placeholder="Bağlantı etiketi" /><Input name="linkUrl" defaultValue={query.data?.links?.[0]?.url ?? ''} placeholder="https://..." /></div>
        <label className="block text-sm font-medium">
          Takip listeleri
          <select name="contactVisibility" defaultValue={query.data?.contactVisibility ?? 'PUBLIC'} className="mt-1 h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm">
            <option value="PUBLIC">Herkes takipçi ve takip edilenleri görebilir</option>
            <option value="PRIVATE">Herkesten gizle</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm"><input name="isIndexable" type="checkbox" defaultChecked={query.data?.isIndexable ?? true} /> Profil arama motorları tarafından indekslenebilir</label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {saved ? <p className="text-sm text-cyan-700">Kaydedildi.</p> : null}
        <Button type="submit" disabled={uploading}>{uploading ? 'Yükleniyor...' : 'Kaydet'}</Button>
      </form>
    </AppShell>
  );
}

function getText(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getNullableText(data: FormData, key: string) {
  return getText(data, key) || null;
}

function normalizeUrl(value: string) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

async function uploadProfileImage(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Sadece görsel dosyası yüklenebilir.');
  const result = await api.post<PresignedUpload>('/upload/presign', { fileName: file.name, contentType: file.type, fileSize: file.size });
  await uploadWithProgress(result.uploadUrl, file);
  return result.publicUrl;
}

function uploadWithProgress(url: string, file: File) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error('Dosya yüklenemedi.'));
    };
    xhr.onerror = () => reject(new Error('Dosya yüklenemedi.'));
    xhr.send(file);
  });
}
