import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { useFollowerCount, useTracksByIds } from '../db/api'
import type { Playlist, User } from '../db/schema'
import { followersLabel, tracksLabel } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { FollowButton } from './TrackActions'
import { Avatar, btn, EmptyState, PlaylistCover } from './ui'

export function ArtistRow({ user }: { user: User }) {
  const followers = useFollowerCount(user.id)
  return (
    <div className="flex h-14 items-center gap-3">
      <Link to="/artist/$userId" params={{ userId: user.id }}>
        <Avatar user={user} size={44} />
      </Link>
      <Link to="/artist/$userId" params={{ userId: user.id }} className="flex min-w-0 grow flex-col">
        <span className="truncate text-sm font-semibold hover:underline">{user.name}</span>
        <span className="truncate text-xs text-fg-2">{followersLabel(followers)}</span>
      </Link>
      <FollowButton userId={user.id} />
    </div>
  )
}

export function PlaylistGrid({ playlists }: { playlists: Playlist[] }) {
  if (!playlists.length) return <EmptyState>{m.empty_playlists()}</EmptyState>
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
      {playlists.map((p) => (
        <PlaylistTile key={p.id} playlist={p} />
      ))}
    </div>
  )
}

function PlaylistTile({ playlist }: { playlist: Playlist }) {
  const tracks = useTracksByIds(playlist.trackIds)
  return (
    <Link
      to="/playlist/$playlistId"
      params={{ playlistId: playlist.id }}
      className="group flex flex-col gap-2.5"
    >
      <PlaylistCover
        playlist={playlist}
        tracks={tracks}
        className="aspect-square w-full rounded-2xl transition-transform duration-200 ease-snap group-hover:scale-[1.02]"
      />
      <div className="flex flex-col">
        <span className="truncate text-[15px] font-semibold">{playlist.name}</span>
        <span className="text-[13px] text-fg-3">{tracksLabel(playlist.trackIds.length)}</span>
      </div>
    </Link>
  )
}

export function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-2xl font-semibold">{m.not_found()}</p>
      <Link to="/" className={clsx(btn.base, btn.solid, btn.md)}>
        {m.back_home()}
      </Link>
    </div>
  )
}
