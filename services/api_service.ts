import { GoogleGenAI, Modality } from "@google/genai";

// Use the provided key as fallback if environment variable is missing
const API_KEY = process.env.API_KEY || "AIzaSyAAIsGTN65RMS4j0S-gXzDrJClIVJb1jnw";

if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
  console.warn("Warning: API Key is missing or invalid.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

type StatusCallback = (message: string) => void;

// Helper function to convert a File, Blob, or Data URL to a Gemini-compatible Part
const toGeminiPart = (fileOrDataUrl: File | Blob | string): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
        const handleResult = (result: string | ArrayBuffer | null) => {
            if (typeof result === 'string') {
                const parts = result.split(',');
                const mimeType = parts[0].match(/:(.*?);/)?.[1];
                if (!mimeType || !parts[1]) {
                    reject(new Error('Failed to parse file data URL.'));
                    return;
                }
                resolve({
                    inlineData: {
                        data: parts[1],
                        mimeType: mimeType,
                    },
                });
            } else {
                reject(new Error('Failed to read file as data URL.'));
            }
        };

        if (typeof fileOrDataUrl === 'string') {
            // Handle Data URL directly
            handleResult(fileOrDataUrl);
        } else {
            // Handle File/Blob object
            const reader = new FileReader();
            reader.readAsDataURL(fileOrDataUrl);
            reader.onload = () => handleResult(reader.result);
            reader.onerror = (error) => reject(error);
        }
    });
};

/**
 * Removes background using Gemini 2.5 Flash Image.
 * Returns a Base64 Data URL string.
 */
export const removeBackground = async (
  file: File | Blob, 
  onStatus?: StatusCallback
): Promise<string> => {
  if (onStatus) onStatus("جاري إزالة الخلفية باستخدام Gemini AI...");

  try {
    const imagePart = await toGeminiPart(file);

    const textPart = {
      text: 'Remove the background of this image. Make the background transparent. Keep the main subject sharp and clear.',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        // Ensure the mime type is image/png for transparency
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }

    throw new Error('No image data found in the AI response.');
  } catch (error: any) {
    console.error('Error removing background with Gemini API:', error);
    if (error.message && error.message.includes('API key not valid')) {
        throw new Error('The Gemini API key is invalid or missing.');
    }
    throw new Error('Failed to remove background via API.');
  }
};

/**
 * Adds a formal suit to the person in the image using Gemini 2.5 Flash Image.
 * Returns a Base64 Data URL string.
 */
export const addFormalSuit = async (
  imageDataUrl: string,
  onStatus?: StatusCallback
): Promise<string> => {
    if (onStatus) onStatus("جاري إضافة البدلة الرسمية باستخدام Gemini AI...");

    try {
        const imagePart = await toGeminiPart(imageDataUrl);

        const textPart = {
            text: "Take the person in this image, which has a transparent background, and realistically dress them in a formal dark business suit with a white collared shirt and a simple, professional tie. Preserve the person's head, face, and neck exactly as they are. Ensure the added clothing looks natural and fits the person's posture. Most importantly, maintain the transparent background of the original image.",
        };
    
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [imagePart, textPart],
          },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });
    
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
          }
        }
    
        throw new Error('No image data found in the AI response for adding a suit.');
      } catch (error: any) {
        console.error('Error adding suit with Gemini API:', error);
        throw new Error('Failed to add formal suit. Please check API Key.');
      }
};

/**
 * Adds a Hijab (Islamic Headscarf) to the person in the image.
 */
export const addHijab = async (
  imageDataUrl: string,
  onStatus?: StatusCallback
): Promise<string> => {
    if (onStatus) onStatus("جاري إضافة الحجاب الإسلامي باستخدام Gemini AI...");

    try {
        const imagePart = await toGeminiPart(imageDataUrl);

        const textPart = {
            text: "Take the person in this image, which has a transparent background, and realistically dress them in a modest, elegant Hijab (Islamic headscarf) that covers the hair and neck completely. Ensure the face remains fully visible, clear, and natural. The Hijab should be simple, professional, and well-fitted, perhaps in a neutral color like white, grey, or black. Maintain the person's posture and facial features exactly. Most importantly, maintain the transparent background of the original image.",
        };
    
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [imagePart, textPart],
          },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });
    
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
          }
        }
    
        throw new Error('No image data found in the AI response for adding a hijab.');
      } catch (error: any) {
        console.error('Error adding hijab with Gemini API:', error);
        throw new Error('Failed to add hijab. Please check API Key.');
      }
};

/**
 * Nano Banana Integration (Gemini 2.5 Flash Image)
 * Handles generic prompts.
 */
export const processWithNanoBanana = async (
  prompt: string,
  currentImageBase64?: string,
  onStatus?: StatusCallback
): Promise<string> => {
  if (onStatus) onStatus("جاري الاتصال بـ Nano Banana (Gemini)...");

  const parts: any[] = [];

  // If an image exists, include it
  if (currentImageBase64) {
    const imagePart = await toGeminiPart(currentImageBase64);
    parts.push(imagePart);
  }

  // Add the text prompt
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: parts
    },
    config: {
        responseModalities: [Modality.IMAGE]
    }
  });

  if (onStatus) onStatus("جاري معالجة الصورة الناتجة...");

  if (response.candidates && response.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64String = part.inlineData.data;
        return `data:image/png;base64,${base64String}`;
      }
    }
  }

  throw new Error("لم يرجع النموذج صورة. يرجى المحاولة مرة أخرى بوصف مختلف.");
};

export const enhancePhoto = async (
  imageBlob: Blob, 
  onStatus?: StatusCallback
): Promise<Blob> => {
  throw new Error("خدمة تحسين الصورة غير متوفرة حالياً.");
};