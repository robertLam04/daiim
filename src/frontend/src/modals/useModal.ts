import { useSearchParams } from 'react-router-dom'

// Modals live in the URL (?modal=name) so every modal screen has its own link.
export function useModal() {
  const [params, setParams] = useSearchParams()
  const name = params.get('modal')

  const open = (modal: string, extra: Record<string, string> = {}) => {
    const next = new URLSearchParams(params)
    next.set('modal', modal)
    for (const [k, v] of Object.entries(extra)) next.set(k, v)
    setParams(next)
  }

  const close = () => {
    const next = new URLSearchParams(params)
    for (const k of ['modal', 'to', 'via', 'amount', 'proof', 'error', 'next', 'from']) next.delete(k)
    setParams(next)
  }

  return { name, params, open, close }
}
