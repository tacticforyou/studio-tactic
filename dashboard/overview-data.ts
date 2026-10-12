import {contentGroups, contentKinds, mainPages} from '../structure/content-groups.mjs'

export interface OverviewDocument {
  _id: string
  _originalId?: string
  title?: string
  path?: string
  kind?: string
  status?: string
  _updatedAt?: string
}

export interface OverviewData {
  groups: {id: string; total: number; drafts: number}[]
  mainPages: OverviewDocument[]
  recent: OverviewDocument[]
  unclassified: number
}

export interface PublishedData {
  groups: {id: string; approved: number}[]
  mainPageIds: string[]
}

export const overviewParams = {
  groups: contentGroups.map(({id, kinds}) => ({id, kinds})),
  mainPageIds: mainPages.map(({documentId}) => documentId),
  mainPaths: mainPages.map(({path}) => path),
  mainKinds: contentGroups[0].kinds,
  kinds: contentKinds,
}

// The drafts perspective merges draft/published pairs and normalizes their IDs.
export const overviewQuery = /* groq */ `{
  "groups": $groups[]{
    "id": id,
    "total": count(*[_type == "contentPage" && select(
      ^.id == "main-pages" => _id in $mainPageIds,
      kind in ^.kinds
    )]),
    "drafts": count(*[_type == "contentPage" && _originalId in path("drafts.**") && select(
      ^.id == "main-pages" => _id in $mainPageIds,
      kind in ^.kinds
    )])
  },
  "mainPages": *[_type == "contentPage" && _id in $mainPageIds]{
    _id, _originalId, title, path, kind, status
  },
  "recent": *[_type == "contentPage"] | order(_updatedAt desc, _id asc)[0...6]{
    _id, _originalId, title, path, kind, status, _updatedAt
  },
  "unclassified": count(*[_type == "contentPage" && !(_id in $mainPageIds) && (
    !defined(kind) || !(kind in $kinds) || kind in $mainKinds || path in $mainPaths
  )])
}`

// Approval describes the published snapshot, not website availability.
export const publishedQuery = /* groq */ `{
  "groups": $groups[]{
    "id": id,
    "approved": count(*[_type == "contentPage" && status == "published" && select(
      ^.id == "main-pages" => _id in $mainPageIds,
      kind in ^.kinds
    )])
  },
  "mainPageIds": *[_type == "contentPage" && _id in $mainPageIds && status == "published"]._id
}`

export function documentStatus(document: OverviewDocument | undefined) {
  if (!document) return 'Not created'
  if (document._originalId?.startsWith('drafts.')) return 'Draft'
  return document.status === 'published' ? 'Approved' : 'Not approved'
}

export function documentGroup(document: OverviewDocument) {
  if (mainPages.some(({documentId}) => documentId === document._id)) return 'Main Pages'
  return (
    contentGroups.slice(1).find(({kinds}) => kinds.includes(document.kind ?? ''))?.title ??
    'Unclassified'
  )
}

export function structureLink(groupId?: string, itemId?: string) {
  return {
    tool: 'structure',
    structure: groupId
      ? {panes: itemId ? [[{id: groupId}], [{id: itemId}]] : [[{id: groupId}]]}
      : undefined,
  }
}
