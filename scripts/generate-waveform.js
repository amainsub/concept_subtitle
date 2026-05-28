/**
 * Generate waveform data from video file using FFmpeg
 * Usage: node scripts/generate-waveform.js <input-video> <output-json>
 */
import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function generateWaveform(inputFile, outputFile) {
  try {
    console.log('Extracting audio with FFmpeg...');

    // Extract audio as raw PCM
    const tempFile = '/tmp/audio-temp.raw';
    await execAsync(`ffmpeg -i "${inputFile}" -f f32le -acodec pcm_f32le -ac 2 -ar 44100 "${tempFile}" -y`);

    console.log('Reading audio data...');
    const buffer = fs.readFileSync(tempFile);
    const samples = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);

    // Get duration from ffprobe
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputFile}"`);
    const duration = parseFloat(stdout.trim());

    console.log('Downsampling for web...');
    // Downsample to reduce file size (keep 1 in every 1000 samples)
    const downsampleFactor = 1000;
    const downsampledLength = Math.floor(samples.length / 2 / downsampleFactor);

    const leftChannel = [];
    const rightChannel = [];

    for (let i = 0; i < downsampledLength; i++) {
      const sourceIndex = i * downsampleFactor * 2;
      leftChannel.push(samples[sourceIndex] || 0);
      rightChannel.push(samples[sourceIndex + 1] || 0);
    }

    const waveformData = {
      numberOfChannels: 2,
      length: downsampledLength,
      sampleRate: 44100 / downsampleFactor, // Adjusted sample rate
      duration: duration,
      channelData: [leftChannel, rightChannel]
    };

    console.log('Writing output file...');
    fs.writeFileSync(outputFile, JSON.stringify(waveformData));

    // Cleanup
    fs.unlinkSync(tempFile);

    console.log('Done!');
    console.log(`- Duration: ${duration.toFixed(2)}s`);
    console.log(`- Original samples: ${samples.length / 2}`);
    console.log(`- Downsampled: ${downsampledLength}`);
    console.log(`- File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)}MB`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

const inputFile = process.argv[2] || 'public/samples/default.mp4';
const outputFile = process.argv[3] || 'public/samples/sample-waveform.json';

generateWaveform(inputFile, outputFile);
