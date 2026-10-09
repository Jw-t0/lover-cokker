# Invite Card Redesign

## Goal

Make the invite page feel like a focused, shareable invitation and remove the conflicting refusal action when the invite creator opens their own link.

## Visual Design

Replace the envelope, decorative table strip, and emoji-heavy presentation with one warm-white invitation card on a pale background. The card uses a thin rose border, a small heart seal, restrained warm-pink accents, and generous whitespace.

The content order is: small product label, creator avatar and name, invitation heading, benefit summary, expiry, and the state-specific action area.

## States

When the invite creator opens the page, show a short forwarding instruction and a single `转发给 TA` share action. Do not render `暂不接受`.

When someone else opens the page, show `接受邀请` and the secondary `暂不接受` action. Existing acceptance, navigation, expiry formatting, and sharing paths remain unchanged.

## Implementation

Update only the invite page WXML and WXSS. The existing `selfInvite` flag already supplies the state boundary, so no service, cloud-function, or data-model changes are needed.

## Verification

Extend the invite UI test to assert the creator and recipient action branches. Run the full Node test suite after the change.
