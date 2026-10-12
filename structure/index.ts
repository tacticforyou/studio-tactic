import {CaseIcon} from '@sanity/icons/Case'
import {ComposeIcon} from '@sanity/icons/Compose'
import {DocumentIcon} from '@sanity/icons/Document'
import {ImagesIcon} from '@sanity/icons/Images'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import type {StructureResolver} from 'sanity/structure'
import {contentGroups, contentKinds} from './content-groups.mjs'

const groupIcons: Record<string, typeof DocumentIcon> = {
  'main-pages': DocumentIcon,
  articles: ComposeIcon,
  projects: ImagesIcon,
  services: CaseIcon,
}

// Keep initialValueTemplates last on each pane; later builder calls can re-infer all templates.
export const structure: StructureResolver = (S) =>
  S.list()
    .id('website-content')
    .title('Website Content')
    .items([
      ...contentGroups.map((group) =>
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
      // Keep incomplete drafts reachable without mixing them into the editorial sections.
      S.listItem()
        .id('unclassified-pages')
        .title('Unclassified')
        .icon(WarningOutlineIcon)
        .child(
          S.documentTypeList('contentPage')
            .id('unclassified-pages')
            .title('Unclassified')
            .apiVersion('2026-02-01')
            .filter('_type == "contentPage" && (!defined(kind) || !(kind in $kinds))')
            .params({kinds: contentKinds})
            .canHandleIntent(() => false)
            .initialValueTemplates([]),
        ),
      ...S.documentTypeListItems().filter((item) => item.getId() !== 'contentPage'),
    ])
