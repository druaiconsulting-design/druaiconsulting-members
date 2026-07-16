// api/travis-render.ts  —  MEMBERS REPO (druaiconsulting-members)
// Travis Wealthy — Executive Producer, Video Production
//
// The pipe: approved video_script card → HeyGen render → Bunny 677927 → preview
// card in the Intelligence Hub → DeAnna's existing Approve + Publish posts via Make.
//
// Runs every 5 min via pg_cron. Each run:
//   PHASE 1 — poll all `rendering` rows at HeyGen; completed ones bank to Bunny
//             and create the preview approval card (category 'social').
//   PHASE 2 — pick up newly approved `video_script` cards (any studio agent),
//             check the render spend cap, submit to HeyGen (max 2 per run).
//
// Creative range: `treatment` is free-form direction; `render_settings` (jsonb)
// carries per-video look/wardrobe/brand-kit background/orientation overrides.
// The pipe routes on engine only — it never has an opinion about the creative.
//
// ENV (members Vercel project):
//   HEYGEN_API_KEY          — HeyGen API wallet key                     [set ✅]
//   BUNNY_SOCIAL_API_KEY           — library 677927 API key (upload AccessKey)
//   BUNNY_SOCIAL_CDN_KEY           — 677927 CDN hostname, e.g. vz-xxxxxxxx-xxx.b-cdn.net
//   HEYGEN_AVATAR_ID        — default avatar/look id (per-card override supported)
//   HEYGEN_VOICE_ID         — default voice id       (per-card override supported)
//   HEYGEN_AVATAR_TYPE      — 'avatar' (video avatar) or 'talking_photo' (photo
//                             avatar — run-one testing vehicle). Default: 'avatar'
//   CRON_SECRET             — same value as app.cron_secret in Postgres
//   SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL — already present

import type { VercelRequest, VercelResponse } from "@vercel/node";
export const config = { maxDuration: 300 };

const BUNNY_SOCIAL_LIBRARY_ID = "677927";
const RENDER_COST_ESTIMATE = 3.0;   // ~45s at ~$4/min — mirrors CHAIN_COST_ESTIMATE pattern
const MAX_SUBMITS_PER_RUN = 2;      // batch guard; also respects HeyGen's 10-concurrent cap
const HEYGEN_BASE = "https://api.heygen.com";

// ── Supabase REST helpers (house pattern: raw fetch + service role) ─────────
function sb() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env not set");
  return { url, headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` } };
}
async function sbGet(path: string): Promise<any[]> {
  const { url, headers } = sb();
  const res = await fetch(`${url}/rest/v1/${path}`, { headers });
  if (!res.ok) { console.error(`[sb GET ${path}] ${res.status} ${await res.text()}`); return []; }
  return res.json();
}
async function sbPost(path: string, body: unknown, prefer = "return=representation"): Promise<any[] | null> {
  const { url, headers } = sb();
  const res = await fetch(`${url}/rest/v1/${path}`, { method: "POST", headers: { ...headers, Prefer: prefer }, body: JSON.stringify(body) });
  if (!res.ok) { console.error(`[sb POST ${path}] ${res.status} ${await res.text()}`); return null; }
  return prefer.includes("representation") ? res.json() : [];
}
async function sbPatch(path: string, body: unknown): Promise<boolean> {
  const { url, headers } = sb();
  const res = await fetch(`${url}/rest/v1/${path}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  if (!res.ok) console.error(`[sb PATCH ${path}] ${res.status} ${await res.text()}`);
  return res.ok;
}

// ── Render spend cap — mirrors daily_spend_cap pattern in twin-command.ts ───
async function checkAndReserveSpend(): Promise<{ ok: boolean; totalSpent?: number; cap?: number }> {
  const today = new Date().toISOString().slice(0, 10);
  await sbPost("render_spend_cap?on_conflict=spend_date", { spend_date: today }, "resolution=ignore-duplicates,return=minimal");
  const rows = await sbGet(`render_spend_cap?spend_date=eq.${today}&select=total_spent,cap_amount`);
  const row = rows[0] ?? { total_spent: 0, cap_amount: 5.0 };
  if (Number(row.total_spent) + RENDER_COST_ESTIMATE > Number(row.cap_amount)) {
    return { ok: false, totalSpent: Number(row.total_spent), cap: Number(row.cap_amount) };
  }
  await sbPatch(`render_spend_cap?spend_date=eq.${today}`, { total_spent: Number(row.total_spent) + RENDER_COST_ESTIMATE });
  return { ok: true };
}

// ── HeyGen ───────────────────────────────────────────────────────────────────
function heygenHeaders() {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error("HEYGEN_API_KEY not set");
  return { "Content-Type": "application/json", "X-Api-Key": key };
}

async function heygenSubmit(script: string, settings: Record<string, any>): Promise<{ videoId?: string; error?: string }> {
  const avatarId = settings.avatar_id || process.env.HEYGEN_AVATAR_ID;
  const voiceId = settings.voice_id || process.env.HEYGEN_VOICE_ID;
  const avatarType = settings.avatar_type || process.env.HEYGEN_AVATAR_TYPE || "avatar";
  if (!avatarId || !voiceId) return { error: "HEYGEN_AVATAR_ID / HEYGEN_VOICE_ID not set (env or render_settings)" };

  // Orientation: default 9:16 vertical (Reels/Shorts); render_settings can override
  const width = Number(settings.width) || 720;
  const height = Number(settings.height) || 1280;

  const character =
    avatarType === "talking_photo"
      ? { type: "talking_photo", talking_photo_id: avatarId }
      : { type: "avatar", avatar_id: avatarId, avatar_style: settings.avatar_style || "normal" };

  const videoInput: Record<string, any> = {
    character,
    voice: { type: "text", input_text: script, voice_id: voiceId, ...(settings.voice_speed ? { speed: Number(settings.voice_speed) } : {}) },
  };
  // Brand kit background: render_settings.background = { type:'color', value:'#0A2342' }
  // or { type:'image', url:'...' } — whatever the card specifies rides straight through.
  if (settings.background) videoInput.background = settings.background;

  const res = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
    method: "POST",
    headers: heygenHeaders(),
    body: JSON.stringify({ video_inputs: [videoInput], dimension: { width, height }, ...(settings.title ? { title: settings.title } : {}) }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.data?.video_id) return { error: `HeyGen submit ${res.status}: ${JSON.stringify(data).slice(0, 400)}` };
  return { videoId: data.data.video_id };
}

async function heygenStatus(videoId: string): Promise<{ status: string; videoUrl?: string; error?: string }> {
  const res = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`, { headers: heygenHeaders() });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) return { status: "error", error: `HeyGen status ${res.status}` };
  const s = data?.data?.status ?? "unknown";
  if (s === "completed") return { status: "completed", videoUrl: data.data.video_url };
  if (s === "failed") return { status: "failed", error: JSON.stringify(data?.data?.error ?? {}).slice(0, 400) };
  return { status: s }; // pending / processing / waiting
}

// ── Bunny: create video object in 677927, stream the MP4 in ─────────────────
async function bankToBunny(title: string, sourceUrl: string): Promise<{ bunnyVideoId?: string; playUrl?: string; error?: string }> {
  const apiKey = process.env.BUNNY_SOCIAL_API_KEY;
  const cdnKey = process.env.BUNNY_SOCIAL_CDN_KEY;
  if (!apiKey) return { error: "BUNNY_SOCIAL_API_KEY not set" };
  if (!cdnKey) return { error: "BUNNY_SOCIAL_CDN_KEY not set" };

  const createRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_SOCIAL_LIBRARY_ID}/videos`, {
    method: "POST",
    headers: { AccessKey: apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!createRes.ok) return { error: `Bunny create ${createRes.status}: ${(await createRes.text()).slice(0, 300)}` };
  const created: any = await createRes.json();
  const guid = created?.guid;
  if (!guid) return { error: "Bunny create returned no guid" };

  const source = await fetch(sourceUrl);
  if (!source.ok || !source.body) return { error: `Fetch render MP4 failed: ${source.status}` };

  const uploadRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_SOCIAL_LIBRARY_ID}/videos/${guid}`, {
    method: "PUT",
    headers: { AccessKey: apiKey },
    body: source.body as any,
    // Required in Node 18+ when streaming a request body
    // @ts-ignore
    duplex: "half",
  });
  if (!uploadRes.ok) return { error: `Bunny upload ${uploadRes.status}: ${(await uploadRes.text()).slice(0, 300)}` };

  const host = cdnKey.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return { bunnyVideoId: guid, playUrl: `https://${host}/${guid}/play_720p.mp4` };
}

// ── Preview card: the video comes back to DeAnna's Intelligence Hub ─────────
// Returns the new approval card UUID so we can store it as preview_approval_id,
// or null if the insert failed.
async function createPreviewCard(row: any, heygenUrl: string): Promise<string | null> {
  const caption = row.linkedin_content || row.script_text || "";
  const inserted = await sbPost("approvals", {
    agent_name: row.agent_name || "Travis Wealthy",
    category: "travis_video_production",
    platform: "LinkedIn",
    title: `🎬 VIDEO READY — ${row.title || "Untitled"}`,
    output: caption,
    task_brief: row.treatment || `Script: ${(row.script_text || "").slice(0, 200)}`,
    linkedin_content: row.linkedin_content || caption,
    facebook_content: row.facebook_content || "",
    instagram_caption: row.instagram_caption || "",
    video_url: heygenUrl,
    status: "pending",
    priority: "high",
  });
  return Array.isArray(inserted) && inserted.length > 0 ? inserted[0].id : null;
}

// ── Card parsing: captions + treatment + settings ride the script card ──────
// Studio agents may append a JSON block: { "treatment": "...", "render_settings": {...} }
function parseCreative(raw: string): { script: string; treatment: string | null; settings: Record<string, any> } {
  let script = raw ?? "";
  let treatment: string | null = null;
  let settings: Record<string, any> = {};
  const match = script.match(/\{[\s\S]*\}\s*$/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && (parsed.treatment || parsed.render_settings)) {
        treatment = typeof parsed.treatment === "string" ? parsed.treatment : null;
        if (parsed.render_settings && typeof parsed.render_settings === "object") settings = parsed.render_settings;
        script = script.slice(0, match.index).trim();
      }
    } catch { /* not a creative block — the whole text is the script */ }
  }
  return { script, treatment, settings };
}

// ── PHASE 1: complete in-flight renders ─────────────────────────────────────
// When HeyGen finishes: save the HeyGen URL, create a preview card in the Hub
// for DeAnna to watch and approve. Do NOT touch Bunny yet — that happens in
// Phase 3 after she approves.
async function pollRendering(): Promise<{ rendered: number; failed: number }> {
  const rendering = await sbGet(`travis_video_production?status=eq.rendering&order=created_at.asc&limit=10`);
  let rendered = 0, failed = 0;
  for (const row of rendering) {
    if (!row.heygen_video_id) continue;
    const st = await heygenStatus(row.heygen_video_id);
    if (st.status === "completed" && st.videoUrl) {
      // Step 1: save the HeyGen URL and mark as rendered (not banked yet)
      await sbPatch(`travis_video_production?id=eq.${row.id}`, {
        status: "rendered",
        heygen_video_url: st.videoUrl,
        rendered_at: new Date().toISOString(),
        error_detail: null,
      });
      // Step 2: create the preview card so DeAnna can watch it in the Hub
      const previewId = await createPreviewCard(row, st.videoUrl);
      // Step 3: link the preview card back to this row so Phase 3 can find it
      if (previewId) {
        await sbPatch(`travis_video_production?id=eq.${row.id}`, { preview_approval_id: previewId });
      }
      rendered++;
    } else if (st.status === "failed") {
      await sbPatch(`travis_video_production?id=eq.${row.id}`, { status: "failed", error_detail: st.error ?? "render failed" });
      failed++;
    }
    // pending/processing → leave as rendering; next run checks again
  }
  return { rendered, failed };
}

// ── PHASE 3: bank approved videos to Bunny + fire Make.com ──────────────────
// Runs after DeAnna approves a travis_video_production card in the Hub.
// Finds rendered rows whose preview card has been approved, uploads to Bunny,
// updates the approval card with the Bunny URL, then fires the social publisher.
async function bankApproved(): Promise<{ banked: number; errors: string[] }> {
  const errors: string[] = [];

  // Find rows waiting for approval (status=rendered, preview card linked)
  const pending = await sbGet(
    `travis_video_production?status=eq.rendered&preview_approval_id=not.is.null&order=created_at.asc&limit=5&select=id,title,heygen_video_url,preview_approval_id,linkedin_content,facebook_content,instagram_caption`
  );
  if (!pending.length) return { banked: 0, errors };

  let banked = 0;
  for (const row of pending) {
    if (!row.heygen_video_url || !row.preview_approval_id) continue;

    // Check if DeAnna has approved the preview card
    const cards = await sbGet(
      `approvals?id=eq.${row.preview_approval_id}&status=eq.approved&select=id,platform,linkedin_content,facebook_content,instagram_caption`
    );
    if (!cards.length) continue; // Not approved yet — skip, check again next run
    const card = cards[0];

    // Upload to Bunny now that she's approved
    const bank = await bankToBunny(row.title || `DRU video ${row.id.slice(0, 8)}`, row.heygen_video_url);
    if (!bank.playUrl) {
      await sbPatch(`travis_video_production?id=eq.${row.id}`, { error_detail: bank.error ?? "bank failed" });
      errors.push(`Bunny upload failed for ${row.id}: ${bank.error}`);
      continue;
    }

    // Update production row with final Bunny URL
    await sbPatch(`travis_video_production?id=eq.${row.id}`, {
      status: "banked",
      bunny_video_id: bank.bunnyVideoId,
      video_url: bank.playUrl,
    });

    // Update the approval card so it carries the Bunny URL (not the expired HeyGen URL)
    await sbPatch(`approvals?id=eq.${row.preview_approval_id}`, {
      video_url: bank.playUrl,
    });

    // Fire the social publisher — same endpoint the Hub uses
    // Travis calls the admin app directly (server-to-server, no CORS restriction)
    const content = card.linkedin_content || row.linkedin_content || "";
    try {
      const res = await fetch("https://app.druaiconsulting.com/api/social-publisher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platform: card.platform || "LinkedIn",
          approval_id: card.id,
          video_url: bank.playUrl,
        }),
      });
      if (!res.ok) errors.push(`social-publisher ${res.status} for ${card.id}`);
    } catch (e: any) {
      errors.push(`social-publisher threw for ${card.id}: ${e?.message}`);
    }

    // Record the post timestamp
    await sbPatch(`travis_video_production?id=eq.${row.id}`, { posted_at: new Date().toISOString() });
    banked++;
  }
  return { banked, errors };
}

// ── PHASE 2: submit newly approved scripts ───────────────────────────────────
async function submitApproved(): Promise<{ submitted: number; capped: boolean; errors: string[] }> {
  const errors: string[] = [];
  const cards = await sbGet(
    `approvals?status=eq.approved&category=eq.video_script&order=created_at.asc&limit=10&select=id,agent_name,title,output,edited_output,linkedin_content,facebook_content,instagram_caption`
  );
  if (!cards.length) return { submitted: 0, capped: false, errors };

  const existing = await sbGet(`travis_video_production?select=approval_id&approval_id=in.(${cards.map((c: any) => `"${c.id}"`).join(",")})`);
  const done = new Set(existing.map((r: any) => r.approval_id));
  const fresh = cards.filter((c: any) => !done.has(c.id)).slice(0, MAX_SUBMITS_PER_RUN);

  let submitted = 0, capped = false;
  for (const card of fresh) {
    const spend = await checkAndReserveSpend();
    if (!spend.ok) { capped = true; break; }

    const { script, treatment, settings } = parseCreative(card.edited_output || card.output || "");
    const title = card.title || script.split("\n")[0]?.slice(0, 80) || "DRU video";
    if (settings.title === undefined) settings.title = title;

    const rowArr = await sbPost("travis_video_production", {
      approval_id: card.id, agent_name: card.agent_name, title, script_text: script,
      treatment, render_settings: settings, engine: "heygen_avatar",
      linkedin_content: card.linkedin_content, facebook_content: card.facebook_content, instagram_caption: card.instagram_caption,
      status: "queued", estimated_cost: RENDER_COST_ESTIMATE,
    });
    const row = rowArr?.[0];
    if (!row) { errors.push(`insert failed for approval ${card.id}`); continue; }

    const sub = await heygenSubmit(script, settings);
    if (sub.videoId) {
      await sbPatch(`travis_video_production?id=eq.${row.id}`, { status: "rendering", heygen_video_id: sub.videoId });
      submitted++;
    } else {
      await sbPatch(`travis_video_production?id=eq.${row.id}`, { status: "failed", error_detail: sub.error ?? "submit failed" });
      errors.push(sub.error ?? "submit failed");
    }
  }
  return { submitted, capped, errors };
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cron auth — house pattern (raymond.ts / cmd-command-layer.ts)
  const incomingSecret = (req.headers["x-cron-secret"] as string | undefined) ?? undefined;
  if (incomingSecret !== undefined && incomingSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const phase1 = await pollRendering();   // HeyGen done → preview card in Hub
    const phase3 = await bankApproved();    // Approved preview cards → Bunny → Make.com
    const phase2 = await submitApproved();  // New approved scripts → HeyGen submit
    return res.status(200).json({
      ok: true,
      previews_created: phase1.rendered, render_failed: phase1.failed,
      banked: phase3.banked,
      submitted: phase2.submitted, cap_reached: phase2.capped,
      errors: [...phase3.errors, ...phase2.errors].length ? [...phase3.errors, ...phase2.errors] : undefined,
    });
  } catch (e: any) {
    console.error("[travis-render]", e);
    return res.status(500).json({ error: e?.message ?? "pipeline error" });
  }
}
