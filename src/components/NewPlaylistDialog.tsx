import { useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import { useState } from 'react'
import { toast } from 'sonner'
import { createPlaylist } from '../db/api'
import { m } from '../paraglide/messages.js'
import { useUi } from '../stores/ui'
import { Modal } from './overlay'
import { btn, inputClass } from './ui'

export function NewPlaylistDialog() {
  const target = useUi((s) => s.newPlaylistFor)
  const close = useUi((s) => s.closeNewPlaylist)
  const navigate = useNavigate()
  const [name, setName] = useState('')

  const submit = async () => {
    if (!name.trim()) return
    const id = await createPlaylist(name, target?.trackId ? [target.trackId] : [])
    setName('')
    close()
    if (target?.trackId) toast.success(m.added_to_playlist({ name: name.trim() }))
    else navigate({ to: '/playlist/$playlistId', params: { playlistId: id } })
  }

  return (
    <Modal open={!!target} onOpenChange={(o) => !o && close()} title={m.new_playlist()}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex flex-col gap-5"
      >
        <input
          // biome-ignore lint/a11y/noAutofocus: dialog's only field
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={m.playlist_name()}
          maxLength={80}
          className={inputClass}
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={close} className={clsx(btn.base, btn.ghost, btn.md)}>
            {m.cancel()}
          </button>
          <button type="submit" disabled={!name.trim()} className={clsx(btn.base, btn.primary, btn.md)}>
            {m.create()}
          </button>
        </div>
      </form>
    </Modal>
  )
}
