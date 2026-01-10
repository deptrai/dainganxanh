import { supabase } from "./supabase";

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session?.user || null;
}

/**
 * Get user profile from the users table
 */
export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }

    return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out:", error);
        throw error;
    }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return user !== null;
}

/**
 * Get current session
 */
export async function getSession() {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session;
}
