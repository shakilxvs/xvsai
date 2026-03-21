import { NextRequest, NextResponse } from 'next/server';

interface ImageResult {
  url: string;
  provider: string;
  providerUrl: string;
  photographer?: string;
  photoUrl?: string;
  width?: number;
  height?: number;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });

    const groqKey        = process.env.GROQ_API_KEY;
    const stabilityKey   = process.env.STABILITY_API_KEY;
    const pexelsKey      = process.env.PEXELS_API_KEY;
    const unsplashKey    = process.env.UNSPLASH_ACCESS_KEY;
    const pixabayKey     = process.env.PIXABAY_API_KEY;
    const flickrKey      = process.env.FLICKR_API_KEY;
    const nasaKey        = process.env.NASA_API_KEY;
    const rijksKey       = process.env.RIJKSMUSEUM_API_KEY;
    const smithsonianKey = process.env.SMITHSONIAN_API_KEY;
    const europeanKey    = process.env.EUROPEANA_API_KEY;
    const giphyKey       = process.env.GIPHY_API_KEY;
    const wallhavenKey   = process.env.WALLHAVEN_API_KEY;
    const imgurClientId  = process.env.IMGUR_CLIENT_ID;
    const freepikKey     = process.env.FREEPIK_API_KEY;

    // ── Step 1: AI classifies intent ─────────────────────
    let useRealPhoto = false;
    let cleanPrompt = prompt
      .replace(/^(generate|make|create|draw|render|produce|paint|illustrate)\s+(a|an|the|me)?\s*/i, '')
      .trim();

    if (groqKey) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `Classify image requests. Reply JSON only.
{"type":"real","query":"search term"} — user wants to FIND/SHOW/SEE existing photos/wallpapers
{"type":"ai","query":"description"} — user wants to CREATE/GENERATE/DRAW/MAKE an image

"show mountain" → real · "phone wallpaper" → real · "dog" → real
"boat" → real · "sunset" → real · "4k wallpaper" → real
"generate dragon" → ai · "create city" → ai · "draw a cat" → ai`
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: 80, temperature: 0,
          }),
        });
        if (r.ok) {
          const d = await r.json();
          const raw = d.choices?.[0]?.message?.content?.trim() ?? '';
          const match = raw.match(/\{[^}]+\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            useRealPhoto = parsed.type === 'real';
            if (parsed.query) cleanPrompt = parsed.query;
          }
        }
      } catch {}
    }

    if (!groqKey) {
      useRealPhoto = /^(show|find|get|search|look|photo|picture|image of|see|wallpaper|background)/i.test(prompt.trim());
    }

    // ── Step 2a: Real photos from all sources ─────────────
    if (useRealPhoto) {
      const enc = encodeURIComponent(cleanPrompt);
      const page = Math.floor(Math.random() * 8) + 1;
      const images: ImageResult[] = [];

      // All sources in parallel
      const results = await Promise.allSettled([
        // 1. Pexels
        pexelsKey ? fetch(
          `https://api.pexels.com/v1/search?query=${enc}&per_page=4&page=${page}`,
          { headers: { Authorization: pexelsKey } }
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 2. Unsplash
        unsplashKey ? fetch(
          `https://api.unsplash.com/search/photos?query=${enc}&per_page=4&page=${page}`,
          { headers: { Authorization: `Client-ID ${unsplashKey}` } }
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 3. Pixabay
        pixabayKey ? fetch(
          `https://pixabay.com/api/?key=${pixabayKey}&q=${enc}&image_type=photo&per_page=4&page=${page}&safesearch=false`
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 4. Flickr — free key at flickr.com/services/api
        flickrKey ? fetch(
          `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrKey}&text=${enc}&per_page=4&page=${page}&format=json&nojsoncallback=1&extras=url_l,url_m,owner_name&license=1,2,3,4,5,6,9,10`
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 5. Openverse — NO KEY NEEDED
        fetch(
          `https://api.openverse.org/v1/images/?q=${enc}&page_size=4&page=${page}`
        ).then(r => r.ok ? r.json() : null),

        // 6. NASA Images — NO KEY NEEDED
        fetch(
          `https://images-api.nasa.gov/search?q=${enc}&media_type=image&page_size=4`
        ).then(r => r.ok ? r.json() : null),

        // 7. Met Museum — NO KEY NEEDED
        fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${enc}`
        ).then(r => r.ok ? r.json() : null),

        // 8. Art Institute of Chicago — NO KEY NEEDED
        fetch(
          `https://api.artic.edu/api/v1/artworks/search?q=${enc}&fields=id,title,artist_display,image_id&limit=4`
        ).then(r => r.ok ? r.json() : null),

        // 9. Cleveland Museum of Art — NO KEY NEEDED
        fetch(
          `https://openaccess-api.clevelandart.org/api/artworks/?q=${enc}&has_image=1&limit=4`
        ).then(r => r.ok ? r.json() : null),

        // 10. iNaturalist — NO KEY NEEDED
        fetch(
          `https://api.inaturalist.org/v1/observations?q=${enc}&photo_licensed=true&per_page=4&page=${page}&order=votes`
        ).then(r => r.ok ? r.json() : null),

        // 11. Rijksmuseum — free key at data.rijksmuseum.nl
        rijksKey ? fetch(
          `https://www.rijksmuseum.nl/api/en/collection?key=${rijksKey}&q=${enc}&imgonly=true&ps=4&p=${page}`
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 12. Europeana — free key at apis.europeana.eu
        europeanKey ? fetch(
          `https://api.europeana.eu/record/v2/search.json?wskey=${europeanKey}&query=${enc}&qf=TYPE:IMAGE&rows=4&start=${page}`
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 13. Smithsonian — free key at edan.si.edu
        smithsonianKey ? fetch(
          `https://api.si.edu/openaccess/api/v1.0/search?q=${enc}&type=media_type:Images&rows=4&start=${(page-1)*4}&api_key=${smithsonianKey}`
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 14. GIPHY — free key at developers.giphy.com
        giphyKey ? fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${giphyKey}&q=${enc}&limit=4&offset=${(page-1)*4}&rating=r`
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 15. Wallhaven — free key at wallhaven.cc/settings/account
        wallhavenKey ? fetch(
          `https://wallhaven.cc/api/v1/search?q=${enc}&apikey=${wallhavenKey}&purity=110&categories=111&sorting=relevance&page=${page}`
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 16. Imgur — free Client-ID at imgur.com/account/settings/apps
        imgurClientId ? fetch(
          `https://api.imgur.com/3/gallery/search/top/all/1?q=${enc}`,
          { headers: { Authorization: `Client-ID ${imgurClientId}` } }
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 17. Dog API — NO KEY, auto for dog searches
        cleanPrompt.match(/\bdog\b/i) ? fetch(
          `https://api.thedogapi.com/v1/images/search?limit=4`
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 18. Cat API — NO KEY, auto for cat searches
        cleanPrompt.match(/\bcat\b/i) ? fetch(
          `https://api.thecatapi.com/v1/images/search?limit=4`
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 19. RandomFox — NO KEY, auto for fox searches
        cleanPrompt.match(/\bfox\b/i) ? fetch(
          `https://randomfox.ca/floof/`
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),

        // 20. Wikimedia Commons — NO KEY
        fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${enc}&srnamespace=6&srlimit=4&format=json&origin=*`
        ).then(r => r.ok ? r.json() : null),

        // 21. Freepik — free key at freepik.com/api
        freepikKey ? fetch(
          `https://api.freepik.com/v1/resources?term=${enc}&limit=4&page=${page}&filters[content_type][photo]=1&filters[orientation][landscape]=1`,
          { headers: { 'x-freepik-api-key': freepikKey, 'Accept-Language': 'en-US' } }
        ).then(r => r.ok ? r.json() : null) : Promise.resolve(null),
      ]);

      const get = (i: number) => results[i]?.status === 'fulfilled' ? (results[i] as any).value : null;

      // 1. Pexels
      for (const p of get(0)?.photos ?? []) {
        images.push({ url: p.src.large2x || p.src.large, provider: 'Pexels', providerUrl: 'https://pexels.com', photographer: p.photographer, photoUrl: p.url });
      }

      // 2. Unsplash
      for (const p of get(1)?.results ?? []) {
        images.push({ url: p.urls.regular, provider: 'Unsplash', providerUrl: 'https://unsplash.com', photographer: p.user.name, photoUrl: p.links.html });
      }

      // 3. Pixabay
      for (const p of get(2)?.hits ?? []) {
        images.push({ url: p.largeImageURL || p.webformatURL, provider: 'Pixabay', providerUrl: 'https://pixabay.com', photographer: p.user, photoUrl: p.pageURL });
      }

      // 4. Flickr
      for (const p of get(3)?.photos?.photo ?? []) {
        const url = p.url_l || p.url_m;
        if (url) images.push({ url, provider: 'Flickr', providerUrl: 'https://flickr.com', photographer: p.ownername, photoUrl: `https://www.flickr.com/photos/${p.owner}/${p.id}` });
      }

      // 5. Openverse
      for (const p of get(4)?.results ?? []) {
        if (p.url) images.push({ url: p.url, provider: 'Openverse', providerUrl: 'https://openverse.org', photographer: p.creator, photoUrl: p.foreign_landing_url });
      }

      // 6. NASA
      for (const item of get(5)?.collection?.items ?? []) {
        const imgLink = item.links?.find((l: any) => l.rel === 'preview')?.href;
        const data = item.data?.[0];
        if (imgLink && data) {
          images.push({ url: imgLink, provider: 'NASA', providerUrl: 'https://images.nasa.gov', photographer: data.center, photoUrl: `https://images.nasa.gov/details/${data.nasa_id}` });
        }
      }

      // 7. Met Museum — fetch first 2 objects
      const metIds = (get(6)?.objectIDs ?? []).slice(0, 2);
      for (const id of metIds) {
        try {
          const r = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
          if (r.ok) {
            const d = await r.json();
            if (d.primaryImage) images.push({ url: d.primaryImage, provider: 'Met Museum', providerUrl: 'https://metmuseum.org', photographer: d.artistDisplayName || 'Unknown', photoUrl: d.objectURL });
          }
        } catch {}
      }

      // 8. Art Institute of Chicago
      for (const p of get(7)?.data ?? []) {
        if (p.image_id) {
          images.push({ url: `https://www.artic.edu/iiif/2/${p.image_id}/full/843,/0/default.jpg`, provider: 'Art Inst. Chicago', providerUrl: 'https://artic.edu', photographer: p.artist_display?.split('\n')[0], photoUrl: `https://www.artic.edu/artworks/${p.id}` });
        }
      }

      // 9. Cleveland Museum of Art
      for (const p of get(8)?.data ?? []) {
        const img = p.images?.web?.url || p.images?.print?.url;
        if (img) images.push({ url: img, provider: 'Cleveland Art', providerUrl: 'https://clevelandart.org', photographer: p.creators?.[0]?.description, photoUrl: `https://www.clevelandart.org/art/${p.accession_number}` });
      }

      // 10. iNaturalist
      for (const obs of get(9)?.results ?? []) {
        const photo = obs.photos?.[0];
        if (photo?.url) {
          images.push({ url: photo.url.replace('square', 'large'), provider: 'iNaturalist', providerUrl: 'https://inaturalist.org', photographer: obs.user?.login, photoUrl: `https://www.inaturalist.org/observations/${obs.id}` });
        }
      }

      // 11. Rijksmuseum
      for (const p of get(10)?.artObjects ?? []) {
        if (p.webImage?.url) images.push({ url: p.webImage.url, provider: 'Rijksmuseum', providerUrl: 'https://rijksmuseum.nl', photographer: p.principalOrFirstMaker, photoUrl: p.links?.web });
      }

      // 12. Europeana
      for (const p of get(11)?.items ?? []) {
        const img = p.edmPreview?.[0];
        if (img) images.push({ url: img, provider: 'Europeana', providerUrl: 'https://europeana.eu', photographer: p.dcCreator?.[0], photoUrl: `https://www.europeana.eu/item${p.id}` });
      }

      // 13. Smithsonian
      for (const row of get(12)?.response?.rows ?? []) {
        const img = row.content?.descriptiveNonRepeating?.online_media?.media?.[0]?.thumbnail;
        if (img) images.push({ url: img, provider: 'Smithsonian', providerUrl: 'https://si.edu', photographer: 'Smithsonian', photoUrl: row.content?.descriptiveNonRepeating?.record_link });
      }

      // 14. GIPHY
      for (const g of get(13)?.data ?? []) {
        const url = g.images?.original?.url;
        if (url) images.push({ url, provider: 'GIPHY', providerUrl: 'https://giphy.com', photographer: g.username, photoUrl: g.url });
      }

      // 15. Wallhaven
      for (const p of get(14)?.data ?? []) {
        if (p.path) images.push({ url: p.path, provider: 'Wallhaven', providerUrl: 'https://wallhaven.cc', photoUrl: p.url, width: p.dimension_x, height: p.dimension_y });
      }

      // 16. Imgur — filter to only direct image posts
      for (const item of get(15)?.data ?? []) {
        const img = item.is_album ? item.images?.[0] : item;
        if (img?.link && /\.(jpg|jpeg|png|gif|webp)/i.test(img.link)) {
          images.push({ url: img.link, provider: 'Imgur', providerUrl: 'https://imgur.com', photographer: item.account_url || undefined, photoUrl: `https://imgur.com/${item.id}` });
        }
      }

      // 17. Dog API
      for (const d of get(16) ?? []) {
        if (d.url) images.push({ url: d.url, provider: 'The Dog API', providerUrl: 'https://thedogapi.com' });
      }

      // 18. Cat API
      for (const c of get(17) ?? []) {
        if (c.url) images.push({ url: c.url, provider: 'The Cat API', providerUrl: 'https://thecatapi.com' });
      }

      // 19. RandomFox
      const fox = get(18);
      if (fox?.image) images.push({ url: fox.image, provider: 'RandomFox', providerUrl: 'https://randomfox.ca' });

      // 20. Wikimedia
      const wikiPages = get(19)?.query?.search ?? [];
      for (const p of wikiPages.slice(0, 2)) {
        try {
          const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(p.title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`);
          if (r.ok) {
            const d = await r.json();
            const pages = Object.values(d.query?.pages ?? {}) as any[];
            const info = pages[0]?.imageinfo?.[0];
            if (info?.thumburl && info.url?.match(/\.(jpg|jpeg|png|webp)/i)) {
              images.push({ url: info.thumburl, provider: 'Wikimedia', providerUrl: 'https://commons.wikimedia.org', photoUrl: info.descriptionurl });
            }
          }
        } catch {}
      }

      // 21. Freepik
      for (const p of get(20)?.data ?? []) {
        const url = p.image?.source?.url;
        if (url) images.push({
          url,
          provider: 'Freepik',
          providerUrl: 'https://freepik.com',
          photographer: p.author?.name,
          photoUrl: p.url,
        });
      }

      if (images.length > 0) {
        // Shuffle for variety
        for (let i = images.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [images[i], images[j]] = [images[j], images[i]];
        }
        return NextResponse.json({ type: 'gallery', images, prompt: cleanPrompt });
      }
    }

    // ── Step 2b: AI generation → Stability AI → Pollinations fallback ─
    if (stabilityKey) {
      try {
        const form = new FormData();
        form.append('prompt', cleanPrompt);
        form.append('output_format', 'jpeg');
        form.append('aspect_ratio', '1:1');
        const r = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${stabilityKey}`, 'Accept': 'image/*' },
          body: form,
        });
        if (r.ok) {
          const buffer = await r.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return NextResponse.json({ type: 'single', imageUrl: `data:image/jpeg;base64,${base64}`, provider: 'Stability AI', prompt: cleanPrompt });
        }
      } catch {}
    }

    // ── Fallback: Pollinations FLUX (always free, no key) ─
    const encoded = encodeURIComponent(cleanPrompt);
    const seed = Math.floor(Math.random() * 999999);
    return NextResponse.json({
      type: 'single',
      imageUrl: `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`,
      provider: 'FLUX AI',
      prompt: cleanPrompt,
    });

  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
