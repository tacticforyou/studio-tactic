// @ts-check
import speakingurl from 'speakingurl'
import {getMainPage} from '../structure/content-groups.mjs'

/** @param {{_id?: string, title?: unknown, kind?: unknown}} source */
export function generateContentPath({_id, title, kind}) {
  if (getMainPage(_id) || typeof title !== 'string' || !title.trim()) return undefined

  const prefix =
    kind === 'article'
      ? '/blog'
      : kind === 'project'
        ? '/portfolio'
        : kind === 'service'
          ? '/services'
          : undefined
  if (!prefix) return undefined

  const slug = speakingurl(title, {truncate: 200, symbols: true})
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined
  return `${prefix}/${slug}`
}
