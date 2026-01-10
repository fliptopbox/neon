import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../db";
import { query, queryOne } from "../db";
import { hashPassword } from "../utils/security";
import type { User } from "../db/types";

const app = new Hono<{ Bindings: Env }>();

// Basic schema for registration, can be expanded
const modelRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullname: z.string().min(1),
  handle: z.string().min(1),
  // Add other fields from the form as needed
});


// ... imports


app.post("/model", async (c) => {
  let newUserId: number | null = null;
  try {
    const body = await c.req.json();
    const data = body; // For now, trust the client's data

    // --- 1. Create User ---
    const hashedPassword = await hashPassword({ email: data.email, password: data.password });
    const [newUser] = await query<User>(
      c.env,
      `INSERT INTO users (email, password_hash, is_global_active, is_admin, date_created) 
       VALUES ($1, $2, true, false, NOW()) 
       RETURNING id`,
      [data.email, hashedPassword]
    );

    if (!newUser || !newUser.id) {
      throw new Error("Failed to create user.");
    }
    newUserId = newUser.id;

    // --- 2. Create User Profile ---
    await query(
      c.env,
      `INSERT INTO user_profiles (user_id, fullname, handle, phone_number, description, avatar_url, currency_code, flag_emoji, payment_methods, is_profile_active, date_created) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, true, NOW())`,
      [
        newUserId,
        data.fullname,
        data.handle,
        data.phone_number || '',
        data.description || '',
        data.avatar_url || '',
        data.currency_code || 'GBP',
        data.flag_emoji || '🏳️',
        JSON.stringify(data.payment_methods || {})
      ]
    );
    
    // --- 3. Create Model ---
    // Note: Inserting initial empty portrait_urls, will update after upload
    await query(
      c.env,
      `INSERT INTO models (
        user_id, display_name, description,
        rate_min_hour, rate_min_day, tz,
        work_inperson, work_online, work_photography,
        work_seeks, social_handles, website_urls,
        date_birthday, date_experience, sex, pronouns, date_created, portrait_urls
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13, $14, $15, $16, NOW(), '[]')`,
      [
        newUserId,
        data.display_name || data.fullname,
        data.description || '',
        data.rate_min_hour || 20.0,
        data.rate_min_day || 120.0,
        data.tz || 'Europe/London',
        data.work_preferences?.work_inperson ?? true,
        data.work_preferences?.work_online ?? false,
        data.work_preferences?.work_photography ?? false,
        JSON.stringify(data.work_seeks || []),
        JSON.stringify(data.social_handles || {}),
        JSON.stringify(data.website_urls || []),
        data.date_birthday || null,
        data.date_experience || null,
        data.sex || 'unspecified',
        data.pronouns || ''
      ]
    );

    // --- 4. Image Upload to ImageKit Direct API ---
    if (data.portrait_urls && Array.isArray(data.portrait_urls) && data.portrait_urls.length > 0) {
        
        // Normalize Fullname: "Crème Brûlée" -> "creme-brulee"
        const normalizeName = (name: string) => {
            return name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
        };

        const folderName = normalizeName(data.fullname);
        const uploadedUrls: string[] = [];

        // Prepare Basic Auth Header
        const authHeader = "Basic " + btoa(c.env.IMAGEKIT_PRIVATE_KEY + ":");

        for (const base64Image of data.portrait_urls) {
            // Generate 8 digit random number
            const random = Math.floor(10000000 + Math.random() * 90000000).toString();
            const fileName = `${folderName}-${random}.jpg`; 

            try {
                const formData = new FormData();
                formData.append("file", base64Image);
                formData.append("fileName", fileName);
                formData.append("folder", `/lifedrawing/model/${folderName}/`);
                formData.append("useUniqueFileName", "false");

                const uploadReq = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
                    method: "POST",
                    headers: {
                        "Authorization": authHeader
                    },
                    body: formData
                });

                if (!uploadReq.ok) {
                    const errorText = await uploadReq.text();
                    console.error("ImageKit API Error:", errorText);
                    throw new Error(`ImageKit upload failed: ${uploadReq.status}`);
                }

                const uploadRes = await uploadReq.json() as { url: string };
                // Store only path suffix: folderName/fileName
                uploadedUrls.push(`${folderName}/${fileName}`);

            } catch (uploadErr) {
                console.error("ImageKit Upload Failed:", uploadErr);
                throw new Error("Failed to upload image to ImageKit.");
            }
        }

        // --- 5. Update Model with URLs ---
        if (uploadedUrls.length > 0) {
            await query(
                c.env, 
                `UPDATE models SET portrait_urls = $1::jsonb WHERE user_id = $2`, 
                [JSON.stringify(uploadedUrls), newUserId]
            );
        }
    }

    return c.json({ success: true, userId: newUserId }, 201);

  } catch (err: any) {
    // If anything fails, attempt to clean up the created user
    if (newUserId) {
      try {
        console.warn(`Transaction failed. Rolling back user ${newUserId}...`);
        await query(c.env, "DELETE FROM users WHERE id = $1", [newUserId]);
        console.log(`Rollback successful for user ${newUserId}.`);
      } catch (cleanupErr: any) {
        console.error(`Cleanup failed for user ${newUserId}: ${cleanupErr.message}`);
      }
    }
    console.error("Model registration failed:", err);
    return c.json({ error: "Registration failed.", details: err.message }, 500);
  }
});

export default app;
