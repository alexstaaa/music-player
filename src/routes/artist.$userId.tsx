import { createFileRoute, Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { useState } from 'react'
import { toast } from 'sonner'
import { Icon } from '../components/Icon'
import { PlaylistGrid } from '../components/lists'
import { Modal } from '../components/overlay'
import { FollowButton } from '../components/TrackActions'
import { TrackRow } from '../components/TrackRow'
import { Avatar, btn, EmptyState, inputClass, Tabs } from '../components/ui'
import { updateMe, useFollowerCount, usePlaylists, useUser, useUserTracks } from '../db/api'
import { ME, type User } from '../db/schema'
import { followersLabel, tracksLabel } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'

export const Route = createFileRoute('/artist/$userId')({
  validateSearch: (s: Record<string, unknown>): { tab?: 'playlists' } => ({
    tab: s.tab === 'playlists' ? 'playlists' : undefined,
  }),
  component: ArtistPage,
})

function ArtistPage() {
  const { userId } = Route.useParams()
  const { tab = 'tracks' } = Route.useSearch()
  const navigate = Route.useNavigate()
  const user = useUser(userId)
  const tracks = useUserTracks(userId)
  const playlists = usePlaylists(userId)
  const followers = useFollowerCount(userId)
  const [editing, setEditing] = useState(false)
  if (!user) return null
  const hue = user.hue

  return (
    <div className="flex flex-col gap-8">
      <section
        className="-mx-4 flex flex-col gap-5 px-4 pt-10 pb-6 sm:flex-row sm:items-end sm:gap-7 lg:mx-0 lg:rounded-3xl lg:px-8"
        style={{ background: `linear-gradient(160deg, oklch(0.55 0.12 ${hue} / 0.35), transparent 70%)` }}
      >
        <Avatar user={user} size={148} className="shadow-cover" />
        <div className="flex min-w-0 grow flex-col gap-3">
          <div className="overline">{m.artist_kicker()}</div>
          <h1 className="display-tight text-4xl font-semibold lg:text-5xl">{user.name}</h1>
          {user.bio && <p className="max-w-xl text-[15px] text-fg-2">{user.bio}</p>}
          <div className="flex flex-wrap items-center gap-3 text-sm text-fg-2">
            <span>{followersLabel(followers)}</span>
            <span>·</span>
            <span>{tracksLabel(tracks.length)}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-2.5">
            {tracks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const first = tracks[0]
                  if (first)
                    usePlayer.getState().playTrack(
                      first.id,
                      tracks.map((t) => t.id),
                    )
                }}
                className={clsx(btn.base, btn.primary, 'h-11 pr-5 pl-4 text-[15px]')}
              >
                <Icon name="play" size={18} /> {m.play_all()}
              </button>
            )}
            {userId === ME ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className={clsx(btn.base, btn.soft, 'h-11 px-4 text-[15px]')}
              >
                <Icon name="edit" size={18} /> {m.edit_profile()}
              </button>
            ) : (
              <FollowButton userId={userId} size="md" />
            )}
          </div>
        </div>
      </section>

      <Tabs
        value={tab}
        onChange={(t) =>
          navigate({ search: { tab: t === 'tracks' ? undefined : 'playlists' }, replace: true })
        }
        items={[
          { value: 'tracks', label: m.tracks() },
          { value: 'playlists', label: m.playlists() },
        ]}
      />

      {tab === 'tracks' ? (
        tracks.length ? (
          <div className="flex flex-col">
            {tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} queue={tracks.map((x) => x.id)} />
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              userId === ME && (
                <Link to="/upload" className={clsx(btn.base, btn.primary, btn.md)}>
                  {m.nav_upload()}
                </Link>
              )
            }
          >
            {userId === ME ? m.empty_uploads() : m.no_tracks()}
          </EmptyState>
        )
      ) : (
        <PlaylistGrid playlists={playlists} />
      )}

      {userId === ME && <EditProfile user={user} open={editing} onOpenChange={setEditing} />}
    </div>
  )
}

const HUES = [20, 70, 130, 170, 210, 250, 300, 340]

function EditProfile({
  user,
  open,
  onOpenChange,
}: {
  user: User
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [hue, setHue] = useState(user.hue)
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={m.edit_profile()}>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          await updateMe({ name: name.trim() || user.name, bio: bio.trim(), hue })
          onOpenChange(false)
          toast.success(m.profile_saved())
        }}
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {m.field_name()}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {m.field_bio()}
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            className={clsx(inputClass, 'h-auto py-3')}
          />
        </label>
        <fieldset className="flex flex-col gap-2 text-sm font-medium">
          <legend className="mb-1.5">{m.field_color()}</legend>
          <div className="flex flex-wrap gap-2">
            {HUES.map((h) => (
              <button
                key={h}
                type="button"
                aria-label={`hue ${h}`}
                aria-pressed={hue === h}
                onClick={() => setHue(h)}
                className={clsx(
                  'press size-9 rounded-full ring-offset-2 ring-offset-panel',
                  hue === h && 'ring-2 ring-fg',
                )}
                style={{ background: `oklch(0.8 0.08 ${h})` }}
              />
            ))}
          </div>
        </fieldset>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={clsx(btn.base, btn.ghost, btn.md)}
          >
            {m.cancel()}
          </button>
          <button type="submit" className={clsx(btn.base, btn.primary, btn.md)}>
            {m.save()}
          </button>
        </div>
      </form>
    </Modal>
  )
}
