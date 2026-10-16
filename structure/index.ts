import {CaseIcon} from '@sanity/icons/Case'
import {ComposeIcon} from '@sanity/icons/Compose'
import {DocumentIcon} from '@sanity/icons/Document'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {ImagesIcon} from '@sanity/icons/Images'
import {UsersIcon} from '@sanity/icons/Users'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import type {StructureResolver} from 'sanity/structure'
import {contentGroups, contentKinds, mainPages} from './content-groups.mjs'

const groupIcons: Record<string, typeof DocumentIcon> = {
  'main-pages': DocumentIcon,
  articles: ComposeIcon,
  projects: ImagesIcon,
  services: CaseIcon,
}

const mainPageIcons: Record<string, typeof DocumentIcon> = {
  'page-about': UsersIcon,
  'page-contact': EnvelopeIcon,
  'page-services': CaseIcon,
  'page-portfolio': ImagesIcon,
  'page-blog': ComposeIcon,
  'page-privacy': DocumentIcon,
}

// Keep initialValueTemplates last on each pane; later builder calls can re-infer all templates.
export const structure: StructureResolver = (S) =>
  S.list()
    .id('website-content')
    .title('Website Content')
    .items([
      S.listItem()
        .id('main-pages')
        .title('Main Pages')
        .icon(DocumentIcon)
        .child(
          S.list()
            .id('main-pages')
            .title('Main Pages')
            .items(
              mainPages.map((page) => S.listItem().singleton(page.id).icon(mainPageIcons[page.id])),
            ),
        ),
      ...contentGroups.slice(1).map((group) =>
        S.listItem()
          .id(group.id)
          .title(group.title)
          .icon(groupIcons[group.id])
          .child(
            S.documentTypeList('contentPage')
              .id(group.id)
              .title(group.title)
              .apiVersion('2026-02-01')
              .filter('_type == "contentPage" && kind in $kinds')
              .params({kinds: group.kinds})
              .defaultOrdering([{field: 'path', direction: 'asc'}])
              .canHandleIntent(
                (intent, {template}) =>
                  intent === 'create' && group.templates.includes(template ?? ''),
              )
              .initialValueTemplates(
                group.templates.map((template) => S.initialValueTemplateItem(template)),
              ),
          ),
      ),
      S.divider(),
      // Keep incomplete or imported noncanonical main pages reachable for manual cleanup.
      S.listItem()
        .id('unclassified-pages')
        .title('Unclassified')
        .icon(WarningOutlineIcon)
        .child(
          S.documentTypeList('contentPage')
            .id('unclassified-pages')
            .title('Unclassified')
            .apiVersion('2026-02-01')
            .filter(
              '_type == "contentPage" && !(string::split(_id, ".")[-1] in $mainPageIds) && (!defined(kind) || !(kind in $kinds) || kind in $mainKinds || path in $mainPaths)',
            )
            .params({
              kinds: contentKinds,
              mainKinds: contentGroups[0].kinds,
              mainPaths: mainPages.map((page) => page.path),
              mainPageIds: mainPages.map((page) => page.documentId),
            })
            .canHandleIntent(() => false)
            .initialValueTemplates([]),
        ),
      ...S.documentTypeListItems().filter((item) => item.getId() !== 'contentPage'),
    ])
