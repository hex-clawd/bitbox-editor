import { readDir, readTextFile } from "@tauri-apps/plugin-fs";

export type ListedFile = {
    name: string;
    path: string;
    isDir: boolean;
};

export async function listFolderOnce(folderPath: string): Promise<ListedFile[]> {
    const entries = await readDir(folderPath, { recursive: false });

    return entries.map((e) => {
        const name = e.name ?? "(no name)";
        const fullPath =
            e.path ??
            (folderPath.endsWith("/") ? `${folderPath}${name}` : `${folderPath}/${name}`);

        return {
            name,
            path: fullPath,
            isDir: !!e.children, // same assumption you currently use
        };
    });
}

export async function readUtf8Text(path: string): Promise<string> {
    return readTextFile(path);
}