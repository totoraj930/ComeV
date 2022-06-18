import { checkUpdate, installUpdate } from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";

export async function tryUpdate() {
  try {
    const { shouldUpdate, manifest } = await checkUpdate();
    if (shouldUpdate) {
      console.log(manifest);
      await installUpdate();
      await relaunch();
    } else {
      return Promise.resolve("更新はありませんでした");
    }
  } catch (error) {
    return Promise.reject(error);
  }
}