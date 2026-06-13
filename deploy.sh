#!/bin/bash
set -e

echo "Building web..."
npx expo export --platform web

echo "Adding PWA icons..."
cp assets/apple-touch-icon.png dist/apple-touch-icon-v2.png
cp assets/icon-512.png dist/icon-512.png

echo "Patching index.html for PWA..."
# Add apple-touch-icon and manifest after favicon line
sed -i '' 's|<link rel="icon" href="/favicon.ico" /></head>|<link rel="icon" href="/favicon.ico" />\n  <link rel="apple-touch-icon" href="/apple-touch-icon-v2.png" />\n  <meta name="apple-mobile-web-app-capable" content="yes" />\n  <meta name="apple-mobile-web-app-status-bar-style" content="default" />\n  <meta name="apple-mobile-web-app-title" content="Bill Mate" />\n  <meta name="theme-color" content="#B8860B" />\n  <link rel="manifest" href="/manifest.json" /></head>|' dist/index.html

echo "Writing manifest.json..."
cat > dist/manifest.json << 'EOF'
{
  "name": "Bill Mate",
  "short_name": "Bill Mate",
  "description": "Split bills with friends",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#2563EB",
  "theme_color": "#2563EB",
  "icons": [
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
EOF

echo "Deploying to Firebase..."
./node_modules/.bin/firebase deploy --only hosting

echo "Done!"
