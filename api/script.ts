import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function safeDecode(val: string): string {
  if (!val) return '';
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

export default async function handler(req: any, res: any) {
  let rawId = req.query?.id;
  if (Array.isArray(rawId)) {
    rawId = rawId.join('/');
  }

  // Reconstruct if split by unencoded '&'
  if (req.query && Object.keys(req.query).length > 1) {
    const keys = Object.keys(req.query);
    if (keys[0] === 'id') {
      const reconstructed = [req.query.id, ...keys.slice(1)].filter(Boolean).join('&');
      if (reconstructed.length > (rawId?.length || 0)) {
        rawId = reconstructed;
      }
    }
  }

  if (!rawId && req.url) {
    const match = req.url.match(/(?:\/script\/|\?id=)([^?]+)/);
    if (match && match[1]) {
      rawId = match[1];
    }
  }

  let title = "Script Repo - Wasp";
  let description = "SCRIPT";

  if (rawId && typeof rawId === 'string') {
    const decodedId = safeDecode(rawId).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);

    if (!isUuid && decodedId) {
      title = decodedId;
    }

    if (supabaseUrl && supabaseKey) {
      try {
        if (isUuid) {
          const { data } = await supabase
            .from('scripts')
            .select('title')
            .eq('id', decodedId)
            .limit(1)
            .maybeSingle();

          if (data) {
            title = data.title || title;
          }
        } else {
          let { data } = await supabase
            .from('scripts')
            .select('title')
            .eq('title', decodedId)
            .limit(1)
            .maybeSingle();

          if (!data && rawId !== decodedId) {
            const rawRes = await supabase
              .from('scripts')
              .select('title')
              .eq('title', rawId)
              .limit(1)
              .maybeSingle();
            if (rawRes.data) data = rawRes.data;
          }

          if (!data) {
            const ilikeRes = await supabase
              .from('scripts')
              .select('title')
              .ilike('title', decodedId)
              .limit(1)
              .maybeSingle();
            if (ilikeRes.data) data = ilikeRes.data;
          }

          if (data) {
            title = data.title || title;
          }
        }
      } catch (err) {
        console.error('Error fetching script:', err);
      }
    }
  }

  // Read index.html from dist (production) or root (development fallback)
  let htmlPath = path.join(process.cwd(), 'dist', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    htmlPath = path.join(process.cwd(), 'index.html');
  }

  try {
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Escape dynamic content to prevent XSS / HTML injection
    const escapedTitle = escapeHtml(title);
    const escapedDescription = escapeHtml(description);

    // Construct dynamic OG Image URL
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (description) params.set('description', description);
    
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const origin = `${protocol}://${host}`;
    const ogImageUrl = `${origin}/api/og?${params.toString()}`;
    const escapedOgImageUrl = escapeHtml(ogImageUrl);

    // Replace <title>
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapedTitle} • Wasp</title>`);
    
    // Replace description meta tag
    if (html.includes('name="description"')) {
      html = html.replace(/(<meta name="description" content=")([^"]*)(")/, `$1${escapedDescription}$3`);
    }
    
    // Replace og:title meta tag
    if (html.includes('property="og:title"')) {
      html = html.replace(/(<meta property="og:title" content=")([^"]*)(")/, `$1${escapedTitle} • Wasp$3`);
    } else {
      html = html.replace('</head>', `<meta property="og:title" content="${escapedTitle} • Wasp" />\n</head>`);
    }
    
    // Replace og:description meta tag
    if (html.includes('property="og:description"')) {
      html = html.replace(/(<meta property="og:description" content=")([^"]*)(")/, `$1${escapedDescription}$3`);
    } else {
      html = html.replace('</head>', `<meta property="og:description" content="${escapedDescription}" />\n</head>`);
    }

    // Replace og:image meta tag
    if (html.includes('property="og:image"')) {
      html = html.replace(/(<meta property="og:image" content=")([^"]*)(")/, `$1${escapedOgImageUrl}$3`);
    } else {
      html = html.replace('</head>', `<meta property="og:image" content="${escapedOgImageUrl}" />\n</head>`);
    }

    // Replace twitter:image meta tag
    if (html.includes('name="twitter:image"')) {
      html = html.replace(/(<meta name="twitter:image" content=")([^"]*)(")/, `$1${escapedOgImageUrl}$3`);
    } else {
      html = html.replace('</head>', `<meta name="twitter:image" content="${escapedOgImageUrl}" />\n</head>`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error reading index.html:', err);
    return res.status(500).send('Internal Server Error');
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
