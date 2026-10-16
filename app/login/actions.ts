"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error: string | null;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  const supabase = await createClient();

  const { data: email, error: lookupError } = await supabase.rpc("username_to_email", {
    p_username: username,
  });

  if (lookupError || !email) {
    // Deliberately the same message as a wrong password — don't reveal
    // whether a username exists.
    return { error: "Incorrect username or password." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return { error: "Incorrect username or password." };
  }

  redirect(next || "/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
