mkdir -p frontend/public/video
ffmpeg -y -i "vidssave.com Amazing Space 8K HDR Ultra HD Video 1440P.mp4" -ss 4.8 -vf "scale=1280:-2,fps=30" -c:v libx264 -preset slow -crf 26 -an -movflags +faststart -t 12 frontend/public/video/hero-space-trimmed.mp4
ffmpeg -y -i frontend/public/video/hero-space-trimmed.mp4 -vf "select=eq(n\,0)" -vframes 1 frontend/public/video/hero-space-poster.jpg
ffmpeg -y -i frontend/public/video/hero-space-trimmed.mp4 -c:v libvpx-vp9 -crf 32 -b:v 0 -an frontend/public/video/hero-space-trimmed.webm
ls -lh frontend/public/video/
