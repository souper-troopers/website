import {useCallback, useState} from 'react'
import {Box, Button, Card, Container, Flex, Spinner, Stack, Text} from '@sanity/ui'
// Per-icon subpath, not the package root. @sanity/icons v5 turned the barrel into a lazy registry
// that no longer re-exports the components, while its .d.ts still declares every name — so a root
// import typechecks cleanly and then fails at build with "Missing export".
import {RocketIcon} from '@sanity/icons/Rocket'

/**
 * "Publish site" — a button in the Studio that starts a rebuild of the public website.
 *
 * Context: the site is static, so editing content here does not change what visitors see until the
 * site is rebuilt. Auto-rebuilding on every save was deliberately turned off (it spends a paid
 * production deploy per keystroke-level save), which makes publishing a conscious step — and this
 * is that step, put where the person doing the editing already is.
 *
 * It calls a Netlify Function rather than the build hook directly. See the long note in
 * `netlify/functions/trigger-deploy.mts` for why: the hook URL is an unauthenticated credential,
 * and this bundle is served publicly even though the content behind it needs a login.
 */

/**
 * Points at the deployed site's function, not at the Studio's own origin — these are two different
 * hosts. **Update this at launch**, alongside the other Netlify-preview-URL items in AGENTS.md.
 */
const TRIGGER_URL = 'https://souper-troopers.netlify.app/.netlify/functions/trigger-deploy'

type Status =
  | {state: 'idle'}
  | {state: 'publishing'}
  | {state: 'done'}
  | {state: 'error'; message: string}

export function PublishTool() {
  const [status, setStatus] = useState<Status>({state: 'idle'})

  const publish = useCallback(async () => {
    setStatus({state: 'publishing'})
    try {
      const response = await fetch(TRIGGER_URL, {method: 'POST'})
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStatus({
          state: 'error',
          message: body?.error ?? `Something went wrong (${response.status}).`,
        })
        return
      }
      setStatus({state: 'done'})
    } catch {
      setStatus({
        state: 'error',
        message: "Couldn't reach the website to start publishing. Check your connection and try again.",
      })
    }
  }, [])

  return (
    <Container width={1} paddingX={4} paddingY={5}>
      <Stack space={5}>
        <Stack space={3}>
          <Text size={3} weight="bold">
            Publish your changes
          </Text>
          <Text size={1} muted>
            Anything you edit here is saved straight away, but the public website is only rebuilt
            when you ask for it. Make all your changes first, then press the button once — it puts
            everything live together.
          </Text>
        </Stack>

        <Card padding={4} radius={3} shadow={1} tone="transparent">
          <Stack space={4}>
            <Flex align="center" gap={3}>
              <Button
                icon={RocketIcon}
                text={status.state === 'publishing' ? 'Starting…' : 'Publish to the website'}
                tone="primary"
                disabled={status.state === 'publishing'}
                onClick={publish}
              />
              {status.state === 'publishing' && <Spinner muted />}
            </Flex>

            {status.state === 'done' && (
              <Card padding={3} radius={2} tone="positive">
                <Text size={1}>
                  Publishing has started. It usually takes a couple of minutes — refresh the website
                  after that to see your changes. You can close this page; it will carry on without
                  you.
                </Text>
              </Card>
            )}

            {status.state === 'error' && (
              <Card padding={3} radius={2} tone="critical">
                <Text size={1}>{status.message}</Text>
              </Card>
            )}
          </Stack>
        </Card>

        <Box>
          <Text size={1} muted>
            Nothing is lost if you forget — your edits stay saved here, and the next publish picks
            them all up.
          </Text>
        </Box>
      </Stack>
    </Container>
  )
}
