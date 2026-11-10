/**
 * Ordering screens straight from the map (basket → `/orders/new?placements=`).
 *
 * OFF since 2026-10-31: the business model for placement orders is still being
 * decided, so the map only shows the screens and their owners' public contacts
 * and the client reaches the owner directly. The whole flow (selection store,
 * basket bar, form steps, `placements[]` payload) stays in the codebase behind
 * this flag — flip it (and `PLACEMENTS_ORDERING_ENABLED` on the backend) to
 * bring it back.
 */
export const PLACEMENT_ORDERING_ENABLED = false

/**
 * Price calculator: pick priced screens on the map → `/map/calculator` (clip
 * length × days from the owners' rate cards). Independent of ordering — the
 * client still closes the deal with the owner directly.
 */
export const PLACEMENT_CALCULATOR_ENABLED = true

/** The map's selection basket is shared by both flows. */
export const PLACEMENT_SELECTION_ENABLED = PLACEMENT_ORDERING_ENABLED || PLACEMENT_CALCULATOR_ENABLED
