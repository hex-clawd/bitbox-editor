import { useMemo, useState } from "react";
import type { ListedFile } from "../../services/fs/tauriFs";
import { pickFolder } from "../../services/dialog/tauriDialog";
import { PresetBrowserController } from "../../controllers/PresetBrowserController";
import type { BitboxPreset } from "../../core/domain/bitboxPreset";

const controller = new PresetBrowserController();

export function usePresetBrowser() {
    const [folderPath, setFolderPath] = useState<string | null>(null);
    const [items, setItems] = useState<ListedFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    const [selectedFile, setSelectedFile] = useState<ListedFile | null>(null);
    const [selectedText, setSelectedText] = useState<string>("");
    const [selectedPreset, setSelectedPreset] = useState<BitboxPreset | null>(null);

    const presetFiles = useMemo(
        () => items.filter((x) => !x.isDir).filter((x) => x.name.toLowerCase().endsWith(".xml")),
        [items]
    );

    async function chooseFolder() {
        setError(null);
        const selected = await pickFolder("Choose Bitbox preset folder");
        if (!selected) return;

        setFolderPath(selected);
        setSelectedFile(null);
        setSelectedText("");
        setSelectedPreset(null);

        try {
            setIsBusy(true);
            const res = await controller.loadFolder(selected);
            if (!res.ok) throw new Error(res.error);
            setItems(res.items);
        } catch (e) {
            setError(String(e));
            setItems([]);
        } finally {
            setIsBusy(false);
        }
    }

    async function openPresetFile(file: ListedFile) {
        setError(null);
        setSelectedFile(file);
        setSelectedText("");
        setSelectedPreset(null);

        try {
            setIsBusy(true);
            const res = await controller.loadPresetXml(file);
            if (!res.ok) throw new Error(res.error);

            setSelectedText(res.xml);
            setSelectedPreset(res.preset);
        } catch (e) {
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