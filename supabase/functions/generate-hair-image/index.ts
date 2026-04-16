// Hair image generation using CometAPI Midjourney API (/mj/submit/imagine + polling)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MJ_BASE = "https://api.cometapi.com";

function getSeasonalClothing(isMale: boolean): string {
  const month = new Date().getMonth() + 1;
  if (isMale) {
    if (month >= 3 && month <= 5) return pickRandom(["light linen shirt", "thin cotton sweater over a collared shirt", "casual spring jacket with a t-shirt", "knit polo shirt", "denim jacket over a henley"]);
    if (month >= 6 && month <= 8) return pickRandom(["crisp white short-sleeve shirt", "breathable linen camp collar shirt", "casual cotton polo", "lightweight henley t-shirt", "relaxed fit crew neck tee"]);
    if (month >= 9 && month <= 11) return pickRandom(["wool crew-neck sweater", "layered flannel shirt", "corduroy jacket over a turtleneck", "knit cardigan over a shirt", "suede bomber jacket with a t-shirt"]);
    return pickRandom(["chunky knit turtleneck sweater", "wool overcoat over a button-up shirt", "cashmere crew-neck sweater", "padded vest over a hoodie", "heavy knit cable sweater"]);
  }
  if (month >= 3 && month <= 5) return pickRandom(["tailored cropped blazer over a silk camisole", "light cardigan over a camisole", "minimal knit top with clean lines", "denim jacket over a fitted turtleneck", "structured linen blouse"]);
  if (month >= 6 && month <= 8) return pickRandom(["off-shoulder blouse", "sleek satin camisole top", "minimal ribbed knit top", "sleeveless mock-neck top", "elegant linen wrap top"]);
  if (month >= 9 && month <= 11) return pickRandom(["cozy knit sweater", "trench coat over a blouse", "turtleneck with a blazer", "chunky cardigan", "suede jacket over a fitted top"]);
  return pickRandom(["cashmere turtleneck", "wool coat over a knit dress", "faux fur collar coat over a blouse", "thick cable-knit sweater", "padded jacket with a scarf"]);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildMjPrompt(basePrompt: string, bgPrompt?: string): string {
  const backgroundDesc = bgPrompt || "cozy stylish cafe atmosphere with warm ambient lighting";
  const lowerPrompt = basePrompt.toLowerCase();
  const isFemale = lowerPrompt.includes("female") || lowerPrompt.includes("woman") || lowerPrompt.includes("여성");
  const isMale = !isFemale;

  const traits = isMale
    ? { ages: ["early 20s", "mid 20s", "late 20s"], faces: ["round face", "oval face", "square jawline", "angular face"], skins: ["fair skin", "light tan skin", "warm medium skin"], builds: ["slim build", "average build", "athletic build"], vibes: ["calm relaxed", "confident gaze", "friendly smile", "serious editorial"] }
    : { ages: ["early 20s", "mid 20s", "late 20s"], faces: ["round soft face", "oval face", "heart-shaped face", "V-line jaw"], skins: ["porcelain fair skin", "light natural skin", "warm honey skin"], builds: ["slim petite build", "average build", "tall slender build"], vibes: ["elegant poised", "cute bright smile", "chic cool gaze", "natural effortless"] };

  const age = pickRandom(traits.ages);
  const face = pickRandom(traits.faces);
  const skin = pickRandom(traits.skins);
  const build = pickRandom(traits.builds);
  const vibe = pickRandom(traits.vibes);
  const clothing = getSeasonalClothing(isMale);
  const isWestern = lowerPrompt.includes("western") || lowerPrompt.includes("caucasian") || lowerPrompt.includes("foreign");
  const ethnicityDesc = isWestern ? "Western Caucasian" : "Korean";

  return `${basePrompt}, photorealistic portrait of a ${ethnicityDesc} ${isMale ? "man" : "woman"} in their ${age}, ${face}, ${skin}, ${build}, ${vibe} expression, wearing ${clothing}, ${backgroundDesc} background, upper body shot from waist up, professional DSLR quality, ultra sharp focus, detailed skin texture, natural candid Instagram SNS pose, hairstyle is the focal point, no hands near head or hair --ar 4:5 --v 6.1 --style raw --q 2`;
}

// Poll MJ task until SUCCESS or failure
async function pollTask(taskId: string, apiKey: string, maxWaitMs = 120000): Promise<{ imageUrl: string; buttons: any[] }> {
  const startTime = Date.now();
  const pollInterval = 3000; // 3 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const resp = await fetch(`${MJ_BASE}/mj/task/${taskId}/fetch`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error(`Poll error [${resp.status}]:`, body);
      throw new Error(`폴링 실패: ${resp.status}`);
    }

    const task = await resp.json();
    console.log(`Task ${taskId} status: ${task.status}, progress: ${task.progress || "N/A"}`);

    if (task.status === "SUCCESS") {
      return { imageUrl: task.imageUrl, buttons: task.buttons || [] };
    }
    if (task.status === "FAILURE" || task.status === "CANCEL") {
      throw new Error(task.failReason || "이미지 생성에 실패했어요.");
    }

    // Wait before next poll
    await new Promise((r) => setTimeout(r, pollInterval));
  }

  throw new Error("이미지 생성 시간이 초과되었어요. 다시 시도해 주세요.");
}

// Download image from URL and upload to Supabase Storage
async function downloadAndUpload(supabase: any, imageUrl: string, timestamp: number, index: number): Promise<string> {
  try {
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) throw new Error(`Image download failed: ${imgResp.status}`);
    const imgBuffer = new Uint8Array(await imgResp.arrayBuffer());
    const contentType = imgResp.headers.get("content-type") || "image/png";
    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    const filePath = `generated/${timestamp}_${index}.${ext}`;

    const { error } = await supabase.storage.from("hair-images").upload(filePath, imgBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.error("Storage upload error:", error);
      return imageUrl; // fallback to original URL
    }

    const { data: urlData } = supabase.storage.from("hair-images").getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (e) {
    console.error("downloadAndUpload error:", e);
    return imageUrl;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, count = 1, referenceImage, copyrightText, backgroundPrompt } = await req.json();

    const COMET_API_KEY = Deno.env.get("COMET_API_KEY");
    if (!COMET_API_KEY) throw new Error("COMET_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const images: string[] = [];
    const timestamp = Date.now();
    const mjPrompt = buildMjPrompt(prompt, backgroundPrompt);

    console.log("MJ Prompt:", mjPrompt.slice(0, 200));

    // Step 1: Submit imagine task
    const submitBody: any = { prompt: mjPrompt };

    // If reference image provided, use it as base64 array
    if (referenceImage) {
      submitBody.base64Array = [];
      if (referenceImage.startsWith("data:image")) {
        submitBody.base64Array.push(referenceImage);
      } else if (referenceImage.startsWith("http")) {
        // MJ API can accept base64 — fetch and convert
        try {
          const imgResp = await fetch(referenceImage);
          const imgBuf = await imgResp.arrayBuffer();
          const imgBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)));
          const contentType = imgResp.headers.get("content-type") || "image/png";
          submitBody.base64Array.push(`data:${contentType};base64,${imgBase64}`);
        } catch (e) {
          console.error("Failed to fetch reference image:", e);
        }
      }
    }

    const submitResp = await fetch(`${MJ_BASE}/mj/submit/imagine`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COMET_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitBody),
    });

    if (!submitResp.ok) {
      const errBody = await submitResp.text();
      console.error(`MJ submit error [${submitResp.status}]:`, errBody);
      if (submitResp.status === 429) {
        return new Response(JSON.stringify({ error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "이미지 생성 요청에 실패했어요." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const submitData = await submitResp.json();
    console.log("Submit response:", JSON.stringify(submitData));

    if (!submitData.result) {
      return new Response(JSON.stringify({ error: submitData.description || "이미지 생성 요청에 실패했어요." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const taskId = submitData.result;

    // Step 2: Poll until SUCCESS
    const taskResult = await pollTask(taskId, COMET_API_KEY);
    console.log("Task completed, imageUrl:", taskResult.imageUrl?.slice(0, 100));

    // Step 3: Download and upload to storage
    if (taskResult.imageUrl) {
      const finalUrl = await downloadAndUpload(supabase, taskResult.imageUrl, timestamp, 0);
      images.push(finalUrl);
    }

    if (images.length === 0) {
      return new Response(JSON.stringify({ error: "이미지를 생성할 수 없어요." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ images, taskId, buttons: taskResult.buttons }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-hair-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
