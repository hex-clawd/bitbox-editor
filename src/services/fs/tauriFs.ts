import { readDir, readTextFile } from "@tauri-apps/plugin-fs";

export type ListedFile = {
    name: string;
    path: string;
    isDir: boolean;
};

export async function listFolderOnce(folderPath: string): Promise<ListedFile[]> {
    const entries = await readDir(folderPath);

    return entries.map((e) => {
        const name = e.name ?? "(no name)";
        const fullPath = folderPath.endsWith("/") ? `${folderPath}${name}` : `${folderPath}/${name}`;

        return {
            name,
            path: fullPath,
            // Tauri v2 DirEntry provides explicit booleans:
            // isDirectory / isFile / isSymlink
            isDir: !!e.isDirectory,
        };
    });
}

export async function readUtf8Text(path: string): Promise<string> {
    const text = await readTextFile(path);

    // Bitbox-exported files sometimes include trailing NUL bytes (0x00),
    // which break DOMParser with "Extra content at the end of the document".
    return text.replace(/\u0000/g, "");
}