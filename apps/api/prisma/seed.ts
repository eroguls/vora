import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { RuleBasedContentClassifier } from '@vora/content-engine';
import { excerpt, slugify } from '../src/common/utils/slug';

const prisma = new PrismaClient();
const classifier = new RuleBasedContentClassifier();

const imagePool = [
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1400&q=80',
];

const locations = [
  { country: 'Japan', city: 'Kyoto', region: 'Kansai', latitude: 35.0116, longitude: 135.7681 },
  { country: 'United States', city: 'Austin', region: 'Texas', latitude: 30.2672, longitude: -97.7431 },
  { country: 'Germany', city: 'Berlin', region: 'Berlin', latitude: 52.52, longitude: 13.405 },
  { country: 'Turkey', city: 'Istanbul', region: 'Marmara', latitude: 41.0082, longitude: 28.9784 },
  { country: 'Brazil', city: 'Rio de Janeiro', region: 'Rio de Janeiro', latitude: -22.9068, longitude: -43.1729 },
  { country: 'Canada', city: 'Toronto', region: 'Ontario', latitude: 43.6532, longitude: -79.3832 },
  { country: 'Italy', city: 'Bologna', region: 'Emilia-Romagna', latitude: 44.4949, longitude: 11.3426 },
  { country: 'South Korea', city: 'Seoul', region: 'Seoul', latitude: 37.5665, longitude: 126.978 },
];

const people = [
  ['demo', 'Demo User', 'Istanbul', 'Turkey', 'Global yaşam ve günlük deneyimler'],
  ['admin', 'Admin User', 'Berlin', 'Germany', 'Platform moderasyonu ve ürün operasyonları'],
  ['aiko', 'Aiko Tanaka', 'Kyoto', 'Japan', 'Kyoto sokakları, küçük kafeler ve tren yolculukları'],
  ['mason', 'Mason Reed', 'Austin', 'United States', 'Amerikada araç, iş ve şehir hayatı'],
  ['lena', 'Lena Hoffmann', 'Berlin', 'Germany', 'Almanyada öğrenci olmak üzerine notlar'],
  ['deniz', 'Deniz Yılmaz', 'Istanbul', 'Turkey', 'İstanbul sabahları ve mahalle kültürü'],
  ['rafa', 'Rafa Oliveira', 'Rio de Janeiro', 'Brazil', 'Brezilyada futbol, müzik ve sahil hayatı'],
  ['maya', 'Maya Chen', 'Toronto', 'Canada', 'Kanadada ev kiralamak ve göçmenlik deneyimi'],
  ['giulia', 'Giulia Rossi', 'Bologna', 'Italy', 'İtalyada aile yemeği ve günlük pazarlar'],
  ['jiho', 'Jiho Park', 'Seoul', 'South Korea', 'Güney Korede lise hayatı'],
  ['nora', 'Nora Ahmed', 'Dubai', 'United Arab Emirates', 'Körfez şehirlerinde yaşam'],
  ['oliver', 'Oliver Smith', 'London', 'United Kingdom', 'Londra ulaşımı ve iş kültürü'],
  ['sofia', 'Sofia García', 'Madrid', 'Spain', 'İspanyada mahalle ve pazar deneyimleri'],
  ['emir', 'Emir Demir', 'Ankara', 'Turkey', 'Teknoloji, eğitim ve şehir notları'],
  ['amelia', 'Amelia Brown', 'Vancouver', 'Canada', 'Doğa, kira ve uzak çalışma'],
  ['yuki', 'Yuki Mori', 'Tokyo', 'Japan', 'Tokyo günlük yaşam ve market fiyatları'],
  ['hans', 'Hans Weber', 'Munich', 'Germany', 'Bavyera iş ve ulaşım deneyimleri'],
  ['luisa', 'Luisa Costa', 'Lisbon', 'Portugal', 'Lizbonda yaşam maliyeti'],
  ['noah', 'Noah Miller', 'Chicago', 'United States', 'Amerikada ikinci el pazarlar'],
  ['mina', 'Mina Kim', 'Busan', 'South Korea', 'Kore sahil şehirleri'],
  ['lara', 'Lara Silva', 'São Paulo', 'Brazil', 'Brezilyada iş ve kültür'],
  ['selin', 'Selin Kaya', 'Izmir', 'Turkey', 'Ege, yemek ve çalışma hayatı'],
  ['tom', 'Tom Wilson', 'Sydney', 'Australia', 'Avustralyada kiralar ve sahil yaşamı'],
  ['ines', 'Ines Dubois', 'Paris', 'France', 'Pariste öğrenci olmak'],
  ['kwame', 'Kwame Mensah', 'Accra', 'Ghana', 'Batı Afrikada şehir hayatı'],
] as const;

function articleBody(topic: string) {
  return [
    `${topic} konusunu ilk kez araştırırken resmi kaynaklar kadar orada yaşayan insanların küçük ayrıntılarına ihtiyaç duydum. Bu yazı, günlük hayatta gerçekten karşıma çıkan masrafları, alışkanlıkları ve kararları anlatıyor.`,
    `Sabah rutini genellikle ulaşım, kahve ve market planıyla başlıyor. Beklenmeyen masraflar en çok ulaşım kartı, depozito, ikinci el eşya ve telefon hattı tarafında çıkıyor. Yeni gelen biri için en iyi strateji birkaç hafta gözlem yapmak ve acele sözleşme imzalamamak.`,
    `İnsanlarla konuşunca fiyatların semte, mevsime ve sosyal çevreye göre değiştiğini görüyorsunuz. İnternetteki tek bir fiyat aralığı yanıltıcı olabiliyor. Mahalle marketleri, yerel forumlar ve kısa süreli kiralama deneyimleri daha gerçekçi fikir veriyor.`,
    `Kendi çıkarımım şu: karar vermeden önce üç farklı yerel kaynaktan bilgi almak, mümkünse aynı şehirde yaşayan biriyle konuşmak ve başlangıç bütçesine yüzde yirmi güvenlik payı eklemek gerekiyor.`,
  ].join('\n\n');
}

function shortText(topic: string, city: string) {
  return `${city} için bugün küçük ama gerçek bir not: ${topic.toLowerCase()} konusunda sokaktaki deneyim, rehber yazılardan daha hızlı güncelleniyor.`;
}

async function reset() {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.featureFlag.deleteMany(),
    prisma.processingJob.deleteMany(),
    prisma.translation.deleteMany(),
    prisma.feedImpression.deleteMany(),
    prisma.viewEvent.deleteMany(),
    prisma.searchClick.deleteMany(),
    prisma.searchQuery.deleteMany(),
    prisma.moderationAction.deleteMany(),
    prisma.moderationCase.deleteMany(),
    prisma.report.deleteMany(),
    prisma.messageRead.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversationMember.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.mention.deleteMany(),
    prisma.contentHashtag.deleteMany(),
    prisma.hashtag.deleteMany(),
    prisma.bookmark.deleteMany(),
    prisma.share.deleteMany(),
    prisma.commentLike.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.like.deleteMany(),
    prisma.media.deleteMany(),
    prisma.content.deleteMany(),
    prisma.location.deleteMany(),
    prisma.mute.deleteMany(),
    prisma.block.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.device.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  const resetRequested = process.argv.includes('--reset');
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0 && !resetRequested) {
    console.log(`Seed skipped: database already has ${existingUsers} users. Run pnpm prisma:seed:reset to wipe and recreate demo data.`);
    return;
  }

  if (resetRequested) await reset();
  const passwordHash = await hash('Password123!', 12);
  const adminHash = await hash('Admin123!', 12);
  const locationRows = await Promise.all(locations.map((location) => prisma.location.create({ data: location })));
  const users = [];

  for (const [index, person] of people.entries()) {
    const [username, displayName, city, country, bio] = person;
    const user = await prisma.user.create({
      data: {
        email: `${username}@vora.local`,
        username,
        displayName,
        passwordHash: username === 'admin' ? adminHash : passwordHash,
        role: username === 'admin' ? 'ADMIN' : 'USER',
        adminRole: username === 'admin' ? 'SUPER_ADMIN' : null,
        isVerified: index % 5 === 0,
        lastSeenAt: new Date(Date.now() - index * 60 * 60 * 1000),
        accounts: { create: { provider: 'EMAIL', providerAccountId: `${username}@vora.local` } },
        profile: {
          create: {
            avatarUrl: `https://i.pravatar.cc/240?u=${username}`,
            coverUrl: imagePool[index % imagePool.length],
            bio,
            about: `${displayName}, ${city} merkezli deneyimlerini Vora üzerinde paylaşır. Profil, kısa notlar, fotoğraflar, uzun videolar ve makaleleri tek akışta birleştirir.`,
            profession: index % 3 === 0 ? 'Creator' : index % 3 === 1 ? 'Student' : 'Researcher',
            country,
            city,
            languages: index % 2 === 0 ? ['tr', 'en'] : ['en'],
            links: [{ label: 'Website', url: `https://example.com/${username}` }],
          },
        },
      },
      include: { profile: true },
    });
    users.push(user);
  }

  const topics = [
    'Kyotoda günlük hayat',
    'Amerikada ikinci el araç almak',
    'Almanyada öğrenci olmak',
    'İstanbulda bir sabah',
    'Brezilyada futbol kültürü',
    'Kanadada ev kiralamak',
    'İtalyada aile yemeği',
    'Güney Korede lise hayatı',
    'Tokyo market fiyatları',
    'Londrada metro kullanmak',
  ];

  const contents = [];
  for (let index = 0; index < 60; index += 1) {
    const author = users[index % users.length];
    const location = locationRows[index % locationRows.length];
    const topic = topics[index % topics.length];
    const mode = index % 8;
    const media = [] as Array<{ mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO'; publicUrl: string; thumbnailUrl?: string; mimeType: string; width?: number; height?: number; duration?: number; fileSize: number }>;
    let title: string | null = null;
    let body: string | null = null;

    if (mode === 0) body = shortText(topic, location.city ?? location.country);
    if (mode === 1) {
      body = `${topic}: bu fotoğrafta en çok dikkatimi çeken detay sokaktaki gündelik ritim oldu.`;
      media.push({ mediaType: 'IMAGE', publicUrl: imagePool[index % imagePool.length], mimeType: 'image/jpeg', width: 1400, height: 933, fileSize: 240000 });
    }
    if (mode === 2) {
      body = `${topic} için üç ayrı açıdan küçük bir galeri.`;
      media.push(
        { mediaType: 'IMAGE', publicUrl: imagePool[index % imagePool.length], mimeType: 'image/jpeg', width: 1400, height: 933, fileSize: 240000 },
        { mediaType: 'IMAGE', publicUrl: imagePool[(index + 1) % imagePool.length], mimeType: 'image/jpeg', width: 1200, height: 900, fileSize: 220000 },
        { mediaType: 'IMAGE', publicUrl: imagePool[(index + 2) % imagePool.length], mimeType: 'image/jpeg', width: 1000, height: 1000, fileSize: 210000 },
      );
    }
    if (mode === 3) {
      body = `${topic} için 40 saniyelik sessiz bir sokak kesiti.`;
      media.push({ mediaType: 'VIDEO', publicUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', thumbnailUrl: imagePool[index % imagePool.length], mimeType: 'video/mp4', width: 720, height: 1280, duration: 40, fileSize: 5300000 });
    }
    if (mode === 4) {
      title = topic;
      body = `${topic} hakkında uzun bir anlatım. Ulaşım, maliyetler, alışkanlıklar ve karar verirken dikkat edilmesi gereken ayrıntıları tek videoda topladım.`;
      media.push({ mediaType: 'VIDEO', publicUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', mimeType: 'video/mp4', width: 1920, height: 1080, duration: 2100, fileSize: 120000000 });
    }
    if (mode === 5) {
      title = `${topic}: ilk ay rehberi`;
      body = articleBody(topic);
    }
    if (mode === 6) {
      title = `${topic} sesli notu`;
      body = 'Bu bölümde kısa bir ses kaydıyla güncel gözlemleri paylaşıyorum.';
      media.push({ mediaType: 'AUDIO', publicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', thumbnailUrl: imagePool[index % imagePool.length], mimeType: 'audio/mpeg', duration: 320, fileSize: 7600000 });
    }
    if (mode === 7) {
      title = `${topic} görsel anlatı`;
      body = `${articleBody(topic)}\n\nBu bölümde görseller, kişisel notlarla birlikte okunacak şekilde sıralandı.`;
      media.push(
        { mediaType: 'IMAGE', publicUrl: imagePool[index % imagePool.length], mimeType: 'image/jpeg', width: 1400, height: 933, fileSize: 240000 },
        { mediaType: 'VIDEO', publicUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', thumbnailUrl: imagePool[(index + 1) % imagePool.length], mimeType: 'video/mp4', width: 720, height: 1280, duration: 32, fileSize: 5300000 },
      );
    }

    const classification = classifier.classify({ title, body, language: index % 3 === 0 ? 'tr' : 'en', media });
    const baseSlug = slugify(title ?? body ?? `icerik-${index}`);
    const content = await prisma.content.create({
      data: {
        authorId: author.id,
        slug: `${baseSlug}-${index + 1}`,
        contentType: classification.contentType,
        status: 'PUBLISHED',
        title,
        body,
        excerpt: excerpt(body),
        language: index % 3 === 0 ? 'tr' : 'en',
        originalLanguage: index % 3 === 0 ? 'tr' : 'en',
        visibility: 'PUBLIC',
        locationId: location.id,
        publishedAt: new Date(Date.now() - index * 90 * 60 * 1000),
        metadata: classification.metadata,
        media: {
          create: media.map((item, sortOrder) => ({
            ownerId: author.id,
            mediaType: item.mediaType,
            storageKey: `seed/${index}-${sortOrder}`,
            publicUrl: item.publicUrl,
            thumbnailUrl: item.thumbnailUrl,
            mimeType: item.mimeType,
            width: item.width,
            height: item.height,
            duration: item.duration,
            fileSize: item.fileSize,
            processingStatus: 'READY',
            sortOrder,
          })),
        },
      },
    });
    await prisma.$executeRaw`
      UPDATE "Content"
      SET "searchVector" = to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("body", '') || ' ' || coalesce("excerpt", ''))
      WHERE "id" = ${content.id}
    `;
    contents.push(content);
  }

  const follows = [] as Array<{ followerId: string; followingId: string }>;
  for (let i = 0; i < users.length; i += 1) {
    follows.push({ followerId: users[i].id, followingId: users[(i + 1) % users.length].id });
    follows.push({ followerId: users[i].id, followingId: users[(i + 3) % users.length].id });
  }
  await prisma.follow.createMany({ data: follows, skipDuplicates: true });
  for (const user of users) {
    const followerCount = follows.filter((follow) => follow.followingId === user.id).length;
    const followingCount = follows.filter((follow) => follow.followerId === user.id).length;
    await prisma.profile.update({ where: { userId: user.id }, data: { followerCount, followingCount } });
  }

  for (let i = 0; i < contents.length; i += 1) {
    const content = contents[i];
    const liker = users[(i + 4) % users.length];
    const commenter = users[(i + 7) % users.length];
    if (liker.id !== content.authorId) {
      await prisma.like.create({ data: { userId: liker.id, contentId: content.id } });
      await prisma.content.update({ where: { id: content.id }, data: { likeCount: { increment: 1 } } });
    }
    await prisma.comment.create({ data: { authorId: commenter.id, contentId: content.id, body: 'Bu deneyim aradığım türden birinci şahıs bilgi verdi.' } });
    await prisma.content.update({ where: { id: content.id }, data: { commentCount: { increment: 1 }, viewCount: { increment: 12 + i } } });
    if (i % 3 === 0) {
      await prisma.bookmark.create({ data: { userId: users[(i + 2) % users.length].id, contentId: content.id } });
      await prisma.content.update({ where: { id: content.id }, data: { saveCount: { increment: 1 } } });
    }
  }

  await prisma.notification.createMany({
    data: [
      { recipientId: users[0].id, actorId: users[2].id, type: 'NEW_FOLLOWER', title: 'Aiko seni takip etmeye başladı', href: `/@${users[2].username}` },
      { recipientId: users[0].id, actorId: users[4].id, contentId: contents[0].id, type: 'LIKE', title: 'İçeriğin beğenildi', href: `/@${users[0].username}/${contents[0].slug}` },
      { recipientId: users[0].id, contentId: contents[4].id, type: 'MEDIA_PROCESSING_COMPLETED', title: 'Video işleme tamamlandı', href: `/@${users[4].username}/${contents[4].slug}` },
    ],
  });

  const report = await prisma.report.create({ data: { reporterId: users[3].id, contentId: contents[5].id, reason: 'MISINFORMATION', details: 'Fiyat bilgisi güncel olmayabilir.' } });
  await prisma.moderationCase.create({ data: { reportId: report.id, contentId: contents[5].id, summary: 'Seed moderation case for misinformation review' } });

  await prisma.searchQuery.createMany({
    data: [
      { userId: users[0].id, query: 'Amerikada ikinci el araç fiyatları', resultCount: 8 },
      { userId: users[1].id, query: 'Tokyo günlük yaşam', resultCount: 6 },
      { userId: users[2].id, query: 'Kanadada ev kiralamak', resultCount: 7 },
    ],
  });

  await prisma.featureFlag.createMany({
    data: [
      { key: 'ai_classification', description: 'AI adapter for content classification', enabled: false },
      { key: 'advanced_translation', description: 'External translation provider', enabled: false },
      { key: 'youth_safety_defaults', description: 'Age-aware privacy defaults', enabled: true },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
