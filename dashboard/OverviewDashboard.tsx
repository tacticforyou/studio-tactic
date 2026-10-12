import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {ArrowTopRightIcon} from '@sanity/icons/ArrowTopRight'
import {CaseIcon} from '@sanity/icons/Case'
import {ComposeIcon} from '@sanity/icons/Compose'
import {DocumentIcon} from '@sanity/icons/Document'
import {ImagesIcon} from '@sanity/icons/Images'
import {RefreshIcon} from '@sanity/icons/Refresh'
import {Badge, Box, Button, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'
import {contentGroups, contentTemplates, mainPages} from '../structure/content-groups.mjs'
import {
  documentGroup,
  documentStatus,
  overviewParams,
  overviewQuery,
  publishedQuery,
  type OverviewData,
  type PublishedData,
} from './overview-data'
import {ContentDocumentLink, ContentSectionLink} from './StudioNavigation'

const groupIcons: Record<string, typeof DocumentIcon> = {
  'main-pages': DocumentIcon,
  articles: ComposeIcon,
  projects: ImagesIcon,
  services: CaseIcon,
}

const Page = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 8px 40px;
  box-sizing: border-box;
  letter-spacing: 0;

  @media (max-width: 600px) {
    padding: 8px 0 24px;
  }
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 32px;
`

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 420px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
`

const Summary = styled(ContentSectionLink)`
  display: block;
  padding: 20px;
  border: 1px solid var(--card-border-color);
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  min-width: 0;

  &:hover {
    border-color: currentColor;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }
`

const Count = styled.div`
  font-size: 32px;
  line-height: 1.2;
  font-weight: 600;
  margin: 20px 0 12px;
  font-variant-numeric: tabular-nums;
`

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.65fr);
  gap: 48px;
  margin-top: 40px;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
  }
`

const ContentLink = styled(ContentDocumentLink)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--card-border-color);
  color: inherit;
  text-decoration: none;
  min-width: 0;

  &:hover [data-title] {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }
`

const RowText = styled.div`
  min-width: 0;
  flex: 1;

  span {
    overflow-wrap: anywhere;
  }
`

const RowMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 8px;
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
`

function Status({label}: {label: string}) {
  return (
    <Badge
      tone={label === 'Approved' ? 'positive' : label === 'Draft' ? 'caution' : 'default'}
      fontSize={0}
    >
      {label}
    </Badge>
  )
}

function updatedDate(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return ''
  return new Intl.DateTimeFormat(undefined, {month: 'short', day: 'numeric'}).format(
    new Date(value),
  )
}

export function OverviewDashboard() {
  const baseClient = useClient({apiVersion: '2026-02-01'})
  const client = useMemo(() => baseClient.withConfig({useCdn: false}), [baseClient])
  const [data, setData] = useState<OverviewData | null>(null)
  const [published, setPublished] = useState<PublishedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)

    Promise.all([
      client.fetch<OverviewData>(overviewQuery, overviewParams, {
        perspective: 'drafts',
        signal: controller.signal,
      }),
      client.fetch<PublishedData>(publishedQuery, overviewParams, {
        perspective: 'published',
        signal: controller.signal,
      }),
    ])
      .then(([overview, publishedSnapshot]) => {
        if (controller.signal.aborted) return
        setData(overview)
        setPublished(publishedSnapshot)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [client, refresh])

  return (
    <Page aria-label="Content overview" aria-busy={loading}>
      <Header>
        <Stack gap={4}>
          <Text size={1} muted>
            Tactic Studio
          </Text>
          <Heading as="h1" size={3}>
            Overview
          </Heading>
        </Stack>
        <Flex align="center" gap={2}>
          <Tooltip
            content={
              <Box padding={2}>
                <Text size={1}>Refresh content</Text>
              </Box>
            }
          >
            <Button
              aria-label="Refresh content"
              icon={RefreshIcon}
              mode="bleed"
              disabled={loading}
              onClick={() => setRefresh((value) => value + 1)}
            />
          </Tooltip>
          <Button
            as="a"
            href="https://tacticforyou.com"
            target="_blank"
            rel="noopener noreferrer"
            text="Visit website"
            iconRight={ArrowTopRightIcon}
            mode="ghost"
          />
        </Flex>
      </Header>

      {error && (
        <Card tone="caution" padding={3} marginBottom={4} radius={2} role="alert">
          <Text size={1}>
            {data
              ? 'Could not refresh content. Showing the last loaded overview.'
              : 'Could not load content. Check your connection and try refreshing.'}
          </Text>
        </Card>
      )}

      <SummaryGrid>
        {contentGroups.map((group) => {
          const counts = data?.groups.find(({id}) => id === group.id)
          const approved = published?.groups.find(({id}) => id === group.id)?.approved
          const Icon = groupIcons[group.id]
          return (
            <Summary
              key={group.id}
              as={ContentSectionLink}
              groupId={group.id}
              aria-label={`Open ${group.title}`}
            >
              <Flex justify="space-between" align="center" gap={3}>
                <Flex align="center" gap={2}>
                  <Icon aria-hidden />
                  <Text size={1} weight="medium">
                    {group.title}
                  </Text>
                </Flex>
                <ArrowRightIcon aria-hidden />
              </Flex>
              <Count>{counts?.total ?? '-'}</Count>
              <Text size={1} muted>
                {counts
                  ? `${approved ?? 0} approved, ${counts.drafts} drafts`
                  : loading
                    ? 'Loading content...'
                    : 'Counts unavailable'}
              </Text>
            </Summary>
          )
        })}
      </SummaryGrid>

      <ActionRow aria-label="Create content">
        {contentTemplates.map((template) => (
          <Button
            key={template.id}
            as={IntentLink}
            intent="create"
            params={{type: 'contentPage', template: template.id}}
            text={`New ${template.title.toLowerCase()}`}
            icon={
              groupIcons[contentGroups.find((group) => group.templates.includes(template.id))!.id]
            }
            mode="ghost"
          />
        ))}
      </ActionRow>

      <DetailGrid>
        <section aria-labelledby="main-pages-heading">
          <Heading as="h2" id="main-pages-heading" size={1}>
            Main Pages
          </Heading>
          <Box marginTop={3}>
            {mainPages.map((page) => {
              const document = data?.mainPages.find(({_id}) => _id === page.documentId)
              const approved = published?.mainPageIds.includes(page.documentId)
              return (
                <ContentLink key={page.id} documentId={page.documentId}>
                  <RowText>
                    <Stack gap={3}>
                      <Text size={1} weight="medium" data-title>
                        {page.title}
                      </Text>
                      <Text size={1} muted>
                        {page.path}
                      </Text>
                    </Stack>
                  </RowText>
                  <RowMeta>
                    <Status
                      label={
                        data
                          ? approved
                            ? 'Approved'
                            : document
                              ? 'Not approved'
                              : 'Not created'
                          : '-'
                      }
                    />
                    {documentStatus(document) === 'Draft' && (
                      <Text size={0} muted>
                        Draft changes
                      </Text>
                    )}
                  </RowMeta>
                </ContentLink>
              )
            })}
          </Box>
        </section>

        <section aria-labelledby="recent-heading">
          <Flex align="center" justify="space-between" gap={3}>
            <Heading as="h2" id="recent-heading" size={1}>
              Recently Edited
            </Heading>
            <Text size={0} muted>
              Last updated
            </Text>
          </Flex>
          <Box marginTop={3}>
            {!data ? (
              <Box paddingY={4} role="status">
                <Text size={1} muted>
                  {loading ? 'Loading recent edits...' : 'Recent edits unavailable'}
                </Text>
              </Box>
            ) : data.recent.length === 0 ? (
              <Box paddingY={4}>
                <Text size={1} muted>
                  No content yet
                </Text>
              </Box>
            ) : (
              data.recent.map((document) => (
                <ContentLink key={document._id} documentId={document._id}>
                  <RowText>
                    <Stack gap={3}>
                      <Text size={1} weight="medium" data-title>
                        {document.title || 'Untitled page'}
                      </Text>
                      <Text size={1} muted>
                        {documentGroup(document)}
                        {document.path ? ` ${document.path}` : ''}
                      </Text>
                    </Stack>
                  </RowText>
                  <RowMeta>
                    <Status label={documentStatus(document)} />
                    <Text size={0} muted>
                      {updatedDate(document._updatedAt)}
                    </Text>
                  </RowMeta>
                </ContentLink>
              ))
            )}
          </Box>
        </section>
      </DetailGrid>

      {Boolean(data?.unclassified) && (
        <Box marginTop={5}>
          <Button
            as={ContentSectionLink}
            groupId="unclassified-pages"
            text={`Review unclassified content (${data?.unclassified})`}
            iconRight={ArrowRightIcon}
            tone="caution"
            mode="ghost"
          />
        </Box>
      )}
    </Page>
  )
}
