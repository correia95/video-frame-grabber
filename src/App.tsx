import { useCallback, useRef, useState } from 'react';
import { clampTime, formatTime, frameFileName, type ImageFormat } from './frame';

export default function App() {
  const [fileName, setFileName] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [format, setFormat] = useState<ImageFormat>('image/png');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outDims, setOutDims] = useState<{ w: number; h: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('That is not a video file.');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setError('That video is over 500 MB — try a smaller file.');
      return;
    }
    setError('');
    const url = URL.createObjectURL(file);
    setFileName(file.name);
    setVideoUrl(url);
    setOutUrl(null);
    setOutDims(null);
    setTime(0);
  }, []);

  function reset() {
    setFileName('');
    setVideoUrl((u) => { if (u) URL.revokeObjectURL(u); return null; });
    setDuration(0);
    setTime(0);
    setError('');
    setOutUrl((u) => { if (u) URL.revokeObjectURL(u); return null; });
    setOutDims(null);
  }

  function onLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
  }

  function seekTo(t: number) {
    const v = videoRef.current;
    if (!v) return;
    const clamped = clampTime(t, duration);
    setTime(clamped);
    v.currentTime = clamped;
  }

  function grabFrame() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setError('Could not create a canvas to capture the frame.'); return; }
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) { setError('Capturing the frame failed.'); return; }
        setOutUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
        setOutDims({ w: canvas.width, h: canvas.height });
      },
      format,
      format === 'image/jpeg' ? 0.92 : undefined,
    );
  }

  return (
    <div className="page">
      <h1>Video Frame Grabber</h1>
      <p className="lede">
        Scrub to any moment in a video and save that exact frame as an image. Everything happens
        in your browser — the video is never uploaded.
      </p>

      {!videoUrl && (
        <div
          className={`drop${dragOver ? ' over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) loadFile(file);
          }}
        >
          <p>Drag a video here, or</p>
          <label className="filebtn">
            Choose a video
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadFile(file);
              }}
            />
          </label>
          {error && <p className="err">{error}</p>}
        </div>
      )}

      {videoUrl && (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            className="video"
            onLoadedMetadata={onLoadedMetadata}
            controls={false}
          />

          <div className="scrub-row">
            <input
              type="range" min={0} max={duration || 0} step={0.01} value={time}
              onChange={(e) => seekTo(Number(e.target.value))}
              disabled={!duration}
            />
            <span className="time">{formatTime(time)} / {formatTime(duration)}</span>
          </div>

          <div className="controls">
            <label className="field">
              <span>Format</span>
              <select value={format} onChange={(e) => setFormat(e.target.value as ImageFormat)}>
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
              </select>
            </label>
          </div>

          <div className="actions">
            <button className="primary" onClick={grabFrame}>Grab this frame</button>
            <button className="ghost" onClick={reset}>Choose a different video</button>
          </div>

          {outUrl && outDims && (
            <div className="result">
              <img src={outUrl} alt="Captured frame" className="preview" />
              <p className="hint">{outDims.w} × {outDims.h}px at {formatTime(time)}</p>
              <a className="primary" href={outUrl} download={frameFileName(fileName, time, format)}>Download</a>
            </div>
          )}
        </>
      )}

      <section className="explainer">
        <h2>How it works</h2>
        <p>
          The video plays in a hidden player in your browser. When you grab a frame, that exact
          moment is drawn onto a canvas at full resolution and exported as an image.
        </p>
        <h3>Does this upload my video anywhere?</h3>
        <p>No. The video is read locally and never leaves your device.</p>
      </section>
    </div>
  );
}
