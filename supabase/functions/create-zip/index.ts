import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrls, styleName, labels } = await req.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(JSON.stringify({ error: "imageUrls required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const zip = new JSZip();

    // Download each image and add to ZIP
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      const label = labels?.[i] || `image_${i}`;

      let blob: Blob;

      // Check if it's a Supabase storage URL
      const storagePrefix = "/storage/v1/object/public/";
      const idx = url.indexOf(storagePrefix);

      if (idx !== -1) {
        const fullPath = url.substring(idx + storagePrefix.length);
        const slashIdx = fullPath.indexOf("/");
        const bucket = fullPath.substring(0, slashIdx);
        const filePath = fullPath.substring(slashIdx + 1);

        const { data, error } = await supabase.storage
          .from(bucket)
          .download(filePath);

        if (error || !data) {
          console.error(`Failed to download ${filePath}:`, error);
          continue;
        }
        blob = data;
      } else if (url.startsWith("data:")) {
        // Base64 data URL
        const res = await fetch(url);
        blob = await res.blob();
      } else {
        // External URL
        const res = await fetch(url);
        if (!res.ok) {
          console.error(`Failed to fetch ${url}: ${res.status}`);
          continue;
        }
        blob = await res.blob();
      }

      const ext = blob.type?.includes("png") ? "png" : "jpg";
      const safeName = (styleName || "hair_style").replace(/[^a-zA-Z0-9가-힣_-]/g, "_");
      const safeLabel = label.replace(/[^a-zA-Z0-9가-힣_-]/g, "_");
      zip.file(`${safeName}_${safeLabel}.${ext}`, await blob.arrayBuffer());
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
    const timestamp = Date.now();
    const zipFileName = `zips/${timestamp}_${Math.random().toString(36).slice(2, 7)}.zip`;

    const { error: uploadError } = await supabase.storage
      .from("hair-images")
      .upload(zipFileName, zipBuffer, {
        contentType: "application/zip",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("hair-images")
      .getPublicUrl(zipFileName);

    return new Response(
      JSON.stringify({ zipUrl: publicUrlData.publicUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("create-zip error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "ZIP 생성에 실패했습니다." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
