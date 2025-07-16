import { LibraryPersistedData } from "@excalidraw/excalidraw/data/library";
import { LibraryItems } from "@excalidraw/excalidraw/types";

export class LibraryAPIAdapter {
  static async load(): Promise<LibraryPersistedData> {
    const response = await fetch("/api/library");
    const { libraryItems } = (await response.json()) as {
      libraryItems: LibraryItems;
    };
    return { libraryItems };
  }

  static async save(data: LibraryPersistedData): Promise<void> {
    const { libraryItems } = data;
    const response = await fetch("/api/library", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ libraryItems }),
    });
    if (!response.ok) {
      throw new Error("Failed to save library items");
    }
  }
}
