import { useRef, useState, useCallback, useEffect } from 'react';
import styles from '../../styles/components/sg-sst/SignaturePad.module.css';

interface SignaturePadProps {
  onSignatureSave: (signatureData: string) => void;
  onClear: () => void;
}

interface Point {
  x: number;
  y: number;
}

export default function SignaturePad({ onSignatureSave, onClear }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Inicializar canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar estilo del dibujo
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    // Calcular factores de escala
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x: number, y: number;

    if ('touches' in e) {
      // TOUCH - para móvil
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) * scaleX;
      y = (touch.clientY - rect.top) * scaleY;
    } else {
      // MOUSE - para desktop
      // Para desktop, es más confiable usar pageX/pageY
      const mouseEvent = e.nativeEvent as MouseEvent;
      x = (mouseEvent.pageX - (rect.left + window.pageXOffset)) * scaleX;
      y = (mouseEvent.pageY - (rect.top + window.pageYOffset)) * scaleY;
    }

    // Limitar coordenadas al área del canvas
    x = Math.max(0, Math.min(x, canvas.width));
    y = Math.max(0, Math.min(y, canvas.height));

    return { x, y };
  }, []);

  // Iniciar dibujo
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);

    // Agregar estilo visual cuando se está dibujando
    canvas.parentElement?.classList.add(styles.drawing);
  }, [getCoordinates]);

  // Dibujar
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }, [isDrawing, getCoordinates]);

  // Detener dibujo
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setHasSignature(true);

    // Remover estilo visual
    const canvas = canvasRef.current;
    canvas?.parentElement?.classList.remove(styles.drawing);
  }, []);

  // Limpiar firma
  const clearSignature = useCallback(() => {
    initCanvas();
    setHasSignature(false);
    onClear();
  }, [initCanvas, onClear]);

  // Guardar firma
  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    onSignatureSave(signatureData);
  }, [onSignatureSave]);

  // Inicializar canvas cuando el componente se monta
  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  return (
    <div className={styles.container}>
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className={styles.canvas}
          // Eventos de mouse
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          // Eventos táctiles
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
        <div className={styles.canvasLabel}>
          {isMobile ? 'Deslice su dedo para firmar' : 'Firme en el área anterior'}
        </div>

        {isMobile && (
          <div className={styles.mobileInstructions}>
            📱 Use un dedo para firmar en el área gris
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.clearButton}
          onClick={clearSignature}
          disabled={!hasSignature}
        >
          🗑️ Limpiar Firma
        </button>
        <button
          type="button"
          className={styles.saveButton}
          onClick={saveSignature}
          disabled={!hasSignature}
        >
          💾 Guardar Firma
        </button>
      </div>

      {hasSignature && (
        <div className={styles.signatureSaved}>
          ✅ Firma lista para guardar con el formulario
        </div>
      )}
    </div>
  );
}