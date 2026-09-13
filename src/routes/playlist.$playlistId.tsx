import { createFileRoute, useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import { useState } from 'react'
import { toast } from 'sonner'
import { Icon } from '../components/Icon'
import { Modal } from '../components/overlay'
import { TrackRow } from '../components/TrackRow'
import { ArtistLink, btn, EmptyState, inputClass, PlaylistCover } from '../components/ui'
import { deletePlaylist, renamePlaylist, usePlaylist, useTracksByIds, useUsers } from '../db/api'
import { ME } from '../db/schema'
import { formatTime, tracksLabel } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'

export const Route = createFileRoute('/playlist/$playlistId')({ component: PlaylistPage })

function PlaylistPage() {
  const { playlistId } = Route.useParams()
  const playlist = usePlaylist(playlistId)
  const tracks = useTracksByIds(playlist?.trackIds ?? [])
  const users = useUsers()
  const navigate = useNavigate()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')
  if (!playlist) return null
  const own = playlist.userId === ME
  const ids = tracks.map((t) => t.id)
  const total = tracks.reduce((sum, t) => sum + t.duration, 0)

  const playAll = (shuffle: boolean) => {
    const start = shuffle ? ids[Math.floor(Math.random() * ids.length)] : ids[0]
    if (!start) return
    usePlayer.setState({ shuffle })
    usePlayer.getState().playTrack(start, ids)
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <PlaylistCover
          playlist={playlist}
          tracks={tracks}
          className="size-44 rounded-3xl shadow-cover sm:size-[220px]"
        />
        <div className="flex min-w-0 grow flex-col gap-3">
          <div className="overline">{m.playlist_kicker()}</div>
          <h1 className="display-tight text-4xl font-semibold text-balance lg:text-5xl">{playlist.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-[15px] text-fg-2">
            <ArtistLink user={users.get(playlist.userId)} className="font-semibold text-fg" />
            <span>·</span>
            <span>{tracksLabel(tracks.length)}</span>
            <span>·</span>
            <span>{formatTime(total)}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={!ids.length}
              onClick={() => playAll(false)}
              className={clsx(btn.base, btn.primary, 'h-11 pr-5 pl-4 text-[15px]')}
            >
              <Icon name="play" size={18} /> {m.play_all()}
            </button>
            <button
              type="button"
              disabled={!ids.length}
              onClick={() => playAll(true)}
              className={clsx(btn.base, btn.soft, 'h-11 px-4 text-[15px]')}
            >
              <Icon name="shuffle" size={18} /> {m.shuffle()}
            </button>
            {own && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setName(playlist.name)
                    setRenaming(true)
                  }}
                  className={clsx(btn.base, btn.soft, 'h-11 px-4 text-[15px]')}
                >
                  <Icon name="edit" size={18} /> {m.rename()}
                </button>
                <button
                  type="button"
                  aria-label={m.delete_playlist()}
                  onClick={async () => {
                    if (!window.confirm(m.confirm_delete())) return
                    await deletePlaylist(playlist.id)
                    toast(m.playlist_deleted())
                    navigate({ to: '/library', search: { tab: 'playlists' } })
                  }}
                  className={clsx(btn.base, btn.soft, 'size-11')}
                >
                  <Icon name="trash" size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {tracks.length ? (
        <div className="flex flex-col">
          {tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} queue={ids} playlistId={own ? playlist.id : undefined} />
          ))}
        </div>
      ) : (
        <EmptyState>{m.empty_playlist()}</EmptyState>
      )}

      <Modal open={renaming} onOpenChange={setRenaming} title={m.rename()}>
        <form
          className="flex flex-col gap-5"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!name.trim()) return
            await renamePlaylist(playlist.id, name)
            setRenaming(false)
          }}
        >
          {/* biome-ignore lint/a11y/noAutofocus: dialog's only field */}
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className={inputClass}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRenaming(false)}
              className={clsx(btn.base, btn.ghost, btn.md)}
            >
              {m.cancel()}
            </button>
            <button type="submit" disabled={!name.trim()} className={clsx(btn.base, btn.primary, btn.md)}>
              {m.save()}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
