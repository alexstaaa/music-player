import { Menu } from '@base-ui/react/menu'
import { useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import { toast } from 'sonner'
import { addToPlaylist, deleteTrack, removeFromPlaylist, usePlaylists } from '../db/api'
import { ME, type Track } from '../db/schema'
import { copyTrackLink } from '../lib/share'
import { m } from '../paraglide/messages.js'
import { usePlayer } from '../stores/player'
import { useUi } from '../stores/ui'
import { Icon } from './Icon'
import { MenuContent, menuItem, menuPopup } from './overlay'
import { btn } from './ui'

export function TrackMenu({
  track,
  playlistId,
  size = 'md',
}: {
  track: Track
  /** When rendered inside an own playlist, offers "remove from playlist". */
  playlistId?: string
  size?: 'sm' | 'md'
}) {
  const navigate = useNavigate()
  const playlists = usePlaylists(ME)
  const openNewPlaylist = useUi((s) => s.openNewPlaylist)

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={m.more()}
        className={clsx(
          btn.base,
          size === 'md' ? 'size-10 bg-raised' : 'size-8 text-fg-2 hover:bg-raised hover:text-fg',
        )}
      >
        <Icon name="more" size={18} />
      </Menu.Trigger>
      <MenuContent>
        <Menu.Item
          className={menuItem}
          onClick={() => {
            usePlayer.getState().playNext(track.id)
            toast(m.added_to_queue())
          }}
        >
          <Icon name="next" size={18} /> {m.play_next()}
        </Menu.Item>
        <Menu.Item
          className={menuItem}
          onClick={() => {
            usePlayer.getState().addToQueue(track.id)
            toast(m.added_to_queue())
          }}
        >
          <Icon name="queue" size={18} /> {m.add_to_queue()}
        </Menu.Item>
        <Menu.SubmenuRoot>
          <Menu.SubmenuTrigger className={menuItem}>
            <Icon name="plus" size={18} /> <span className="grow">{m.add_to_playlist()}</span>
            <Icon name="chevronRight" size={16} />
          </Menu.SubmenuTrigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={4} className="z-50">
              <Menu.Popup className={menuPopup}>
                <Menu.Item className={menuItem} onClick={() => openNewPlaylist(track.id)}>
                  <Icon name="plus" size={18} /> {m.new_playlist()}
                </Menu.Item>
                {playlists.length > 0 && <Menu.Separator className="mx-2 my-1 h-px bg-line" />}
                {playlists.map((p) => (
                  <Menu.Item
                    key={p.id}
                    className={menuItem}
                    onClick={async () => {
                      const added = await addToPlaylist(p.id, track.id)
                      toast(
                        added
                          ? m.added_to_playlist({ name: p.name })
                          : m.already_in_playlist({ name: p.name }),
                      )
                    }}
                  >
                    <Icon name="library" size={18} /> <span className="truncate">{p.name}</span>
                  </Menu.Item>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.SubmenuRoot>
        <Menu.Separator className="mx-2 my-1 h-px bg-line" />
        <Menu.Item
          className={menuItem}
          onClick={() => navigate({ to: '/artist/$userId', params: { userId: track.userId } })}
        >
          <Icon name="user" size={18} /> {m.go_to_artist()}
        </Menu.Item>
        <Menu.Item className={menuItem} onClick={() => copyTrackLink(track.id)}>
          <Icon name="link" size={18} /> {m.copy_link()}
        </Menu.Item>
        {playlistId && (
          <Menu.Item className={menuItem} onClick={() => removeFromPlaylist(playlistId, track.id)}>
            <Icon name="minus" size={18} /> {m.remove_from_playlist()}
          </Menu.Item>
        )}
        {track.userId === ME && (
          <Menu.Item
            className={clsx(menuItem, 'text-[oklch(0.65_0.2_25)]')}
            onClick={async () => {
              if (!window.confirm(m.confirm_delete())) return
              const { trackId, next, queue } = usePlayer.getState()
              if (trackId === track.id) queue.length > 1 ? next() : usePlayer.setState({ trackId: null })
              usePlayer.getState().removeFromQueue(track.id)
              await deleteTrack(track.id)
              toast(m.track_deleted())
            }}
          >
            <Icon name="trash" size={18} /> {m.delete_track()}
          </Menu.Item>
        )}
      </MenuContent>
    </Menu.Root>
  )
}
