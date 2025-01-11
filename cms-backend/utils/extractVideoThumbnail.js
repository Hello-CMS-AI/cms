// utils/extractVideoThumbnail.js
export const extractVideoThumbnail = (videoUrl) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
  
      // Handle CORS
      video.crossOrigin = 'Anonymous';
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 1; // Capture at 1 second
  
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
  
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
        const imageUrl = canvas.toDataURL('image/png');
        resolve(imageUrl);
      };
  
      video.onerror = (error) => {
        reject('Failed to load video for thumbnail extraction.');
      };
    });
  };
  