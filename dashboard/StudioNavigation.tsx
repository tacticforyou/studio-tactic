import {createContext, useContext, type ComponentProps} from 'react'
import type {LayoutProps} from 'sanity'
import {IntentLink, Link, useRouter, type RouterContextValue} from 'sanity/router'
import {getMainPage} from '../structure/content-groups.mjs'
import {structureLink} from './overview-data'

const ResolveStudioPath = createContext<RouterContextValue['resolvePathFromState'] | null>(null)

// Tools scope their own routers; resolve cross-tool links above that scope.
export function DashboardRoutingLayout(props: LayoutProps) {
  const {resolvePathFromState} = useRouter()
  return (
    <ResolveStudioPath.Provider value={resolvePathFromState}>
      {props.renderDefault(props)}
    </ResolveStudioPath.Provider>
  )
}

export function ContentSectionLink({
  groupId,
  itemId,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & {groupId?: string; itemId?: string}) {
  const resolvePath = useContext(ResolveStudioPath)
  if (!resolvePath) throw new Error('ContentSectionLink requires DashboardRoutingLayout')
  return <Link {...props} href={resolvePath(structureLink(groupId, itemId))} />
}

export function ContentDocumentLink({
  documentId,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & {documentId: string}) {
  const mainPage = getMainPage(documentId)
  return mainPage ? (
    <ContentSectionLink {...props} groupId="main-pages" itemId={mainPage.id} />
  ) : (
    <IntentLink {...props} intent="edit" params={{id: documentId, type: 'contentPage'}} />
  )
}
