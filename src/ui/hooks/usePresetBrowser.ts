import { useMemo, useState } from "react";
import type { ListedFile } from "../../services/fs/tauriFs";
import { pickFolder } from "../../services/dialog/tauriDialog";
import { PresetBrowserController } from "../../controllers/PresetBrowserController";
import type { BitboxPreset } from "../../core/domain/bitboxPreset";

const controller = new PresetBrowserController();

/**
 * Presets are folders under ROOT/Presets.
 * Display name = folder name.
 */
function isPresetFolder(x: ListedFile) {
    return x.isDir;
}

function toPresetXmlFile(presetFolder: ListedFile): ListedFile {
    const base = presetFolder.path.endsWith("/")
        ? presetFolder.path.slice(0, -1)
        : presetFolder.path;

    return {
        name: "preset.xml",
        path: `${base}/preset.xml`,
        isDir: false,
    };
}

export function usePresetBrowser() {
    const [folderPath, setFolderPath] = useState<string | null>(null);
    const [items, setItems] = useState<ListedFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    // selectedFile is the selected PRESET FOLDER (not the xml file)
    const [selectedFile, setSelectedFile] = useState<ListedFile | null>(null);
    const [selectedText, setSelectedText] = useState<string>("");
    const [selectedPreset, setSelectedPreset] = useState<BitboxPreset | null>(null);

    const presetFiles = useMemo(() => items.filter(isPresetFolder), [items]);

    async function chooseFolder() {
        setError(null);

        const selected = await pickFolder("Choose Bitbox preset folder");
        console.log("[PresetBrowser] pickFolder ->", selected);
        if (!selected) return;

        setFolderPath(selected);
        setSelectedFile(null);
        setSelectedText("");
        setSelectedPreset(null);

        try {
            setIsBusy(true);

            console.log("[PresetBrowser] loadFolder:", selected);
            const res = await controller.loadFolder(selected);
            console.log("[PresetBrowser] loadFolder result:", res);

            if (!res.ok) throw new Error(res.error);

            setItems(res.items);
            console.log("[PresetBrowser] items:", res.items);
            console.log(
                "[PresetBrowser] preset folders:",
                res.items.filter(isPresetFolder).map((x) => x.name)
            );

            // auto-open first preset folder (optional behavior you had)
            const firstPresetFolder = res.items.find(isPresetFolder) ?? null;
            console.log("[PresetBrowser] firstPresetFolder:", firstPresetFolder);

            if (firstPresetFolder) {
                const xmlFile = toPresetXmlFile(firstPresetFolder);
                console.log("[PresetBrowser] auto-open xmlFile:", xmlFile);

                const p = await controller.loadPresetXml(xmlFile);
                console.log("[PresetBrowser] auto-open loadPresetXml result:", p);

                if (!p.ok) throw new Error(p.error);

                setSelectedFile(firstPresetFolder);
                setSelectedText(p.xml);
                setSelectedPreset(p.preset);
            }
        } catch (e) {
            console.log("[PresetBrowser] chooseFolder error:", e);
            setError(String(e));
            setItems([]);
            setSelectedFile(null);
            setSelectedText("");
            setSelectedPreset(null);
        } finally {
            setIsBusy(false);
        }
    }

    async function openPresetFile(presetFolder: ListedFile) {
        setError(null);

        // select folder for UI display
        setSelectedFile(presetFolder);
        setSelectedText("");
        setSelectedPreset(null);

        try {
            setIsBusy(true);

            const xmlFile = toPresetXmlFile(presetFolder);
            console.log("[PresetBrowser] openPresetFile folder:", presetFolder);
            console.log("[PresetBrowser] openPresetFile xmlFile:", xmlFile);

            const res = await controller.loadPresetXml(xmlFile);
            console.log("[PresetBrowser] openPresetFile loadPresetXml result:", res);

            if (!res.ok) throw new Error(res.error);

            setSelectedText(res.xml);
            setSelectedPreset(res.preset);
        } catch (e) {
            console.log("[PresetBrowser] openPresetFile error:", e);
            setError(String(e));
            setSelectedFile(null);
            setSelectedText("");
            setSelectedPreset(null);
        } finally {
            setIsBusy(false);
        }
    }

    return {
        folderPath,
        items,
        presetFiles,
        error,
        isBusy,
        selectedFile,
        selectedText,
        selectedPreset,
        chooseFolder,
        openPresetFile,
    };
}