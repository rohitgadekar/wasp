import fs from 'fs';
import path from 'path';
import { format, parseISO, isValid } from 'date-fns';

export default async function handler(req: any, res: any) {
  const { date } = req.query;

  let selectedDate = new Date();
  if (date && typeof date === 'string') {
    const parsed = parseISO(date);
    if (isValid(parsed)) {
      selectedDate = parsed;
    }
  }

  const dateTitle = `Logs - ${format(selectedDate, 'EEEE do, yyyy')}`;
  const description = "Wasp Analytics";

  // Read index.html from dist (production) or root (development fallback)
  let htmlPath = path.join(process.cwd(), 'dist', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    htmlPath = path.join(process.cwd(), 'index.html');
  }

  try {
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Escape dynamic content to prevent XSS / HTML injection
    const escapedTitle = escapeHtml(dateTitle);
    const escapedDescription = escapeHtml(description);

    // Construct dynamic OG Image URL
    const params = new URLSearchParams();
    if (dateTitle) params.set('title', dateTitle);
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
