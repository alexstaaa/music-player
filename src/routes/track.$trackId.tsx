import { createFileRoute, Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { NotFound } from '../components/lists'
import { LikeButton, RepostButton, ShareButton } from '../components/TrackActions'
import { TrackMenu } from '../components/TrackMenu'
import { TrackRow } from '../components/TrackRow'
import { ArtistLink, Avatar, btn, Cover, genreLabel, inputClass } from '../components/ui'
import { Waveform } from '../components/Waveform'
import { addComment, deleteComment, useComments, useMe, useTrack, useTracks, useUsers } from '../db/api'
import { ME } from '../db/schema'
import { formatAgo, formatCount, formatTime } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'

export const Route = createFileRoute('/track/$trackId')({ component: TrackPage })

function TrackPage() {
  const { trackId } = Route.useParams()
  const track = useTrack(trackId)
  const all = useTracks()
  const users = useUsers()
  const comments = useComments(trackId)
  const current = usePlayer((s) => s.trackId === trackId)
  const playing = usePlayer((s) => s.trackId === trackId && s.playing)
  const loading = usePlayer((s) => s.trackId === trackId && s.loading)
  const position = usePlayer((s) => (s.trackId === trackId ? s.position : 0))

  if (track === undefined) {
    return all.length && !all.some((t) => t.id === trackId) ? <NotFound /> : null
  }
  const artist = users.get(track.userId)
  const related = all
    .filter((t) => t.id !== track.id && (t.genre === track.genre || t.userId === track.userId))
    .slice(0, 5)
  const seek = (s: number) => {
    if (!current) usePlayer.getState().playTrack(track.id)
    usePlayer.getState().seek(s)
  }

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <Cover cover={track.cover} className="size-40 rounded-[20px] shadow-cover sm:size-[200px]" />
        <div className="flex min-w-0 grow flex-col gap-3.5">
          <div className="overline">{m.track_kicker({ genre: genreLabel(track.genre) })}</div>
          <h1 className="display-tight text-4xl font-semibold text-balance lg:text-5xl">{track.title}</h1>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] text-fg-2">
            <Avatar user={artist} size={26} />
            <ArtistLink user={artist} className="font-semibold text-fg" />
            <span>·</span>
            <span>{formatAgo(track.createdAt)}</span>
            <span>·</span>
            <span>{m.plays({ count: formatCount(track.plays) })}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => usePlayer.getState().playTrack(track.id)}
              aria-label={playing ? m.pause() : m.play()}
              className={clsx(btn.base, btn.primary, 'size-14')}
            >
              {loading ? (
                <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Icon name={playing ? 'pause' : 'play'} size={22} />
              )}
            </button>
            <LikeButton track={track} />
            <RepostButton track={track} />
            <ShareButton track={track} />
            <TrackMenu track={track} />
            <div className="flex flex-wrap gap-2 text-[13px] text-fg-2 xl:ml-auto">
              {track.tags.map((tag) => (
                <Link
                  key={tag}
                  to="/search"
                  search={{ q: tag }}
                  className="rounded-full border border-line px-3 py-1.5 hover:text-fg"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Waveform
        peaks={track.peaks}
        bars={190}
        duration={track.duration}
        position={position}
        height={96}
        labels
        playhead={current}
        onSeek={seek}
        comments={comments}
        users={users}
      />

      {track.description && (
        <p className="max-w-3xl text-[15px] text-pretty text-fg-2">{track.description}</p>
      )}

      <section className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Comments trackId={track.id} position={current ? position : 0} onSeek={seek} />
        <div className="flex flex-col gap-2">
          <h2 className="mb-1 text-lg font-semibold">{m.similar_tracks()}</h2>
          {related.map((t) => (
            <TrackRow key={t.id} track={t} queue={related.map((r) => r.id)} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Comments({
  trackId,
  position,
  onSeek,
}: {
  trackId: string
  position: number
  onSeek: (s: number) => void
}) {
  const comments = useComments(trackId)
  const users = useUsers()
  const me = useMe()
  const [text, setText] = useState('')
  const sorted = [...comments].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">
        {m.comments()} <span className="font-normal text-fg-3">{comments.length}</span>
      </h2>
      <form
        className="flex items-center gap-3"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!text.trim()) return
          await addComment(trackId, position, text)
          setText('')
        }}
      >
        <Avatar user={me} size={36} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={m.comment_at({ time: formatTime(position) })}
          maxLength={300}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className={clsx(btn.base, btn.primary, 'h-11 px-4 text-sm')}
        >
          {m.comment_send()}
        </button>
      </form>
      {sorted.length === 0 && <p className="text-[15px] text-fg-3">{m.comment_empty()}</p>}
      {sorted.map((c) => {
        const author = users.get(c.userId)
        return (
          <div key={c.id} className="group flex gap-3">
            <Link to="/artist/$userId" params={{ userId: c.userId }}>
              <Avatar user={author} size={36} />
            </Link>
            <div className="flex min-w-0 grow flex-col gap-1">
              <div className="flex items-center gap-2 text-[13px] text-fg-3">
                <ArtistLink user={author} className="text-sm font-semibold text-fg" />
                <button
                  type="button"
                  onClick={() => onSeek(c.at)}
                  className="rounded-md bg-accent-soft px-[7px] py-px font-semibold text-accent-fg hover:brightness-110"
                >
                  {formatTime(c.at)}
                </button>
                <span>{formatAgo(c.createdAt)}</span>
              </div>
              <p className="text-[15px] leading-[1.45] text-pretty break-words text-fg-2">{c.text}</p>
            </div>
            {c.userId === ME && (
              <button
                type="button"
                aria-label={m.delete()}
                onClick={() => deleteComment(c.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg-3 opacity-0 group-hover:opacity-100 hover:bg-raised hover:text-fg focus-visible:opacity-100"
              >
                <Icon name="trash" size={16} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
