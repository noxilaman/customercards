import { useRef, useState, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function centerAspectCrop(w, h, aspect) {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, w, h), w, h);
}

export default function CameraCapture({ label, required = false, onCapture, aspect = null }) {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const [rawSrc, setRawSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState('idle'); // idle | cropping | done

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setRawSrc(url);
    setMode('cropping');
    setCrop(undefined);
  };

  const onImageLoad = useCallback((e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (aspect) {
      setCrop(centerAspectCrop(w, h, aspect));
    } else {
      setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 });
    }
  }, [aspect]);

  const getCroppedBlob = () => new Promise((resolve) => {
    const image = imgRef.current;
    if (!image || !completedCrop) return resolve(null);
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      image,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, canvas.width, canvas.height
    );
    canvas.toBlob(resolve, 'image/jpeg', 0.9);
  });

  const handleConfirm = async () => {
    const blob = await getCroppedBlob();
    if (!blob) {
      // no crop done, use original file
      const file = fileInputRef.current.files[0];
      setPreview(rawSrc);
      onCapture(file);
    } else {
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setPreview(url);
      onCapture(file);
    }
    setMode('done');
  };

  const handleRetake = () => {
    setRawSrc(null);
    setPreview(null);
    setMode('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onCapture(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {mode === 'idle' && (
        <div
          className="border-2 border-dashed border-blue-300 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer bg-blue-50 active:bg-blue-100"
          onClick={() => fileInputRef.current.click()}
        >
          <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-blue-600 font-medium">ถ่ายภาพ / เลือกรูป</span>
          <span className="text-xs text-gray-400">แตะเพื่อเปิดกล้อง</span>
        </div>
      )}

      {mode === 'cropping' && rawSrc && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 text-center">ลากเพื่อเลือกพื้นที่ หรือกด "ใช้ทั้งหมด"</p>
          <div className="max-h-96 overflow-auto rounded-lg border border-gray-200">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect || undefined}
            >
              <img
                ref={imgRef}
                src={rawSrc}
                onLoad={onImageLoad}
                className="max-w-full"
                alt="crop preview"
              />
            </ReactCrop>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleRetake}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium">
              ถ่ายใหม่
            </button>
            <button type="button" onClick={() => { setCompletedCrop(null); handleConfirm(); }}
              className="flex-1 py-2 rounded-lg border border-blue-300 text-blue-600 text-sm font-medium">
              ใช้ทั้งหมด
            </button>
            <button type="button" onClick={handleConfirm}
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
              Crop & บันทึก
            </button>
          </div>
        </div>
      )}

      {mode === 'done' && preview && (
        <div className="space-y-2">
          <img src={preview} alt="captured" className="w-full rounded-xl border border-gray-200 max-h-56 object-contain bg-gray-50" />
          <button type="button" onClick={handleRetake}
            className="w-full py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium">
            ถ่ายใหม่
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
