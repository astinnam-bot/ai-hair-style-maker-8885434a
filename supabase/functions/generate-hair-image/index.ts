// Hair image generation using Midjourney via CometAPI (mj-fast-imagine)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSeasonalClothing(isMale: boolean): string {
  const month = new Date().getMonth() + 1;
  if (isMale) {
    if (month >= 3 && month <= 5) return pickRandom(["light linen shirt", "thin cotton sweater over a collared shirt", "casual spring jacket with a t-shirt", "knit polo shirt", "denim jacket over a henley"]);
    if (month >= 6 && month <= 8) return pickRandom(["crisp white short-sleeve shirt", "breathable linen camp collar shirt", "casual cotton polo", "lightweight henley t-shirt", "relaxed fit crew neck tee"]);
    if (month >= 9 && month <= 11) return pickRandom(["wool crew-neck sweater", "layered flannel shirt", "corduroy jacket over a turtleneck", "knit cardigan over a shirt", "suede bomber jacket with a t-shirt"]);
    return pickRandom(["chunky knit turtleneck sweater", "wool overcoat over a button-up shirt", "cashmere crew-neck sweater", "padded vest over a hoodie", "heavy knit cable sweater"]);
  } else {
    if (month >= 3 && month <= 5) return pickRandom(["tailored cropped blazer over a silk camisole", "light cardigan over a camisole", "minimal knit top with clean lines", "denim jacket over a fitted turtleneck", "structured linen blouse"]);
    if (month >= 6 && month <= 8) return pickRandom(["off-shoulder blouse", "sleek satin camisole top", "minimal ribbed knit top", "sleeveless mock-neck top", "elegant linen wrap top"]);
    if (month >= 9 && month <= 11) return pickRandom(["cozy knit sweater", "trench coat over a blouse", "turtleneck with a blazer", "chunky cardigan", "suede jacket over a fitted top"]);
    return pickRandom(["cashmere turtleneck", "wool coat over a knit dress", "faux fur collar coat over a blouse", "thick cable-knit sweater", "padded jacket with a scarf"]);
  }
}

const modelTraits = {
  male: {
    ages: ["early 20s", "mid 20s", "late 20s"],
    faces: ["round face shape", "oval face shape", "square jawline", "angular face with high cheekbones", "soft diamond-shaped face"],
    skins: ["fair skin", "light tan skin", "warm medium skin tone", "slightly tanned skin"],
    builds: ["slim build", "average build", "athletic muscular build", "broad-shouldered build"],
    vibes: ["calm relaxed expression", "confident sharp gaze", "friendly warm smile", "serious editorial expression", "playful youthful look"],
  },
  female: {
    ages: ["early 20s", "mid 20s", "late 20s"],
    faces: ["round soft face", "oval face shape", "heart-shaped face", "V-line jawline", "small delicate face with high cheekbones"],
    skins: ["porcelain fair skin", "light natural skin", "warm honey skin tone", "slightly tanned glowing skin"],
    builds: ["slim petite build", "average build", "tall slender build"],
    vibes: ["elegant poised expression", "cute bright smile", "chic cool gaze", "natural effortless look", "dreamy soft expression"],
  },
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cleanBasePrompt(prompt: string): string {
  return prompt
    .replace(/studio lighting/gi, "natural warm lighting")
    .replace(/bright sheer curtain background/gi, "")
    .replace(/clean background/gi, "");
}

function buildVarietyPrompt(basePrompt: string, bgPrompt?: string, angleDesc?: string): string {
  const backgroundDesc = bgPrompt || "cozy stylish cafe atmosphere with warm ambient lighting";
  const cleaned = cleanBasePrompt(basePrompt);
  const lowerPrompt = cleaned.toLowerCase();
  const isFemale = lowerPrompt.includes("female") || lowerPrompt.includes("woman") || lowerPrompt.includes("여성");
  const isMale = !isFemale;
  const traits = isMale ? modelTraits.male : modelTraits.female;
  const age = pickRandom(traits.ages);
  const face = pickRandom(traits.faces);
  const skin = pickRandom(traits.skins);
  const build = pickRandom(traits.builds);
  const vibe = pickRandom(traits.vibes);
  const clothing = getSeasonalClothing(isMale);

  const isWestern = lowerPrompt.includes("western") || lowerPrompt.includes("caucasian") || lowerPrompt.includes("foreign");
  const ethnicityDesc = isWestern ? "Western Caucasian" : "Korean";

  const angleInstruction = angleDesc || "front view upper body shot from waist up";

  return `${cleaned}. Ultra sharp focus, high resolution 4K, square 1:1 aspect ratio, detailed skin texture, professional DSLR quality. The model is a ${ethnicityDesc} ${isMale ? "man" : "woman"} in their ${age}, with a ${face}, ${skin}, ${build}, and a ${vibe}. The person MUST be wearing a ${clothing}. NEVER generate a bare-shouldered or unclothed model. The background should be ${backgroundDesc}. FRAMING: ${angleInstruction}, showing the full torso including shoulders, chest, and waist. The hairstyle must be clearly visible and the focal point. The pose should be natural and candid like an SNS Instagram photo. The outfit should be trendy and fashionable. --ar 1:1 --s 750 --q 2`;
}

async function downloadAndUpload(supabase: any, imageUrl: string, timestamp: number, index: number): Promise<string> {
  try {
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) return imageUrl;
    const imgBuf = await imgResp.arrayBuffer();
    const contentType = imgResp.headers.get("content-type") || "image/png";
    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    const filePath = `generated/${timestamp}_${index}.${ext}`;
    const { error } = await supabase.storage.from("hair-images").upload(filePath, new Uint8Array(imgBuf), {
      contentType,
      upsert: true,
    });
    if (!error) {
      const { data: urlData } = supabase.storage.from("hair-images").getPublicUrl(filePath);
      return urlData.publicUrl;
    }
  } catch (e) {
    console.error("Upload failed:", e);
  }
  return imageUrl;
}

// Poll for Midjourney task result
async function pollTaskResult(taskId: string, apiKey: string, maxWaitMs = 120000): Promise<string | null> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const resp = await fetch(`https://api.cometapi.com/v1/responses/${taskId}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) {
        console.error("Poll error:", resp.status, await resp.text());
        await new Promise(r => setTimeout(r, pollInterval));
        continue;
      }

      const data = await resp.json();
      console.log("Poll response status:", data.status);

      // Check various possible response structures
      if (data.status === "completed" || data.status === "succeeded") {
        // Try to extract image URL from response
        if (data.output?.image_url) return data.output.image_url;
        if (data.output?.url) return data.output.url;
        if (data.result?.image_url) return data.result.image_url;
        if (data.result?.url) return data.result.url;
        if (data.image_url) return data.image_url;
        if (data.url) return data.url;
        // Check for array of outputs
        if (Array.isArray(data.output)) {
          const first = data.output[0];
          if (typeof first === "string") return first;
          if (first?.url) return first.url;
          if (first?.image_url) return first.image_url;
        }
        // Check data field
        if (data.data?.image_url) return data.data.image_url;
        if (data.data?.url) return data.data.url;
        if (Array.isArray(data.data)) {
          const first = data.data[0];
          if (typeof first === "string") return first;
          if (first?.url) return first.url;
        }
        console.log("Completed but no image found:", JSON.stringify(data).slice(0, 500));
        return null;
      }

      if (data.status === "failed" || data.status === "error") {
        console.error("Task failed:", JSON.stringify(data).slice(0, 500));
        return null;
      }

      // Still processing, wait and poll again
      await new Promise(r => setTimeout(r, pollInterval));
    } catch (e) {
      console.error("Poll fetch error:", e);
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }

  console.error("Task timed out after", maxWaitMs, "ms");
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, count = 1, copyrightText, backgroundPrompt } = await req.json();

    const COMET_API_KEY = Deno.env.get("COMET_API_KEY");
    if (!COMET_API_KEY) throw new Error("COMET_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const images: string[] = [];
    const timestamp = Date.now();

    const angleDescriptions = [
      "front view upper body shot from waist up, showing full torso and hairstyle clearly",
      "45 degree angle side view upper body shot from waist up, showing the hairstyle from an angle",
      "complete side profile upper body shot from waist up, showing the hairstyle silhouette",
      "back view upper body shot from waist up, showing full hairstyle from behind",
    ];

    const copyrightSuffix = copyrightText ? ` --no-text "${copyrightText}"` : '';

    for (let i = 0; i < Math.min(count, 4); i++) {
      const angleDesc = angleDescriptions[i];
      const fullPrompt = buildVarietyPrompt(prompt, backgroundPrompt, angleDesc) + copyrightSuffix;

      console.log(`Generating image ${i + 1} with Midjourney...`);

      let imageUrl: string | null = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Submit task to Midjourney via CometAPI
          const response = await fetch("https://api.cometapi.com/v1/responses", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${COMET_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "mj-fast-imagine",
              input: fullPrompt,
            }),
          });

          if (!response.ok) {
            const status = response.status;
            const body = await response.text();
            console.error(`Midjourney API error (attempt ${attempt + 1}):`, status, body);
            if (status === 429) {
              return new Response(JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }), {
                status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            if (attempt < maxRetries - 1) continue;
            break;
          }

          const data = await response.json();
          console.log("Midjourney submit response:", JSON.stringify(data).slice(0, 500));

          // Check if response contains image directly
          if (data.output?.image_url) {
            imageUrl = data.output.image_url;
            break;
          }
          if (data.output?.url) {
            imageUrl = data.output.url;
            break;
          }
          if (data.image_url) {
            imageUrl = data.image_url;
            break;
          }

          // If it's an async task, poll for result
          const taskId = data.id || data.task_id || data.response_id;
          if (taskId) {
            console.log("Polling task:", taskId);
            imageUrl = await pollTaskResult(taskId, COMET_API_KEY);
            if (imageUrl) break;
          }

          // Check for direct data array
          if (Array.isArray(data.data)) {
            const first = data.data[0];
            if (typeof first === "string" && first.startsWith("http")) {
              imageUrl = first;
              break;
            }
            if (first?.url) {
              imageUrl = first.url;
              break;
            }
          }

          console.error(`No image from response (attempt ${attempt + 1}):`, JSON.stringify(data).slice(0, 500));
        } catch (fetchErr) {
          console.error(`Fetch error (attempt ${attempt + 1}):`, fetchErr);
          if (attempt >= maxRetries - 1) break;
        }
      }

      if (imageUrl) {
        try {
          const finalUrl = await downloadAndUpload(supabase, imageUrl, timestamp, i);
          images.push(finalUrl);
        } catch (uploadErr) {
          console.error("Storage upload failed:", uploadErr);
          images.push(imageUrl);
        }
      } else {
        console.error("Failed to get image for angle", i);
      }
    }

    if (images.length === 0) {
      return new Response(JSON.stringify({ error: "이미지를 생성할 수 없습니다." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ images }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-hair-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
