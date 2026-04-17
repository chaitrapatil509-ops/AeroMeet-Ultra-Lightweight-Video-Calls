import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

/**
 * AeroFX: Advanced Background Processing Engine
 * Handles real-time segmentation, blurring, and replacement using GPU acceleration.
 */
export class AeroFXEngine {
    constructor() {
        this.segmenter = new SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });

        this.segmenter.setOptions({
            modelSelection: 1, // 1 is landscape, faster for meetings
            selfieMode: true,
        });

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.blurAmount = 0;
        this.backgroundImage = null;
        this.isEnabled = false;
        
        this.segmenter.onResults(this.render.bind(this));
    }

    setEffect(type, value) {
        if (type === 'blur') {
            this.blurAmount = value;
            this.backgroundImage = null;
        } else if (type === 'image') {
            this.backgroundImage = value;
            this.blurAmount = 0;
        } else {
            this.blurAmount = 0;
            this.backgroundImage = null;
            this.isEnabled = false;
        }
    }

    async processFrame(videoElement) {
        if (!this.isEnabled) return;
        
        this.canvas.width = videoElement.videoWidth;
        this.canvas.height = videoElement.videoHeight;
        this.sourceVideo = videoElement;

        await this.segmenter.send({ image: videoElement });
    }

    render(results) {
        const { ctx, canvas, sourceVideo, blurAmount, backgroundImage } = this;
        
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw the background layer
        if (blurAmount > 0) {
            ctx.filter = `blur(${blurAmount}px)`;
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        } else if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        }
        ctx.filter = 'none';

        // 2. Composite the foreground (the person) using the segmentation mask
        ctx.globalCompositeOperation = 'destination-atop';
        ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        
        ctx.restore();
    }

    getStream() {
        return this.canvas.captureStream(30);
    }
}
