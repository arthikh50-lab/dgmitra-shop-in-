import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function resizeBase64(base64: string, maxWidth = 800, maxHeight = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = base64;
  });
}

export async function detectFabricAndSuggestDesign(imageBuffer: string) {
  try {
    const resizedImage = await resizeBase64(imageBuffer, 600, 600);
    const model = "gemini-3-flash-preview";
    const prompt = `
      Analyze this uploaded logo/design and provide:
      1. Recommended Fabric (e.g., Heavy Cotton, Denim, Canvas)
      2. Recommended Garment (e.g., Oversized Hoodie, Vintage Jacket, Streetwear Tee)
      3. Three creative suggestions for placing this exact design on clothing using:
         - Embroidery
         - Hand Painting
         - DTF Printing
      
      For each suggestion, include:
      - Specific Color Palette (hex codes or descriptive names)
      - Material Texture details (e.g., 3D puff embroidery, distressed matte paint, glossy vinyl)
      - Placement Technique (e.g., Left chest, oversized back print, sleeve wrap)

      Format the response as JSON:
      {
        "fabric": "string",
        "condition": "string",
        "suggestions": [
          { 
            "type": "Embroidery", 
            "description": "string",
            "colorPalette": ["string"],
            "textureDetails": "string",
            "placementTechnique": "string"
          },
          { 
            "type": "Painting", 
            "description": "string",
            "colorPalette": ["string"],
            "textureDetails": "string",
            "placementTechnique": "string"
          },
          { 
            "type": "Printing", 
            "description": "string",
            "colorPalette": ["string"],
            "textureDetails": "string",
            "placementTechnique": "string"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: resizedImage.split(",")[1],
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

export async function createBaseLayer(imageBuffer: string) {
  try {
    const resizedImage = await resizeBase64(imageBuffer, 1024, 1024);
    const model = "gemini-2.5-flash-image";
    const prompt = "Analyze this input image. Identify the clothing item (e.g., shirt, jeans, dress) as the main subject. Segment and completely remove the entire background, leaving only the clothing item visible on a pure white background. Output the high-resolution, processed image of just the clothing item. This will be the base layer for further design overlays.";

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: resizedImage.split(",")[1],
              },
            },
          ],
        },
      ],
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Base Layer Error:", error);
    return null;
  }
}

export async function generateDesignPreview(baseClothBuffer: string, designBuffer: string, description: string, isGalleryDesign = false) {
  try {
    const resizedBase = await resizeBase64(baseClothBuffer, 1024, 1024);
    const resizedDesign = await resizeBase64(designBuffer, 800, 800);

    const prompt = isGalleryDesign 
      ? `The user has uploaded a personal garment (Image 1) and manually selected a specific design from our Design Gallery (Image 2).
         
         Your Task:
         1. Do not generate a new design.
         2. Digitally superimpose the selected Gallery Design from Image 2 onto the user’s uploaded garment in Image 1.
         3. Adjust the design's perspective, lighting, and texture so it looks realistically applied (e.g., following fabric folds or wrinkles).
         4. Ensure the final result is a hyper-realistic, ultra-high definition image with extreme sharp focus, crystal clear details, and no blur.
         5. Provide a technical note on the application method (e.g., 'Applying this via High-Density Embroidery on the cotton fabric').
         
         Context: ${description}`
      : `Image 1 is the base cloth layer. Image 2 is the user's uploaded design. Analyze the structure, folds, shadows, and fabric type of the base cloth in Image 1.
    
    Your task is to realistically overlay the design from Image 2 onto the center chest area of the base cloth from Image 1.
    
    Crucial Requirements:
    - DO NOT CREATE a new person or mannequin wearing the cloth. Keep it as the flat-lay/standalone image.
    - The design MUST follow the natural contours, wrinkles, and three-dimensional form of the fabric folds in Image 1.
    - Maintain realistic lighting and shadows of the original cloth over the applied design.
    - Render the final output as if the design is naturally printed or embroidered onto the fabric, not just pasted. 
    - The final result MUST be a hyper-realistic, ultra-high definition image, extreme sharp focus, crystal clear details, no blur, cinematic lighting, professional photography.
    - Provide a short technical note on how this design would be applied to this specific fabric.
    - Additional Context: ${description}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: resizedBase.split(",")[1],
            },
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: resizedDesign.split(",")[1],
            },
          },
          { text: prompt }
        ]
      }
    });

    let imageUrl = '';
    let technicalNote = '';

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        technicalNote = part.text;
      }
    }

    return { imageUrl, technicalNote };
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
}

export async function generateDesignFromPrompt(prompt: string, style: string = 'Digital Art') {
  try {
    const model = "gemini-2.5-flash-image";
    
    let stylePrompt = "";
    if (style === 'Realistic Photo') {
      stylePrompt = `A hyper-realistic, ultra-high definition ${prompt}, extreme sharp focus, crystal clear details, no blur, shot on 35mm lens, f/8, 8k resolution, cinematic lighting, professional photography.`;
    } else if (style === 'Portrait') {
      stylePrompt = `A crisp, high-detail portrait of ${prompt}, sharp focus on the eyes, visible skin texture, studio lighting, ultra-realistic, photorealistic, 4k UHD, perfectly clear, no motion blur.`;
    } else {
      // Default to Digital Art
      stylePrompt = `A highly detailed digital masterpiece of ${prompt}, sharp edges, vibrant colors, high contrast, 4k resolution, octane render, intricate details, crisp lines, trending on ArtStation.`;
    }

    const fullPrompt = `${stylePrompt} 
    The design should be suitable for printing on clothing (T-shirts, hoodies, jackets). 
    It should be a standalone graphic with a clean aesthetic. 
    Avoid any backgrounds; focus on the central design element. 
    The output should be a single, crystal clear image with extreme sharp focus and no blur.`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: fullPrompt }
          ],
        },
      ],
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Design Generation Error:", error);
    return null;
  }
}
