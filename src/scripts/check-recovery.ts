import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load env vars from .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from("app_state")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching data:", error);
  } else if (data) {
    console.log("Data found in Supabase:");
    console.log("Updated at:", data.updated_at);
    // Print a summary of the data
    const state = data.data?.state || data.data;
    if (state) {
      console.log("Tasks count:", state.tasks?.length || 0);
      console.log("Notes count:", state.notes?.length || 0);
      console.log("Vision/LifeGoals count:", state.lifeGoals?.length || 0);
      console.log("Projects count:", state.projects?.length || 0);
      
      // Look for specific data to see if it's the default or user data
      const firstTask = state.tasks?.[0];
      console.log("First task sample:", firstTask?.text);
    } else {
      console.log("State is empty or invalid structure");
    }
  } else {
    console.log("No data found for ID 1");
  }
}

checkData();
