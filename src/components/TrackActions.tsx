import clsx from 'clsx'
import { toggleFollow, toggleLike, toggleRepost, useIsFollowing, useIsLiked, useIsReposted } from '../db/api'
import { ME, type Track } from '../db/schema'
import { formatCount } from '../lib/format'
import { copyTrackLink } from '../lib/share'
import { m } from '../paraglide/messages.js'
import { Icon } from './Icon'
import { btn } from './ui'

export function LikeButton({
  track,
  variant = 'pill',
}: {
  track: Track
  variant?: 'pill' | 'outline' | 'icon'
}) {
  const liked = useIsLiked(track.id)
  const label = m.like()
  const onClick = () => toggleLike(track.id)
  if (variant === 'icon') {
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={liked}
        onClick={onClick}
        className={clsx(btn.base, 'size-9', liked ? 'text-accent-fg' : 'text-fg-2 hover:text-fg')}
      >
        <Icon name={liked ? 'heartFilled' : 'heart'} size={18} />
      </button>
    )
  }
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={liked}
      onClick={onClick}
      className={clsx(
        btn.base,
        variant === 'pill' ? 'h-10 pr-4 pl-3 text-sm' : 'h-[30px] border pr-3 pl-2.5 text-[13px] font-medium',
        liked
          ? 'border-transparent bg-accent-soft text-accent-fg'
          : variant === 'pill'
            ? 'bg-raised text-fg'
            : 'border-line text-fg-2 hover:text-fg',
      )}
    >
      <Icon name={liked ? 'heartFilled' : 'heart'} size={variant === 'pill' ? 18 : 15} />
      {formatCount(track.likes)}
    </button>
  )
}

export function RepostButton({ track, variant = 'pill' }: { track: Track; variant?: 'pill' | 'outline' }) {
  const reposted = useIsReposted(track.id)
  if (track.userId === ME) return null
  return (
    <button
      type="button"
      aria-label={m.repost()}
      aria-pressed={reposted}
      onClick={() => toggleRepost(track.id)}
      className={clsx(
        btn.base,
        variant === 'pill' ? 'h-10 pr-4 pl-3 text-sm' : 'h-[30px] border pr-3 pl-2.5 text-[13px] font-medium',
        reposted
          ? 'border-transparent bg-accent-soft text-accent-fg'
          : variant === 'pill'
            ? 'bg-raised text-fg'
            : 'border-line text-fg-2 hover:text-fg',
      )}
    >
      <Icon name="repeat" size={variant === 'pill' ? 18 : 15} />
      {formatCount(track.reposts)}
    </button>
  )
}

export function ShareButton({ track }: { track: Track }) {
  return (
    <button
      type="button"
      onClick={() => copyTrackLink(track.id)}
      className={clsx(btn.base, btn.soft, 'h-10 pr-4 pl-3 text-sm')}
    >
      <Icon name="share" size={18} />
      <span className="max-sm:sr-only">{m.share()}</span>
    </button>
  )
}

export function FollowButton({ userId, size = 'sm' }: { userId: string; size?: 'sm' | 'md' }) {
  const following = useIsFollowing(userId)
  if (userId === ME) return null
  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={() => toggleFollow(userId)}
      className={clsx(
        btn.base,
        size === 'sm' ? btn.sm : btn.md,
        following ? 'bg-raised text-fg-2' : btn.solid,
      )}
    >
      {following ? m.following() : m.follow()}
    </button>
  )
}
