import { createFileRoute, useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { computePeaks, decodeFile } from '../audio/buffers'
import { Icon } from '../components/Icon'
import { btn, Cover, GENRES, genreLabel, inputClass, PageTitle } from '../components/ui'
import { Waveform } from '../components/Waveform'
import { uploadTrack } from '../db/api'
import type { Genre } from '../db/schema'
import { formatTime } from '../lib/format'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'

export const Route = createFileRoute('/upload')({ component: UploadPage })

const MAX_BYTES = 50 * 1024 * 1024
const randomCover = (): [number, number] => {
  const h = Math.floor(Math.random() * 360)
  return [h, (h + 60 + Math.floor(Math.random() * 120)) % 360]
}

type Decoded = { file: File; duration: number; peaks: number[] }

function UploadPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<'idle' | 'decoding' | 'error'>('idle')
  const [error, setError] = useState('')
  const [decoded, setDecoded] = useState<Decoded | null>(null)
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState<Genre>('electronic')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [cover, setCover] = useState<[number, number]>(randomCover)
  const [saving, setSaving] = useState(false)

  const accept = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_BYTES) {
      setStatus('error')
      setError(m.upload_too_big())
      return
    }
    setStatus('decoding')
    try {
      const buffer = await decodeFile(file)
      setDecoded({ file, duration: buffer.duration, peaks: computePeaks(buffer) })
      setTitle((t) => t || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
      setStatus('idle')
    } catch {
      setStatus('error')
      setError(m.upload_error())
    }
  }

  if (!decoded) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle>{m.upload_title()}</PageTitle>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            accept(e.dataTransfer.files[0])
          }}
          className={clsx(
            'flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 text-center transition-colors',
            dragging ? 'border-accent-fg bg-accent-soft' : 'border-line hover:border-fg-3',
          )}
        >
          {status === 'decoding' ? (
            <>
              <span className="size-8 animate-spin rounded-full border-[3px] border-accent-fg border-t-transparent" />
              <span className="text-fg-2">{m.upload_decoding()}</span>
            </>
          ) : (
            <>
              <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-fg">
                <Icon name="music" size={30} />
              </span>
              <span className="font-display text-xl font-semibold">{m.upload_drop()}</span>
              <span className="text-sm text-fg-3">{m.upload_or()}</span>
              <span className={clsx(btn.base, btn.primary, btn.md)}>{m.upload_choose()}</span>
              <span className="text-[13px] text-fg-3">{m.upload_formats()}</span>
              {status === 'error' && (
                <span className="text-sm font-medium text-[oklch(0.65_0.2_25)]">{error}</span>
              )}
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => {
            accept(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-7"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!title.trim() || saving) return
        setSaving(true)
        const id = await uploadTrack({
          file: decoded.file,
          title,
          genre,
          description,
          tags: tags
            .split(',')
            .map((t) => t.trim().replace(/^#/, ''))
            .filter(Boolean),
          cover,
          duration: decoded.duration,
          peaks: decoded.peaks,
        })
        toast.success(m.published())
        usePlayer.getState().playTrack(id)
        navigate({ to: '/track/$trackId', params: { trackId: id } })
      }}
    >
      <PageTitle>{m.upload_title()}</PageTitle>
      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-panel p-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 font-medium">
            <Icon name="music" size={18} className="text-accent-fg" />
            <span className="truncate">{decoded.file.name}</span>
            <span className="shrink-0 text-fg-3">{formatTime(decoded.duration)}</span>
          </span>
          <button
            type="button"
            onClick={() => setDecoded(null)}
            className={clsx(btn.base, btn.ghost, btn.sm)}
          >
            {m.replace_file()}
          </button>
        </div>
        <Waveform peaks={decoded.peaks} bars={160} duration={decoded.duration} position={0} height={64} />
      </div>

      <div className="grid gap-8 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">{m.field_cover()}</span>
          <Cover cover={cover} className="aspect-square w-full rounded-3xl shadow-cover" />
          <button
            type="button"
            onClick={() => setCover(randomCover())}
            className={clsx(btn.base, btn.soft, btn.md)}
          >
            <Icon name="shuffle" size={18} /> {m.shuffle_cover()}
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {m.field_title()} *
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className={inputClass}
            />
          </label>
          <fieldset className="flex flex-col gap-2 text-sm font-medium">
            <legend className="mb-1.5">{m.field_genre()}</legend>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={genre === g}
                  onClick={() => setGenre(g)}
                  className={clsx(
                    'press h-9 rounded-full px-4 transition-colors',
                    genre === g ? 'bg-fg text-bg' : 'bg-raised text-fg-2 hover:text-fg',
                  )}
                >
                  {genreLabel(g)}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {m.field_tags()}
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ночь, synth"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {m.field_description()}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              className={clsx(inputClass, 'h-auto py-3')}
            />
          </label>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className={clsx(btn.base, btn.primary, 'mt-2 h-12 self-start px-6 text-[15px]')}
          >
            <Icon name="upload" size={18} /> {m.publish()}
          </button>
        </div>
      </div>
    </form>
  )
}
