/**
 * Waveform Viewer Component
 * Displays audio waveform and subtitle timing
 */
export class WaveformViewer {
  constructor(container) {
    this.container = container;

    // Ensure container has position relative for overlay
    if (window.getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    this.canvas = null;
    this.ctx = null;
    this.audioBuffer = null;
    this.rawWaveformData = null;
    this.subtitles = [];
    this.currentTime = 0;
    this.duration = 0;
    this.zoom = 100; // Default 10000%
    this.offset = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartTime = 0;

    // Subtitle block dragging
    this.isDraggingSubtitle = false;
    this.draggingSubtitleIndex = -1;
    this.draggingEdge = null; // 'start', 'end', or 'body'
    this.selectedSubtitleIndex = -1;

    // Region selection (for empty areas)
    this.isSelectingRegion = false;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.selectedRegion = null; // { startTime, endTime }

    // Scrollbar
    this.isDraggingScrollbar = false;
    this.scrollbarDragStart = 0;

    this.init();
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'waveform-canvas';
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight || 150;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.cursor = 'grab';
    this.ctx = this.canvas.getContext('2d');

    this.container.appendChild(this.canvas);

    // Create loading overlay
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'waveform-loading-overlay';
    this.loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: white;
      font-size: 16px;
      z-index: 1000;
    `;
    this.loadingOverlay.innerHTML = `
      <div style="text-align: center;">
        <div class="spinner" style="
          width: 50px;
          height: 50px;
          border: 5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <div class="loading-text">파형 데이터 로딩 중...</div>
        <div class="loading-progress" style="margin-top: 10px; font-size: 14px; color: #ccc;"></div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    this.container.appendChild(this.loadingOverlay);

    console.log('[Waveform] ✅ WaveformViewer initialized');
    console.log('[Waveform] Container:', this.container);
    console.log('[Waveform] Canvas:', this.canvas);
    console.log('[Waveform] Loading overlay:', this.loadingOverlay);

    // Mouse events for drag scrolling
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));

    // Resize handling
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Load audio from file or video
   */
  async loadAudio(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      this.duration = this.audioBuffer.duration;

      // Save to cache for external access
      this.saveWaveformToCache();

      this.render();
      return true;
    } catch (error) {
      console.error('Failed to load audio:', error);

      // Automatically load sample waveform
      console.log('Loading sample waveform...');
      return await this.loadSampleWaveform();
    }
  }

  /**
   * Show loading overlay
   */
  showLoading(message = '파형 데이터 로딩 중...', progress = '') {
    console.log('[Waveform] 🔄 showLoading:', message, progress);
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'flex';
      const textEl = this.loadingOverlay.querySelector('.loading-text');
      const progressEl = this.loadingOverlay.querySelector('.loading-progress');
      if (textEl) textEl.textContent = message;
      if (progressEl) progressEl.textContent = progress;
    } else {
      console.warn('[Waveform] ⚠️ loadingOverlay not found!');
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    console.log('[Waveform] ✅ hideLoading');
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'none';
    }
  }

  /**
   * Load sample waveform from server
   */
  async loadSampleWaveform() {
    try {
      console.log('[Waveform] loadSampleWaveform() called');

      // Try to load cached waveform from localStorage first
      const cachedData = localStorage.getItem('sample-waveform-data');
      if (cachedData) {
        this.showLoading('캐시에서 로딩 중...', '');
        console.log('[Waveform] Loading from localStorage cache...');
        const data = JSON.parse(cachedData);
        this.restoreAudioBuffer(data);
        this.hideLoading();
        console.log('[Waveform] Successfully loaded from cache');
        return true;
      }

      // Use full video waveform (68 minutes, 3.4MB, 100Hz sample rate)
      const filename = 'sample-waveform-full.json';
      const sampleUrl = `${window.location.origin}/samples/${filename}`;

      this.showLoading('파형 데이터 다운로드 중...', '3.4 MB');
      console.log('[Waveform] 📦 Loading full video waveform (68 min, 3.4MB, 100Hz)');
      console.log('[Waveform] No cache found, downloading from:', sampleUrl);

      const response = await fetch(sampleUrl);
      console.log('[Waveform] Fetch response status:', response.status, response.ok);

      if (!response.ok) throw new Error('Sample waveform not found: ' + response.status);

      this.showLoading('JSON 파싱 중...', '3.4 MB');
      console.log('[Waveform] Parsing JSON...');
      const data = await response.json();
      console.log('[Waveform] JSON parsed, channels:', data.numberOfChannels, 'length:', data.length, 'sampleRate:', data.sampleRate);

      // Try to cache it (skip if quota exceeded)
      try {
        this.showLoading('캐시에 저장 중...', '');
        console.log('[Waveform] Caching to localStorage...');
        localStorage.setItem('sample-waveform-data', JSON.stringify(data));
        console.log('[Waveform] Successfully cached');
      } catch (cacheError) {
        console.warn('[Waveform] Failed to cache (quota exceeded), continuing without cache:', cacheError.message);
      }

      this.showLoading('파형 렌더링 중...', '');
      this.restoreAudioBuffer(data);
      this.hideLoading();
      console.log('[Waveform] Sample waveform loaded successfully');
      return true;
    } catch (error) {
      this.hideLoading();
      console.error('[Waveform] ❌ Failed to load sample waveform:', error);
      console.error('[Waveform] Error stack:', error.stack);
      return false;
    }
  }

  /**
   * Restore AudioBuffer from serialized data
   * Note: For low sample rates (<3000 Hz), we skip AudioBuffer and use raw data directly
   */
  restoreAudioBuffer(data) {
    console.log('[Waveform] restoreAudioBuffer() - data:', data.numberOfChannels, 'channels,', data.length, 'samples,', data.sampleRate, 'Hz');

    // If sample rate is too low for AudioContext (min 3000 Hz), use raw data directly
    if (data.sampleRate < 3000) {
      console.log('[Waveform] ⚡ Sample rate too low for AudioBuffer, using raw data directly');

      // Store raw waveform data instead of AudioBuffer
      this.rawWaveformData = {
        numberOfChannels: data.numberOfChannels,
        length: data.length,
        sampleRate: data.sampleRate,
        channelData: data.channelData
      };

      this.audioBuffer = null;
      this.duration = data.duration || (data.length / data.sampleRate);

      console.log('[Waveform] Raw waveform data stored, duration:', this.duration, 'seconds');
      this.render();
      console.log('[Waveform] Waveform rendered successfully');
      return;
    }

    // Normal case: create AudioBuffer for high sample rates
    const audioContext = new AudioContext();
    this.audioBuffer = audioContext.createBuffer(
      data.numberOfChannels,
      data.length,
      data.sampleRate
    );

    // Copy channel data
    for (let channel = 0; channel < data.numberOfChannels; channel++) {
      const channelData = this.audioBuffer.getChannelData(channel);
      const sourceData = data.channelData[channel];
      for (let i = 0; i < sourceData.length; i++) {
        channelData[i] = sourceData[i];
      }
    }

    // Use stored duration if available, otherwise calculate from buffer
    this.duration = data.duration || this.audioBuffer.duration;
    console.log('[Waveform] AudioBuffer created, duration:', this.duration, 'seconds');

    this.render();
    console.log('[Waveform] Waveform rendered successfully');
  }

  /**
   * Save current waveform to localStorage
   */
  saveWaveformToCache() {
    if (!this.audioBuffer) return;

    const channelData = [];
    for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
      const data = this.audioBuffer.getChannelData(channel);
      channelData.push(Array.from(data));
    }

    const waveformData = {
      numberOfChannels: this.audioBuffer.numberOfChannels,
      length: this.audioBuffer.length,
      sampleRate: this.audioBuffer.sampleRate,
      channelData: channelData
    };

    localStorage.setItem('sample-waveform-data', JSON.stringify(waveformData));
    console.log('Waveform saved to cache');
  }

  /**
   * Load audio from video element
   */
  async loadAudioFromVideo(videoElement) {
    try {
      // Wait for video metadata to load
      if (videoElement.readyState < 1) {
        await new Promise((resolve) => {
          videoElement.addEventListener('loadedmetadata', resolve, { once: true });
        });
      }

      this.duration = videoElement.duration;
      console.log('Waveform: Video duration loaded:', this.duration);

      // Don't use createMediaElementSource as it interferes with video playback
      // Just render placeholder waveform (timeline and subtitle blocks only)
      this.render();
      return true;
    } catch (error) {
      console.error('Failed to load audio from video:', error);
      return false;
    }
  }

  /**
   * Load audio from URL
   */
  async loadAudioFromUrl(url) {
    console.log('[Waveform] 🔥 loadAudioFromUrl() v4.0 - skip for now');
    console.log('[Waveform] URL:', url);

    // For ngrok performance, skip audio extraction from video
    // Just use video element duration for timeline
    console.log('[Waveform] ⚡ Skipping audio decode for better performance');

    // Instead, try to load pre-generated waveform
    return await this.loadSampleWaveform();
  }

  /**
   * Set subtitles to display on waveform
   */
  setSubtitles(subtitles) {
    this.subtitles = subtitles;
    this.render();
  }

  /**
   * Update current playback position
   */
  setCurrentTime(time) {
    this.currentTime = time;

    // Check if current time is outside the selected subtitle range
    if (this.selectedSubtitleIndex >= 0 && this.subtitles.length > 0) {
      const selectedSub = this.subtitles[this.selectedSubtitleIndex];
      if (selectedSub) {
        const subStart = selectedSub.startTime.totalSeconds;
        const subEnd = selectedSub.endTime.totalSeconds;

        // If playback moved outside this subtitle, clear selection
        if (time < subStart || time > subEnd) {
          this.selectedSubtitleIndex = -1;
        }
      }
    }

    this.render();
  }

  /**
   * Set zoom level (1.0 = 100%, 2.0 = 200%, etc.)
   */
  setZoom(zoomLevel) {
    this.zoom = Math.max(1.0, Math.min(1000.0, zoomLevel)); // 100% ~ 100000%
    this.render();
  }

  /**
   * Get current zoom level
   */
  getZoom() {
    return this.zoom;
  }

  /**
   * Render waveform
   */
  render() {
    if (!this.ctx) {
      console.warn('[Waveform] ⚠️ render() called but ctx is null');
      return;
    }

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, width, height);

    // Calculate viewport (page-based scrolling)
    const visibleDuration = this.duration / this.zoom;

    // Only update viewport based on currentTime if not dragging scrollbar
    if (!this.isDraggingScrollbar) {
      // Calculate which "page" we're on
      const currentPage = Math.floor(this.currentTime / visibleDuration);
      let viewportStartTime = currentPage * visibleDuration;

      // Clamp viewport
      viewportStartTime = Math.max(0, Math.min(this.duration - visibleDuration, viewportStartTime));
      this.viewportStartTime = viewportStartTime;
    } else {
      // When dragging scrollbar, just clamp the manually set viewportStartTime
      this.viewportStartTime = Math.max(0, Math.min(this.duration - visibleDuration, this.viewportStartTime || 0));
    }

    if (this.audioBuffer || this.rawWaveformData) {
      this.drawWaveform(width, height);
    } else {
      this.drawPlaceholder(width, height);
    }

    this.drawSubtitleBlocks(width, height);
    this.drawSelectedRegion(width, height);
    this.drawPlayhead(width, height);
    this.drawTimeline(width, height);
    this.drawScrollArea(width, height);
  }

  /**
   * Draw scrollbar at bottom
   */
  drawScrollArea(width, height) {
    if (!this.duration) return;

    const scrollAreaHeight = 40;
    const scrollbarHeight = 20;
    const startY = height - scrollAreaHeight;
    const scrollbarY = startY + 10;

    // Draw background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.fillRect(0, startY, width, scrollAreaHeight);

    // Draw separator line
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, startY);
    this.ctx.lineTo(width, startY);
    this.ctx.stroke();

    // Draw scrollbar track
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(10, scrollbarY, width - 20, scrollbarHeight);
    this.ctx.strokeStyle = '#555';
    this.ctx.strokeRect(10, scrollbarY, width - 20, scrollbarHeight);

    // Calculate scrollbar thumb size and position
    const visibleDuration = this.duration / this.zoom;
    const viewportStartTime = this.viewportStartTime || 0;

    // Thumb width represents visible portion
    const thumbWidthRatio = Math.min(1, visibleDuration / this.duration);
    const thumbWidth = Math.max(30, (width - 20) * thumbWidthRatio);

    // Thumb position
    const scrollRatio = viewportStartTime / (this.duration - visibleDuration);
    const maxThumbX = (width - 20) - thumbWidth;
    const thumbX = 10 + (maxThumbX * Math.max(0, Math.min(1, scrollRatio)));

    // Draw scrollbar thumb
    this.ctx.fillStyle = '#0078d4';
    this.ctx.fillRect(thumbX, scrollbarY, thumbWidth, scrollbarHeight);
    this.ctx.strokeStyle = '#005a9e';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(thumbX, scrollbarY, thumbWidth, scrollbarHeight);

    // Draw grip lines on thumb
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    const gripX = thumbX + thumbWidth / 2;
    for (let i = -1; i <= 1; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(gripX + i * 3, scrollbarY + 5);
      this.ctx.lineTo(gripX + i * 3, scrollbarY + scrollbarHeight - 5);
      this.ctx.stroke();
    }

    // Store scrollbar bounds for hit testing
    this.scrollbarBounds = {
      x: 10,
      y: scrollbarY,
      width: width - 20,
      height: scrollbarHeight,
      thumbX: thumbX,
      thumbWidth: thumbWidth
    };
  }

  /**
   * Draw selected region (for empty area selection)
   */
  drawSelectedRegion(width, height) {
    if (!this.selectedRegion) return;

    // Exclude scrollbar area (40px at bottom)
    const scrollAreaHeight = 40;
    const waveformHeight = height - scrollAreaHeight;

    const visibleDuration = this.duration / this.zoom;
    const startTime = this.viewportStartTime || 0;
    const pixelsPerSecond = width / visibleDuration;

    const regionStartX = (this.selectedRegion.startTime - startTime) * pixelsPerSecond;
    const regionEndX = (this.selectedRegion.endTime - startTime) * pixelsPerSecond;

    // Draw semi-transparent overlay (waveform height only, not over scrollbar)
    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
    this.ctx.fillRect(regionStartX, 0, regionEndX - regionStartX, waveformHeight);

    // Draw borders
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(regionStartX, 0, regionEndX - regionStartX, waveformHeight);
    this.ctx.setLineDash([]);
  }

  /**
   * Draw waveform from audio buffer or raw data
   */
  drawWaveform(width, height) {
    // Get waveform data (support both AudioBuffer and raw data)
    let data;
    if (this.audioBuffer) {
      data = this.audioBuffer.getChannelData(0);
    } else if (this.rawWaveformData) {
      data = this.rawWaveformData.channelData[0];
    } else {
      console.warn('[Waveform] No waveform data available');
      return;
    }

    // Exclude scrollbar area (40px at bottom)
    const scrollAreaHeight = 40;
    const waveformHeight = height - scrollAreaHeight;

    // Apply zoom - show only a portion of the waveform
    const visibleDuration = this.duration / this.zoom;
    const startTime = this.viewportStartTime || 0;
    const endTime = Math.min(this.duration, startTime + visibleDuration);

    const startSample = Math.floor((startTime / this.duration) * data.length);
    const endSample = Math.floor((endTime / this.duration) * data.length);
    const visibleSamples = endSample - startSample;

    const step = Math.max(1, Math.ceil(visibleSamples / width));

    // Find current subtitle for coloring
    const currentTimeInView = this.currentTime;
    let currentSubtitle = null;
    let redStartX = -1;
    let redEndX = -1;

    if (this.subtitles) {
      currentSubtitle = this.subtitles.find(sub =>
        currentTimeInView >= sub.startTime.totalSeconds &&
        currentTimeInView <= sub.endTime.totalSeconds
      );

      if (currentSubtitle && currentTimeInView >= startTime && currentTimeInView <= endTime) {
        const subStartTime = currentSubtitle.startTime.totalSeconds;
        const subEndTime = currentSubtitle.endTime.totalSeconds;

        if (subEndTime >= startTime && subStartTime <= endTime) {
          redStartX = Math.max(0, ((subStartTime - startTime) / visibleDuration) * width);
          redEndX = Math.min(width, ((subEndTime - startTime) / visibleDuration) * width);
        }
      }
    }

    // Draw waveform with color coding
    this.ctx.lineWidth = 2;

    // Amplification factor - increase waveform height
    const amplification = 3.0; // 3x larger

    let currentColor = null;
    let pathStarted = false;

    for (let i = 0; i < width; i++) {
      const sampleIdx = startSample + Math.floor(i * step);
      const value = (sampleIdx >= 0 && sampleIdx < data.length) ? data[sampleIdx] : 0;

      // Amplify and convert audio value to Y coordinate
      const amplifiedValue = value * amplification;

      // Clamp to prevent going off screen
      const clampedValue = Math.max(-1, Math.min(1, amplifiedValue));

      const y = ((1 - clampedValue) / 2) * waveformHeight;

      // Determine color: red for current subtitle region, green otherwise
      const isInRedRegion = redStartX >= 0 && i >= redStartX && i <= redEndX;
      const color = isInRedRegion ? '#FF5722' : '#4CAF50';

      // If color changes, stroke the previous path and start new one
      if (color !== currentColor) {
        if (pathStarted) {
          this.ctx.lineTo(i, y); // Complete the transition
          this.ctx.stroke();
        }

        currentColor = color;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(i, y);
        pathStarted = true;
      } else {
        this.ctx.lineTo(i, y);
      }
    }

    // Stroke the final segment
    if (pathStarted) {
      this.ctx.stroke();
    }
  }

  /**
   * Draw placeholder when no audio loaded
   */
  drawPlaceholder(width, height) {
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, height / 2 - 1, width, 2);

    this.ctx.fillStyle = '#666';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';

    if (this.duration > 0) {
      // Video is loaded but no waveform data
      this.ctx.fillText('파형은 대용량 비디오 파일로 인해 표시되지 않습니다 (자막 블록은 표시됨)', width / 2, height / 2 + 25);
    } else {
      this.ctx.fillText('오디오/비디오 파일을 불러오면 파형이 표시됩니다', width / 2, height / 2 + 25);
    }
  }

  /**
   * Draw subtitle blocks on timeline
   */
  drawSubtitleBlocks(width, height) {
    if (!this.duration || this.subtitles.length === 0) return;

    // Exclude scrollbar area (40px at bottom)
    const scrollAreaHeight = 40;
    const waveformHeight = height - scrollAreaHeight;

    // Apply zoom
    const visibleDuration = this.duration / this.zoom;
    const startTime = this.viewportStartTime || 0;
    const endTime = Math.min(this.duration, startTime + visibleDuration);

    const pixelsPerSecond = width / visibleDuration;

    this.subtitles.forEach((subtitle, index) => {
      const subStart = subtitle.startTime.totalSeconds;
      const subEnd = subtitle.endTime.totalSeconds;

      // Only draw if visible
      if (subEnd < startTime || subStart > endTime) return;

      const startX = (subStart - startTime) * pixelsPerSecond;
      const endX = (subEnd - startTime) * pixelsPerSecond;
      const blockWidth = endX - startX;

      const isSelected = index === this.selectedSubtitleIndex;
      const lineWidth = isSelected ? 3 : 2;

      // Draw subtitle block overlay (waveform height only, not over scrollbar)
      this.ctx.fillStyle = isSelected ? 'rgba(255, 87, 34, 0.15)' : 'rgba(33, 150, 243, 0.1)';
      this.ctx.fillRect(startX, 0, blockWidth, waveformHeight);

      // Draw left border line (adjusted to align with block edge)
      this.ctx.strokeStyle = isSelected ? '#FF5722' : '#2196F3';
      this.ctx.lineWidth = lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(startX + lineWidth / 2, 0);
      this.ctx.lineTo(startX + lineWidth / 2, waveformHeight);
      this.ctx.stroke();

      // Draw right border line (adjusted to align with block edge)
      this.ctx.beginPath();
      this.ctx.moveTo(endX - lineWidth / 2, 0);
      this.ctx.lineTo(endX - lineWidth / 2, waveformHeight);
      this.ctx.stroke();

      // Draw subtitle text at top-left of block
      if (blockWidth > 10 && subtitle.text) {
        this.ctx.save();

        // Draw text background for readability
        const textPadding = 6;
        const textSize = 13;
        const textX = Math.max(0, Math.round(startX + lineWidth)); // Adjust for border line width
        const textY = 5;

        this.ctx.font = `${textSize}px "Segoe UI", Arial, sans-serif`;

        // Get first line of text (truncate if multiple lines)
        const textLines = subtitle.text.split('\n');
        let displayText = textLines[0].trim();

        // Measure full text first
        let textMetrics = this.ctx.measureText(displayText);
        const fullTextWidth = textMetrics.width;

        // Calculate max width (can extend beyond subtitle block)
        const maxDisplayWidth = width * 0.3; // Max 30% of canvas width

        let finalText = displayText;

        // Only truncate if text is too long for max display width
        if (fullTextWidth > maxDisplayWidth) {
          while (finalText.length > 0 && this.ctx.measureText(finalText + '...').width > maxDisplayWidth) {
            finalText = finalText.slice(0, -1);
          }
          if (finalText.length > 0) {
            finalText += '...';
          }
          textMetrics = this.ctx.measureText(finalText);
        }

        if (finalText.length === 0) {
          this.ctx.restore();
          return;
        }

        const actualTextWidth = textMetrics.width;
        const bgWidth = actualTextWidth + textPadding * 2;

        // Draw semi-transparent background (can extend beyond block)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(textX, textY, bgWidth, textSize + textPadding * 2);

        // Draw text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(finalText, textX + textPadding, textY + textPadding);

        this.ctx.restore();
      }

      // Draw subtitle info at bottom-left (number and duration)
      // Position above the scrollbar area (40px from bottom)
      if (blockWidth > 10) {
        this.ctx.save();

        const bottomPadding = 6;
        const bottomTextSize = 11;
        const bottomTextX = Math.max(0, Math.round(startX + lineWidth));
        const scrollAreaHeight = 40; // Height of scrollbar area at bottom
        const bottomTextY = height - scrollAreaHeight - bottomTextSize - bottomPadding * 2 - 5;

        this.ctx.font = `${bottomTextSize}px "Segoe UI", Arial, sans-serif`;

        const subtitleNumber = index + 1;
        const duration = (subtitle.endTime.totalMilliseconds - subtitle.startTime.totalMilliseconds) / 1000;
        const infoText = `#${subtitleNumber} ${duration.toFixed(3)}s`;

        const infoMetrics = this.ctx.measureText(infoText);
        const infoBgWidth = infoMetrics.width + bottomPadding * 2;

        // Draw semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(bottomTextX, bottomTextY, infoBgWidth, bottomTextSize + bottomPadding * 2);

        // Draw text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(infoText, bottomTextX + bottomPadding, bottomTextY + bottomPadding);

        this.ctx.restore();
      }

      // Draw resize handles at bottom (visual indicators)
      if (isSelected && blockWidth > 10) {
        const handleHeight = 30;
        const handleY = height - handleHeight;

        this.ctx.fillStyle = '#FF5722';
        // Left handle
        this.ctx.fillRect(startX, handleY, 5, handleHeight);
        // Right handle
        this.ctx.fillRect(endX - 5, handleY, 5, handleHeight);
      }
    });
  }

  /**
   * Draw playhead indicator
   */
  drawPlayhead(width, height) {
    if (!this.duration) return;

    // Exclude scrollbar area (40px at bottom)
    const scrollAreaHeight = 40;
    const waveformHeight = height - scrollAreaHeight;

    const visibleDuration = this.duration / this.zoom;
    const viewportStartTime = this.viewportStartTime || 0;

    // Calculate playhead X position within current page
    const timeInPage = this.currentTime - viewportStartTime;
    const playheadX = (timeInPage / visibleDuration) * width;

    // Draw playhead line (only in waveform area, not over scrollbar)
    this.ctx.strokeStyle = '#FF5722';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(playheadX, 0);
    this.ctx.lineTo(playheadX, waveformHeight);
    this.ctx.stroke();

    // Draw time label
    this.ctx.fillStyle = '#FF5722';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    const timeStr = this.formatTime(this.currentTime);
    this.ctx.fillText(timeStr, playheadX, 15);
  }

  /**
   * Draw timeline with time markers
   */
  drawTimeline(width, height) {
    if (!this.duration) return;

    // Apply zoom
    const visibleDuration = this.duration / this.zoom;
    const startTime = this.viewportStartTime || 0;
    const endTime = Math.min(this.duration, startTime + visibleDuration);

    this.ctx.strokeStyle = '#555';
    this.ctx.fillStyle = '#999';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';

    const interval = this.getTimeInterval() / this.zoom;
    const pixelsPerSecond = width / visibleDuration;

    for (let t = Math.floor(startTime / interval) * interval; t <= endTime; t += interval) {
      const x = (t - startTime) * pixelsPerSecond;

      // Draw tick
      this.ctx.beginPath();
      this.ctx.moveTo(x, height - 25);
      this.ctx.lineTo(x, height - 30);
      this.ctx.stroke();

      // Draw time label
      if (Math.round(t / interval) % 2 === 0) {
        this.ctx.fillText(this.formatTime(t), x, height - 32);
      }
    }
  }

  /**
   * Get appropriate time interval based on duration
   */
  getTimeInterval() {
    if (this.duration < 60) return 5; // 5 seconds
    if (this.duration < 300) return 10; // 10 seconds
    if (this.duration < 600) return 30; // 30 seconds
    return 60; // 1 minute
  }

  /**
   * Format time as MM:SS
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Handle mouse down - start dragging
   */
  handleMouseDown(e) {
    if (!this.duration) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // PRIORITY 1: Check if clicking on scrollbar (highest priority)
    if (this.scrollbarBounds && this.isInScrollbar(x, y)) {
      this.isDraggingScrollbar = true;
      this.scrollbarDragStart = x;
      this.canvas.style.cursor = 'grabbing';

      // Check if clicking on thumb or track
      const thumbStart = this.scrollbarBounds.thumbX;
      const thumbEnd = thumbStart + this.scrollbarBounds.thumbWidth;

      if (x >= thumbStart && x <= thumbEnd) {
        // Clicked on thumb - start dragging
        this.scrollbarThumbOffset = x - thumbStart;
      } else {
        // Clicked on track - jump to position
        this.scrollbarThumbOffset = this.scrollbarBounds.thumbWidth / 2;
        this.updateScrollbarPosition(x);
      }
      return;
    }

    // PRIORITY 2: Check if clicking on a subtitle block (only in waveform area, not scrollbar)
    const scrollAreaHeight = 40;
    const waveformHeight = this.canvas.height - scrollAreaHeight;

    if (y < waveformHeight) {
      const result = this.getSubtitleAtPosition(x, y);

      if (result) {
        this.isDraggingSubtitle = true;
        this.draggingSubtitleIndex = result.index;
        this.draggingEdge = result.edge;
        this.selectedSubtitleIndex = result.index;
        this.dragStartX = e.clientX;
        this.canvas.style.cursor = result.edge === 'body' ? 'move' : 'ew-resize';
        this.selectedRegion = null; // Clear region selection
        this.render();
        return;
      }

      // PRIORITY 3: Start region selection in empty area (upper part only)
      const visibleDuration = this.duration / this.zoom;
      const viewportStartTime = this.viewportStartTime || 0;
      const clickTime = viewportStartTime + (x / this.canvas.width) * visibleDuration;

      this.isSelectingRegion = true;
      this.selectionStart = clickTime;
      this.selectionEnd = clickTime;
      this.dragStartX = e.clientX;
      this.canvas.style.cursor = 'crosshair';
    }
  }

  /**
   * Handle mouse move - drag to scroll or resize subtitle or select region
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle scrollbar dragging
    if (this.isDraggingScrollbar) {
      this.updateScrollbarPosition(x);
      return;
    }

    // Handle region selection
    if (this.isSelectingRegion) {
      const visibleDuration = this.duration / this.zoom;
      const viewportStartTime = this.viewportStartTime || 0;
      const currentTime = viewportStartTime + (x / this.canvas.width) * visibleDuration;

      this.selectionEnd = Math.max(0, Math.min(this.duration, currentTime));

      // Update selected region for display
      this.selectedRegion = {
        startTime: Math.min(this.selectionStart, this.selectionEnd),
        endTime: Math.max(this.selectionStart, this.selectionEnd)
      };

      this.render();
      return;
    }

    // Handle subtitle dragging
    if (this.isDraggingSubtitle && this.draggingSubtitleIndex >= 0) {
      const deltaX = e.clientX - this.dragStartX;
      const visibleDuration = this.duration / this.zoom;
      const pixelsPerSecond = this.canvas.width / visibleDuration;
      const deltaTime = deltaX / pixelsPerSecond;

      const subtitle = this.subtitles[this.draggingSubtitleIndex];

      if (this.draggingEdge === 'start') {
        // Resize from start
        const currentStart = subtitle.startTime.totalSeconds;
        const newStart = Math.max(0, currentStart + deltaTime);
        if (newStart < subtitle.endTime.totalSeconds - 0.1) {
          subtitle.startTime.totalMilliseconds = newStart * 1000;
          this.dragStartX = e.clientX;
          this.render();
          this.onSubtitleChanged && this.onSubtitleChanged(this.draggingSubtitleIndex);
        }
      } else if (this.draggingEdge === 'end') {
        // Resize from end
        const currentEnd = subtitle.endTime.totalSeconds;
        const newEnd = Math.min(this.duration, currentEnd + deltaTime);
        if (newEnd > subtitle.startTime.totalSeconds + 0.1) {
          subtitle.endTime.totalMilliseconds = newEnd * 1000;
          this.dragStartX = e.clientX;
          this.render();
          this.onSubtitleChanged && this.onSubtitleChanged(this.draggingSubtitleIndex);
        }
      } else if (this.draggingEdge === 'body') {
        // Move entire subtitle
        const duration = subtitle.endTime.totalSeconds - subtitle.startTime.totalSeconds;
        const currentStart = subtitle.startTime.totalSeconds;
        const newStart = Math.max(0, Math.min(this.duration - duration, currentStart + deltaTime));
        subtitle.startTime.totalMilliseconds = newStart * 1000;
        subtitle.endTime.totalMilliseconds = (newStart + duration) * 1000;
        this.dragStartX = e.clientX;
        this.render();
        this.onSubtitleChanged && this.onSubtitleChanged(this.draggingSubtitleIndex);
      }
      return;
    }

    // Handle waveform dragging
    if (this.isDragging && this.duration) {
      const deltaX = e.clientX - this.dragStartX;
      const visibleDuration = this.duration / this.zoom;
      const pixelsPerSecond = this.canvas.width / visibleDuration;
      const deltaTime = -deltaX / pixelsPerSecond; // Negative for natural scrolling

      let newTime = this.dragStartTime + deltaTime;

      // Clamp to valid range
      newTime = Math.max(0, Math.min(this.duration, newTime));

      this.currentTime = newTime;
      this.render();

      // Emit time update for video sync
      this.onSeek && this.onSeek(this.currentTime);
      return;
    }

    // Update cursor based on hover position
    if (this.isInScrollbar(x, y)) {
      // In scrollbar area
      this.canvas.style.cursor = 'pointer';
    } else {
      const result = this.getSubtitleAtPosition(x, y);
      if (result) {
        if (result.edge === 'start' || result.edge === 'end') {
          this.canvas.style.cursor = 'ew-resize';
        } else {
          this.canvas.style.cursor = 'move';
        }
      } else {
        this.canvas.style.cursor = 'crosshair';
      }
    }
  }

  /**
   * Handle mouse up - stop dragging
   */
  handleMouseUp(e) {
    if (this.isDraggingScrollbar) {
      this.isDraggingScrollbar = false;
      this.canvas.style.cursor = 'grab';

      // Sync video position to middle of viewport after scrollbar drag
      const visibleDuration = this.duration / this.zoom;
      const viewportStartTime = this.viewportStartTime || 0;
      const newTime = viewportStartTime + visibleDuration / 2; // Middle of visible area

      this.currentTime = Math.max(0, Math.min(this.duration, newTime));
      this.onSeek && this.onSeek(this.currentTime);

      return;
    }

    if (this.isSelectingRegion) {
      this.isSelectingRegion = false;
      this.canvas.style.cursor = 'grab';

      // Finalize selection
      if (this.selectedRegion && Math.abs(this.selectedRegion.endTime - this.selectedRegion.startTime) < 0.05) {
        // Too small, clear selection
        this.selectedRegion = null;
        this.render();
      }

      return;
    }

    if (this.isDraggingSubtitle) {
      const wasDragging = Math.abs(e.clientX - this.dragStartX) > 5;
      const clickedIndex = this.draggingSubtitleIndex;

      this.isDraggingSubtitle = false;
      this.draggingSubtitleIndex = -1;
      this.draggingEdge = null;
      this.canvas.style.cursor = 'grab';

      // If it was a click (not drag), select the subtitle
      if (!wasDragging && clickedIndex >= 0) {
        this.onSubtitleSelected && this.onSubtitleSelected(clickedIndex);
      }

      return;
    }

    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';

      // If no significant drag, treat as click
      const deltaX = Math.abs(e.clientX - this.dragStartX);
      if (deltaX < 5) {
        // Small movement, treat as click to seek
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Calculate click time based on current viewport
        const visibleDuration = this.duration / this.zoom;
        const viewportStartTime = this.viewportStartTime || 0;
        const clickRatio = x / this.canvas.width;
        const clickTime = viewportStartTime + clickRatio * visibleDuration;

        console.log('=== Waveform Click Debug ===');
        console.log('Click X:', x);
        console.log('Canvas Width:', this.canvas.width);
        console.log('Click Ratio:', clickRatio);
        console.log('Visible Duration:', visibleDuration);
        console.log('Viewport Start Time:', viewportStartTime);
        console.log('Calculated Click Time:', clickTime);
        console.log('Current Time Before:', this.currentTime);

        this.currentTime = Math.max(0, Math.min(this.duration, clickTime));

        console.log('Current Time After:', this.currentTime);
        console.log('========================');

        this.render();
        this.onSeek && this.onSeek(this.currentTime);
      }
    }
  }

  /**
   * Get subtitle at mouse position
   */
  getSubtitleAtPosition(x, y) {
    if (!this.duration || this.subtitles.length === 0) return null;

    const width = this.canvas.width;
    const visibleDuration = this.duration / this.zoom;
    const startTime = this.viewportStartTime || 0; // Use viewport start time
    const pixelsPerSecond = width / visibleDuration;

    // Check from back to front (last drawn = on top)
    for (let i = this.subtitles.length - 1; i >= 0; i--) {
      const subtitle = this.subtitles[i];
      const subStart = subtitle.startTime.totalSeconds;
      const subEnd = subtitle.endTime.totalSeconds;

      const startX = (subStart - startTime) * pixelsPerSecond;
      const endX = (subEnd - startTime) * pixelsPerSecond;

      if (x >= startX && x <= endX) {
        // Check which edge
        const edgeThreshold = 10;
        if (x < startX + edgeThreshold) {
          return { index: i, edge: 'start' };
        } else if (x > endX - edgeThreshold) {
          return { index: i, edge: 'end' };
        } else {
          return { index: i, edge: 'body' };
        }
      }
    }

    return null;
  }

  /**
   * Handle double click - seek to position in empty area
   */
  handleDoubleClick(e) {
    if (!this.duration) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if in scrollbar area - ignore
    if (this.scrollbarBounds && this.isInScrollbar(x, y)) {
      return;
    }

    // Check if in waveform area
    const scrollAreaHeight = 40;
    const waveformHeight = this.canvas.height - scrollAreaHeight;

    if (y >= waveformHeight) {
      return;
    }

    // Check if clicking on a subtitle block - ignore
    const result = this.getSubtitleAtPosition(x, y);
    if (result) {
      return;
    }

    // Empty area - seek to this position
    const visibleDuration = this.duration / this.zoom;
    const viewportStartTime = this.viewportStartTime || 0;
    const clickRatio = x / this.canvas.width;
    const clickTime = viewportStartTime + clickRatio * visibleDuration;

    this.currentTime = Math.max(0, Math.min(this.duration, clickTime));
    this.render();
    this.onSeek && this.onSeek(this.currentTime);
  }

  /**
   * Handle context menu (right-click)
   */
  handleContextMenu(e) {
    e.preventDefault();

    if (!this.selectedRegion) {
      // No region selected, ignore
      return;
    }

    // Show context menu
    this.onRegionContextMenu && this.onRegionContextMenu(
      e.clientX,
      e.clientY,
      this.selectedRegion
    );
  }

  /**
   * Check if position is in scrollbar area
   */
  isInScrollbar(x, y) {
    if (!this.scrollbarBounds) return false;
    return x >= this.scrollbarBounds.x &&
           x <= this.scrollbarBounds.x + this.scrollbarBounds.width &&
           y >= this.scrollbarBounds.y &&
           y <= this.scrollbarBounds.y + this.scrollbarBounds.height;
  }

  /**
   * Update scrollbar position based on mouse X
   */
  updateScrollbarPosition(mouseX) {
    if (!this.scrollbarBounds || !this.duration) return;

    const visibleDuration = this.duration / this.zoom;

    // Calculate new thumb position
    const thumbX = mouseX - this.scrollbarBounds.x - (this.scrollbarThumbOffset || 0);
    const maxThumbX = this.scrollbarBounds.width - this.scrollbarBounds.thumbWidth;
    const clampedThumbX = Math.max(0, Math.min(maxThumbX, thumbX));

    // Convert thumb position to time (smooth scrolling)
    const scrollRatio = maxThumbX > 0 ? clampedThumbX / maxThumbX : 0;
    const newViewportStart = scrollRatio * (this.duration - visibleDuration);

    // Update viewport start time for smooth scrolling
    this.viewportStartTime = Math.max(0, Math.min(this.duration - visibleDuration, newViewportStart));

    this.render();
  }

  /**
   * Resize canvas
   */
  resize() {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight || 150;
    this.render();
  }

  /**
   * Clear waveform
   */
  clear() {
    this.audioBuffer = null;
    this.rawWaveformData = null;
    this.subtitles = [];
    this.currentTime = 0;
    this.duration = 0;
    this.render();
  }
}
