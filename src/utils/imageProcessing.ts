/**
 * Utility functions for processing textures for the 3D calendar box
 */

export interface ProcessedBoxTextures {
  front: string; // Center 5:5 section as data URL
  top: string; // Top 5:1 section as data URL
  bottom: string; // Bottom 5:1 section as data URL
  left: string; // Left 1:5 section as data URL
  right: string; // Right 1:5 section as data URL
}

/**
 * Convert an image file to WebP format
 * @param file - The original image file
 * @param quality - WebP quality (0-1), defaults to 0.9
 * @returns A new File object in WebP format
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to convert image to WebP"));
              return;
            }

            // Create a new File from the blob
            const webpFileName = file.name.replace(/\.[^/.]+$/, ".webp");
            const webpFile = new File([blob], webpFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert multiple image files to WebP format
 * @param files - Array of image files to convert
 * @param quality - WebP quality (0-1), defaults to 0.9
 * @returns Promise that resolves to an array of WebP files
 */
export async function convertMultipleToWebP(
  files: File[],
  quality: number = 0.9
): Promise<File[]> {
  const promises = files.map((file) => convertToWebP(file, quality));
  return Promise.all(promises);
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
export async function processImageForBox(
  imageUrl: string
): Promise<ProcessedBoxTextures> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

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
        const extractSection = (
          sx: number,
          sy: number,
          sw: number,
          sh: number
        ): string => {
          const canvas = document.createElement("canvas");
          canvas.width = sw;
          canvas.height = sh;
          const ctx = canvas.getContext("2d")!;

          ctx.drawImage(
            img,
            cropX + sx,
            cropY + sy,
            sw,
            sh, // Source rectangle (from cropped square)
            0,
            0,
            sw,
            sh // Destination rectangle
          );

          return canvas.toDataURL("image/png");
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

        const top = extractSection(cornerSize, 0, edgeSize, cornerSize);

        const bottom = extractSection(
          cornerSize,
          cornerSize + edgeSize,
          edgeSize,
          cornerSize
        );

        const left = extractSection(0, cornerSize, cornerSize, edgeSize);

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
          right,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
}
