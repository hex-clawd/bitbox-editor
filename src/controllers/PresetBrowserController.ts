import type { ListedFile } from "../services/fs/tauriFs";
import { listFolderOnce, readUtf8Text } from "../services/fs/tauriFs";
import { parseBitboxPresetXml } from "../core/xml/bitboxPresetParser";
import type { BitboxPreset } from "../core/domain/bitboxPreset";

export type LoadFolderResult =
    | { ok: true; items: ListedFile[] }
    | { ok: false; error: string; items: ListedFile[] };

export type LoadPresetResult =
    | { ok: true; xml: string; preset: BitboxPreset }
    | { ok: false; error: string };

export class PresetBrowserController {
    async loadFolder(folderPath: string): Promise<LoadFolderResult> {
        try {
            const items = await listFolderOnce(folderPath);
            return { ok: true, items };
        } catch (e) {
            return { ok: false, error: String(e), items: [] };
        }
    }

    async loadPresetXml(file: ListedFile): Promise<LoadPresetResult> {
        try {
            const xml = await readUtf8Text(file.path);
            const parsed = parseBitboxPresetXml(xml);
            if (!parsed.ok) {
                return { ok: false, error: parsed.error };
            }

            // If preset name missing, UI can fall back to filename;
            // or do it here to keep a consistent contract:
            const preset = parsed.preset.name
                ? parsed.preset
                : { ...parsed.preset, name: file.name.replace(/\.xml$/i, "") };

            return { ok: true, xml, preset };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }
}