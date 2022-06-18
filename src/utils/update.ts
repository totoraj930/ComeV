import { checkUpdate, installUpdate, UpdateManifest } from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";

interface Result {
  type: "error" | "noUpdate" | "shouldUpdate";
  message: string;
  manifest?: UpdateManifest
}

export async function tryUpdate(): Promise<Result> {
  try {
    const { shouldUpdate, manifest } = await checkUpdate();
    console.log(manifest);
    if (shouldUpdate) {
      return Promise.resolve({
        type: "shouldUpdate",
        message: "更新があります",
        manifest
      });
    } else {
      return Promise.resolve({
        type: "noUpdate",
        message: "更新はありませんでした",
        manifest
      });
    }
  } catch (error) {
    return Promise.resolve({
      type: "error",
      message: error + ""
    });
  }
}

export async function startUpdate() {
  await installUpdate();
  await relaunch();
}