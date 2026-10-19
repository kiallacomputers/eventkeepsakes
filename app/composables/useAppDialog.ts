export type AppDialogKind = 'info' | 'success' | 'error' | 'confirm'
export interface AppDialogState { open: boolean; kind: AppDialogKind; title: string; message: string; confirmText: string; cancelText: string }
let resolvePending: ((value: boolean) => void) | null = null
export function useAppDialog() {
  const state = useState<AppDialogState>('ek-app-dialog', () => ({ open: false, kind: 'info', title: '', message: '', confirmText: 'OK', cancelText: 'Cancel' }))
  function close(result = false) { state.value.open = false; const resolve = resolvePending; resolvePending = null; resolve?.(result) }
  function show(message: string, kind: Exclude<AppDialogKind, 'confirm'> = 'info', title?: string) {
    close(false)
    state.value = { open: true, kind, title: title || (kind === 'success' ? 'Success' : kind === 'error' ? 'Something went wrong' : 'EventKeepsakes'), message, confirmText: 'OK', cancelText: 'Cancel' }
  }
  function confirm(message: string, title = 'Please confirm', confirmText = 'Confirm'): Promise<boolean> {
    close(false)
    state.value = { open: true, kind: 'confirm', title, message, confirmText, cancelText: 'Cancel' }
    return new Promise<boolean>(resolve => { resolvePending = resolve })
  }
  return { state, show, confirm, close }
}
