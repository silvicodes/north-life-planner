#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = { ...readEnvFile(".env"), ...process.env };
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const email = env.SUPABASE_E2E_EMAIL;
const password = env.SUPABASE_E2E_PASSWORD;
const tableName = "north_user_data";

const emptyData = {
  tasks: [],
  movements: [],
  habits: [],
  events: [],
  goals: [],
  budgets: [],
};

main().catch((error) => {
  console.error(`Supabase E2E failed: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  assertConfig();

  const client = createSupabaseClient();
  const session = await getOrCreateSession(client);
  const userId = session.user.id;
  const originalData = await loadUserData(client, userId);
  const runId = `north-e2e-${Date.now()}`;
  const testData = addE2EItems(originalData, runId);
  let savedTestData = false;

  console.log(`Signed in as ${email}`);
  try {
    console.log("Saving E2E data to Supabase...");
    await saveUserData(client, userId, testData);
    savedTestData = true;

    console.log("Simulating reload and fresh login...");
    await client.auth.signOut();

    const freshClient = createSupabaseClient();
    const freshSession = await signIn(freshClient);
    const syncedData = await loadUserData(freshClient, freshSession.user.id);
    assertSyncedData(syncedData, runId);

    console.log("Cloud sync verified after reload, sign out, and sign in.");
    await freshClient.auth.signOut();
  } finally {
    if (savedTestData) {
      console.log("Restoring previous data...");
      const restoreClient = createSupabaseClient();
      const restoreSession = await signIn(restoreClient);
      await saveUserData(restoreClient, restoreSession.user.id, originalData);
      await restoreClient.auth.signOut();
    }
  }

  console.log("Supabase E2E passed.");
}

function readEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return {};

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return values;

      const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!match) return values;

      const [, key, rawValue] = match;
      values[key] = rawValue.replace(/^["']|["']$/g, "");
      return values;
    }, {});
}

function assertConfig() {
  const missing = [
    ["VITE_SUPABASE_URL", supabaseUrl],
    ["VITE_SUPABASE_ANON_KEY", supabaseAnonKey],
    ["SUPABASE_E2E_EMAIL", email],
    ["SUPABASE_E2E_PASSWORD", password],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  const parsedUrl = new URL(supabaseUrl);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("VITE_SUPABASE_URL must be an HTTP or HTTPS URL.");
  }

  if (parsedUrl.pathname !== "/") {
    throw new Error("Use the project URL, not the REST URL. Example: https://your-project.supabase.co");
  }
}

function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getOrCreateSession(client) {
  const signInResult = await client.auth.signInWithPassword({ email, password });
  if (!signInResult.error && signInResult.data.session) return signInResult.data.session;

  console.log("Test account not found or password did not match. Creating the account...");
  const signUpResult = await client.auth.signUp({ email, password });
  if (signUpResult.error) throw signUpResult.error;

  if (!signUpResult.data.session) {
    throw new Error(
      "Account created, but email confirmation is required. Confirm the email in Supabase/Auth, then run this script again.",
    );
  }

  return signUpResult.data.session;
}

async function signIn(client) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("Supabase did not return a session after sign in.");
  return data.session;
}

async function loadUserData(client, userId) {
  const { data, error } = await client
    .from(tableName)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeData(data?.data);
}

async function saveUserData(client, userId, data) {
  const { error } = await client.from(tableName).upsert({
    user_id: userId,
    data,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

function addE2EItems(data, runId) {
  const today = new Date().toISOString().slice(0, 10);

  return {
    ...normalizeData(data),
    tasks: [
      ...data.tasks,
      {
        id: `${runId}-task`,
        title: "Supabase E2E task",
        areaKey: "dia",
        time: "09:00",
        priority: "high",
      },
    ],
    movements: [
      ...data.movements,
      {
        id: `${runId}-movement`,
        title: "Supabase E2E income",
        category: "Test",
        amount: 25,
        type: "income",
      },
    ],
    habits: [
      ...data.habits,
      {
        id: `${runId}-habit`,
        name: "Supabase E2E habit",
        done: true,
        streak: 1,
        frequency: "daily",
        history: [today],
      },
    ],
    events: [
      ...data.events,
      {
        id: `${runId}-event`,
        title: "Supabase E2E event",
        date: today,
        time: "10:00",
      },
    ],
    goals: [
      ...data.goals,
      {
        id: `${runId}-goal`,
        title: "Supabase E2E goal",
        area: "Testing",
        progress: 50,
        target: "Cloud sync",
      },
    ],
    budgets: [
      ...data.budgets,
      {
        id: `${runId}-budget`,
        category: "E2E",
        monthlyLimit: 100,
      },
    ],
  };
}

function normalizeData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return structuredClone(emptyData);

  return {
    tasks: ensureArray(data.tasks),
    movements: ensureArray(data.movements),
    habits: ensureArray(data.habits),
    events: ensureArray(data.events),
    goals: ensureArray(data.goals),
    budgets: ensureArray(data.budgets),
  };
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function assertSyncedData(data, runId) {
  const checks = [
    data.tasks.some((item) => item.id === `${runId}-task`),
    data.movements.some((item) => item.id === `${runId}-movement`),
    data.habits.some((item) => item.id === `${runId}-habit`),
    data.events.some((item) => item.id === `${runId}-event`),
    data.goals.some((item) => item.id === `${runId}-goal`),
    data.budgets.some((item) => item.id === `${runId}-budget`),
  ];

  if (checks.some((passed) => !passed)) {
    throw new Error("Synced data did not include every E2E item after fresh sign in.");
  }
}
