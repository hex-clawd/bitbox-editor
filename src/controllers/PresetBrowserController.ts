import type { ListedFile } from "../services/fs/tauriFs";
import { listFolderOnce, readUtf8Text } from "../services/fs/tauriFs";
import type { BitboxPreset } from "../core/domain/bitboxPreset";
import { parseBitboxPresetXml } from "../core/xml/bitboxPresetParser";

type Ok<T> = { ok: true } & T;
type Err = { ok: false; error: string };
type Result<T> = Ok<T> | Err;

function joinPath(a: string, b: string) {
    if (a.endsWith("/")) return `${a}${b}`;
    return `${a}/${b}`;
}

function hasPresetXml(children: ListedFile[]) {
    return children.some((c) => !c.isDir && c.name.toLowerCase() === "preset.xml");
}

export class PresetBrowserController {
    /**
     * User selects ROOT.
     * We list ROOT/Presets and return preset folders (those containing preset.xml).
     */
    async loadFolder(rootPath: string): Promise<Result<{ items: ListedFile[] }>> {
        try {
            const presetsPath = joinPath(rootPath, "Presets");

            console.log("[PresetBrowserController] loadFolder rootPath =", rootPath);
            console.log("[PresetBrowserController] scanning presetsPath =", presetsPath);

            const entries = await listFolderOnce(presetsPath);

            const candidateFolders = entries.filter((e) => e.isDir);

            const presetFolders: ListedFile[] = [];
            for (const folder of candidateFolders) {
                const children = await listFolderOnce(folder.path);
                if (hasPresetXml(children)) presetFolders.push(folder);
            }

            console.log(
                "[PresetBrowserController] presetFolders:",
                presetFolders.map((f) => f.name)
            );

            return { ok: true, items: presetFolders };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }

    /**
     * Loads and parses ROOT/Presets/<PresetName>/preset.xml
     */
    async loadPresetXml(xmlFile: ListedFile): Promise<Result<{ xml: string; preset: BitboxPreset }>> {
        try {
            console.log("[PresetBrowserController] loadPresetXml path =", xmlFile.path);

            const xml = await readUtf8Text(xmlFile.path);

            const parsed = parseBitboxPresetXml(xml);

            // Parser returns ParseResult union { ok: true, preset } | { ok: false, error, preset? }
            if (!parsed.ok) {
                // Optional: if parsed.preset exists, you could still return it,
                // but simplest is to surface parse error into the UI error stripe.
                return { ok: false, error: parsed.error };
            }

            return { ok: true, xml, preset: parsed.preset };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }
}