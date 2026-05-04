import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Family Ties'

interface InvitationProps {
  fullName?: string
  inviteUrl?: string
  expiresAt?: string
}

const InvitationEmail = ({ fullName, inviteUrl, expiresAt }: InvitationProps) => {
  const url = inviteUrl || 'https://familyties.info'
  const expiry = expiresAt ? new Date(expiresAt).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) : null

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You've been invited to {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {fullName ? `${fullName}, you're invited` : "You're invited"}
          </Heading>
          <Text style={text}>
            You've been invited to join <strong>{SITE_NAME}</strong> — a private brotherhood
            for young South African men committed to growth, accountability, and lasting connection.
          </Text>
          <Text style={text}>
            Membership starts with a short interview to make sure it's the right fit for you and the brothers already in.
          </Text>
          <Section style={buttonContainer}>
            <Button href={url} style={button}>
              Accept your invitation
            </Button>
          </Section>
          <Text style={smallText}>
            Or copy and paste this link: <br />
            <span style={link}>{url}</span>
          </Text>
          {expiry && (
            <Text style={smallText}>
              This invitation expires on <strong>{expiry}</strong>.
            </Text>
          )}
          <Text style={footer}>— The {SITE_NAME} Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: InvitationEmail,
  subject: "You've been invited to Family Ties",
  displayName: 'Member invitation',
  previewData: {
    fullName: 'Sipho Dlamini',
    inviteUrl: 'https://familyties.info/invite/sample-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const buttonContainer = { margin: '32px 0', textAlign: 'center' as const }
const button = {
  backgroundColor: '#1512D3',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  padding: '14px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
}
const smallText = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 12px' }
const link = { color: '#1512D3', wordBreak: 'break-all' as const }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '32px 0 0' }