#!/bin/bash
mkdir -p frontend/public/video
# Extract at native resolution and higher quality. Trim at 5.4s
ffmpeg -y -i "vidssave.com Amazing Space 8K HDR Ultra HD Video 1440P.mp4" -ss 5.7 -c:v libx264 -preset slow -crf 20 -an -movflags +faststart -t 12 frontend/public/video/hero-space-trimmed.mp4

# Extract poster image
ffmpeg -y -i frontend/public/video/hero-space-trimmed.mp4 -vf "select=eq(n\,0)" -vframes 1 frontend/public/video/hero-space-poster.jpg

# Generate WebM at native resolution and higher quality
ffmpeg -y -i frontend/public/video/hero-space-trimmed.mp4 -c:v libvpx-vp9 -crf 24 -b:v 0 -an frontend/public/video/hero-space-trimmed.webm

ls -lh frontend/public/video/
