/**
 * Video Player Component with subtitle overlay
 */
export class VideoPlayer {
  constructor(container) {
    this.container = container;
    this.video = null;
    this.subtitleOverlay = null;
    this.currentSubtitle = null;
    this.subtitles = [];
    this.isPlaying = false;

    this.init();
  }

  init() {
    // Create video element
    this.video = document.createElement('video');
    this.video.className = 'video-element';
    this.video.controls = true;
    this.video.style.width = '100%';
    this.video.style.height = '100%';
    this.video.style.objectFit = 'cover';
    this.video.style.backgroundColor = '#000';

    // Create subtitle overlay
    this.subtitleOverlay = document.createElement('div');
    this.subtitleOverlay.className = 'subtitle-overlay';
    this.subtitleOverlay.style.position = 'absolute';
    this.subtitleOverlay.style.bottom = '60px';
    this.subtitleOverlay.style.left = '0';
    this.subtitleOverlay.style.right = '0';
    this.subtitleOverlay.style.textAlign = 'center';
    this.subtitleOverlay.style.color = 'white';
    this.subtitleOverlay.style.fontSize = '24px';
    this.subtitleOverlay.style.fontWeight = 'bold';
    this.subtitleOverlay.style.textShadow = '2px 2px 4px black';
    this.subtitleOverlay.style.padding = '10px';
    this.subtitleOverlay.style.pointerEvents = 'none';

    // Wrapper for positioning
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.appendChild(this.video);
    wrapper.appendChild(this.subtitleOverlay);

    this.container.appendChild(wrapper);

    // Event listeners
    this.video.addEventListener('timeupdate', () => this.updateSubtitle());
    this.video.addEventListener('play', () => {
      this.isPlaying = true;
      this.onPlay && this.onPlay();
    });
    this.video.addEventListener('pause', () => {
      this.isPlaying = false;
      this.onPause && this.onPause();
    });
    this.video.addEventListener('seeked', () => {
      this.onSeek && this.onSeek(this.video.currentTime);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  /**
   * Load video file
   */
  loadVideo(file) {
    const url = URL.createObjectURL(file);
    this.video.src = url;
    return this.video;
  }

  /**
   * Load video from URL
   */
  loadVideoFromUrl(url) {
    this.video.src = url;

    // Add error handler
    this.video.addEventListener('error', (e) => {
      console.error('Video load error:', e);
      console.error('Video error code:', this.video.error?.code);
      console.error('Video error message:', this.video.error?.message);
    });

    // Add loadedmetadata handler
    this.video.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded:', {
        duration: this.video.duration,
        videoWidth: this.video.videoWidth,
        videoHeight: this.video.videoHeight
      });
    });

    return this.video;
  }

  /**
   * Set subtitles for display
   */
  setSubtitles(subtitles) {
    this.subtitles = subtitles;
    this.updateSubtitle();
  }

  /**
   * Update displayed subtitle based on current time
   */
  updateSubtitle() {
    const currentTime = this.video.currentTime * 1000; // Convert to ms

    // Find current subtitle
    const current = this.subtitles.find(sub =>
      currentTime >= sub.startTime.totalMilliseconds &&
      currentTime <= sub.endTime.totalMilliseconds
    );

    if (current) {
      this.subtitleOverlay.innerHTML = current.text.replace(/\n/g, '<br>');
      this.currentSubtitle = current;
    } else {
      this.subtitleOverlay.innerHTML = '';
      this.currentSubtitle = null;
    }

    // Emit time update
    this.onTimeUpdate && this.onTimeUpdate(this.video.currentTime);
  }

  /**
   * Play video
   */
  play() {
    this.video.play();
  }

  /**
   * Pause video
   */
  pause() {
    this.video.pause();
  }

  /**
   * Toggle play/pause
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek to time (in seconds)
   */
  async seek(time) {
    if (!this.video) {
      console.error('VideoPlayer.seek: video element not found');
      return;
    }
    if (isNaN(time) || time < 0) {
      console.error('VideoPlayer.seek: invalid time', time);
      return;
    }

    // Wait for video to be ready
    if (this.video.readyState < 2) {
      console.log('VideoPlayer.seek: waiting for video to be ready, readyState =', this.video.readyState);
      await new Promise((resolve) => {
        const checkReady = () => {
          if (this.video.readyState >= 2) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }

    console.log('VideoPlayer.seek: readyState =', this.video.readyState);
    console.log('VideoPlayer.seek: duration =', this.video.duration);
    console.log('VideoPlayer.seek: BEFORE currentTime =', this.video.currentTime);

    // Clamp time to valid range
    const seekTime = Math.max(0, Math.min(time, this.video.duration || time));

    this.video.currentTime = seekTime;

    console.log('VideoPlayer.seek: AFTER currentTime =', this.video.currentTime);
  }

  /**
   * Step forward by frames
   */
  stepForward(frames = 1, fps = 25) {
    const stepTime = frames / fps;
    this.video.currentTime += stepTime;
  }

  /**
   * Step backward by frames
   */
  stepBackward(frames = 1, fps = 25) {
    const stepTime = frames / fps;
    this.video.currentTime = Math.max(0, this.video.currentTime - stepTime);
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboard(e) {
    // Only handle if video is focused or no input is focused
    if (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key) {
      case ' ':
        e.preventDefault();
        this.togglePlay();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.stepBackward(e.shiftKey ? 10 : 1);
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.stepForward(e.shiftKey ? 10 : 1);
        break;

      case 'Home':
        e.preventDefault();
        this.seek(0);
        break;

      case 'End':
        e.preventDefault();
        this.seek(this.video.duration);
        break;
    }
  }

  /**
   * Get video duration
   */
  getDuration() {
    return this.video.duration;
  }

  /**
   * Get current time
   */
  getCurrentTime() {
    return this.video.currentTime;
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate) {
    this.video.playbackRate = rate;
  }

  /**
   * Show/hide subtitles
   */
  toggleSubtitles(show) {
    this.subtitleOverlay.style.display = show ? 'block' : 'none';
  }
}
