import { open } from "@tauri-apps/plugin-dialog";

export async function pickFolder(title: string): Promise<string | null> {
    const selected = await open({ title, directory: true, multiple: false });
    if (!selected) return null;
    if (Array.isArray(selected)) return null;
    return selected;
}