pub fn show_system_menu(window: impl raw_window_handle::HasRawWindowHandle) -> Result<(), String> {
  match window.raw_window_handle() {
    #[cfg(target_os = "windows")]
    raw_window_handle::RawWindowHandle::Win32(handle) => {
      use windows::Win32::UI::WindowsAndMessaging::*;
      use windows::Win32::Foundation::*;
      unsafe {
        let hwnd: HWND = HWND(handle.hwnd as isize);
        let hmenu = GetSystemMenu(hwnd, BOOL(0));
        let mut lpwndpl: WINDOWPLACEMENT = WINDOWPLACEMENT::default();
        GetWindowPlacement(hwnd, &mut lpwndpl);

        match lpwndpl.showCmd {
          SW_SHOWMAXIMIZED => {
            EnableMenuItem(hmenu, SC_RESTORE, MF_ENABLED);
            EnableMenuItem(hmenu, SC_MAXIMIZE, MF_DISABLED);
            EnableMenuItem(hmenu, SC_MOVE, MF_DISABLED);
            EnableMenuItem(hmenu, SC_SIZE, MF_DISABLED);
          }
          SW_SHOWNORMAL => {
            EnableMenuItem(hmenu, SC_RESTORE, MF_DISABLED);
            EnableMenuItem(hmenu, SC_MAXIMIZE, MF_ENABLED);
          }
          _ => {}
        }

        let mut lp = POINT::default();
        GetCursorPos(&mut lp);
        SetForegroundWindow(hwnd);
        let cmd = TrackPopupMenu(hmenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, lp.x, lp.y, 0, hwnd, 0 as _);
        if cmd.0 > 0 {
          let wparam = WPARAM(cmd.0.try_into().unwrap());
          PostMessageW(hwnd, WM_SYSCOMMAND, wparam, LPARAM(0));
        }
      }
      Ok(())
    }
    _ => Ok(())
  }
}