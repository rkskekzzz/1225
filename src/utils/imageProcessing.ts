/**
 * Utility functions for processing textures for the 3D calendar box
 */

export interface ProcessedBoxTextures {
  front: string;    // Center 5:5 section as data URL
  top: string;      // Top 5:1 section as data URL
  bottom: string;   // Bottom 5:1 section as data URL
  left: string;     // Left 1:5 section as data URL
  right: string;    // Right 1:5 section as data URL
}

/**
 * Process an image for box textures
 *
 * Steps:
 * 1. Crop to square by removing equal amounts from left and right
 * 2. Divide into 9 sections:
 *    (1,1) | (5,1) | (1,1)
 *    (1,5) | (5,5) | (1,5)
 *    (1,1) | (5,1) | (1,1)
 * 3. Discard corners (1,1), use center (5,5) as front, and sides (1,5 or 5,1) as side textures
 */
export async function processImageForBox(imageUrl: string): Promise<ProcessedBoxTextures> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // Step 1: Calculate square crop dimensions
        let cropWidth: number;
        let cropHeight: number;
        let cropX: number;
        let cropY: number;

        if (originalWidth > originalHeight) {
          // Landscape: crop left and right equally
          cropWidth = originalHeight;
          cropHeight = originalHeight;
          cropX = (originalWidth - originalHeight) / 2;
          cropY = 0;
        } else if (originalHeight > originalWidth) {
          // Portrait: crop top and bottom equally
          cropWidth = originalWidth;
          cropHeight = originalWidth;
          cropX = 0;
          cropY = (originalHeight - originalWidth) / 2;
        } else {
          // Already square
          cropWidth = originalWidth;
          cropHeight = originalHeight;
          cropX = 0;
          cropY = 0;
        }

        // Step 2: Calculate section dimensions
        // Total ratio: 1+5+1 = 7 for both dimensions
        const totalRatio = 7;
        const cornerRatio = 1;
        const edgeRatio = 5;

        const unitSize = cropWidth / totalRatio;
        const cornerSize = unitSize * cornerRatio;
        const edgeSize = unitSize * edgeRatio;

        // Helper function to extract a section
        const extractSection = (sx: number, sy: number, sw: number, sh: number): string => {
          const canvas = document.createElement('canvas');
          canvas.width = sw;
          canvas.height = sh;
          const ctx = canvas.getContext('2d')!;

          ctx.drawImage(
            img,
            cropX + sx, cropY + sy, sw, sh,  // Source rectangle (from cropped square)
            0, 0, sw, sh                      // Destination rectangle
          );

          return canvas.toDataURL('image/png');
        };

        // Step 3: Extract each section
        // Positions in the 9-grid:
        // (0,0)          | (cornerSize, 0)        | (cornerSize+edgeSize, 0)
        // (0, cornerSize)| (cornerSize, cornerSize)| (cornerSize+edgeSize, cornerSize)
        // (0, cornerSize+edgeSize) | (cornerSize, cornerSize+edgeSize) | ...

        const front = extractSection(
          cornerSize,
          cornerSize,
          edgeSize,
          edgeSize
        );

        const top = extractSection(
          cornerSize,
          0,
          edgeSize,
          cornerSize
        );

        const bottom = extractSection(
          cornerSize,
          cornerSize + edgeSize,
          edgeSize,
          cornerSize
        );

        const left = extractSection(
          0,
          cornerSize,
          cornerSize,
          edgeSize
        );

        const right = extractSection(
          cornerSize + edgeSize,
          cornerSize,
          cornerSize,
          edgeSize
        );

        resolve({
          front,
          top,
          bottom,
          left,
          right
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}
