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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
    const match = req.url.match(/(?:\/(?:lumen|ai-agent)\/share\/|\?id=)([^?]+)/);
    if (match && match[1]) {
      rawId = match[1];
    }
  }

  let title = 'Shared Conversation • Lumen AI';
  let description = 'Explore this shared AI conversation on Wasp Lumen';

  if (rawId && typeof rawId === 'string') {
    const decodedId = safeDecode(rawId).trim();
    if (decodedId && supabaseUrl && supabaseKey) {
      try {
        const { data } = await supabase
          .from('ai_shared_chats')
          .select('title, shared_by_name, messages')
          .eq('id', decodedId)
          .limit(1)
          .maybeSingle();

        if (data) {
          if (data.title) {
            title = data.title;
          }
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            const firstUserMsg = data.messages.find((m: any) => m.role === 'user');
            if (firstUserMsg?.content) {
              const cleanContent = firstUserMsg.content
                .replace(/[#*`_~\[\]]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
              description = cleanContent.slice(0, 180);
            } else {
              description = `Shared conversation with Lumen AI (${data.messages.length} messages)`;
            }
          } else if (data.shared_by_name) {
            description = `Shared by ${data.shared_by_name} on Lumen AI`;
          }
        }
      } catch (err) {
        console.error('Error fetching shared chat:', err);
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
    params.set('badge', 'Lumen AI');

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const origin = `${protocol}://${host}`;
    const ogImageUrl = `${origin}/api/og?${params.toString()}`;
    const escapedOgImageUrl = escapeHtml(ogImageUrl);
    const pageUrl = `${origin}${req.url || `/lumen/share/${rawId || ''}`}`;
    const escapedPageUrl = escapeHtml(pageUrl);

    // Replace <title>
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapedTitle} • Lumen AI • Wasp</title>`);

    // Replace description meta tag
    if (html.includes('name="description"')) {
      html = html.replace(/(<meta name="description" content=")([^"]*)(")/, `$1${escapedDescription}$3`);
    } else {
      html = html.replace('</head>', `<meta name="description" content="${escapedDescription}" />\n</head>`);
    }

    // Replace og:title meta tag
    if (html.includes('property="og:title"')) {
      html = html.replace(/(<meta property="og:title" content=")([^"]*)(")/, `$1${escapedTitle} • Lumen AI$3`);
    } else {
      html = html.replace('</head>', `<meta property="og:title" content="${escapedTitle} • Lumen AI" />\n</head>`);
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

    // Replace or insert og:url meta tag
    if (html.includes('property="og:url"')) {
      html = html.replace(/(<meta property="og:url" content=")([^"]*)(")/, `$1${escapedPageUrl}$3`);
    } else {
      html = html.replace('</head>', `<meta property="og:url" content="${escapedPageUrl}" />\n</head>`);
    }

    // Replace twitter:image meta tag
    if (html.includes('name="twitter:image"')) {
      html = html.replace(/(<meta name="twitter:image" content=")([^"]*)(")/, `$1${escapedOgImageUrl}$3`);
    } else {
      html = html.replace('</head>', `<meta name="twitter:image" content="${escapedOgImageUrl}" />\n</head>`);
    }

    // Ensure twitter:card
    if (html.includes('name="twitter:card"')) {
      html = html.replace(/(<meta name="twitter:card" content=")([^"]*)(")/, `$1summary_large_image$3`);
    } else {
      html = html.replace('</head>', `<meta name="twitter:card" content="summary_large_image" />\n</head>`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Error reading index.html:', err);
    return res.status(500).send('Internal Server Error');
  }
}
