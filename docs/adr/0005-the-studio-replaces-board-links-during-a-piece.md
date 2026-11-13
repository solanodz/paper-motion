# While a piece is open, the studio replaces board links

Boards ([ADR 0004](./0004-boards-keep-state-in-a-key-value-store.md)) were the way the agent showed a visual choice:
a link to the site, one per decision. Once pieces got a local studio, a user making one piece went back and forth
between two places: board links for palette, type, backgrounds and moves, and the studio for everything else. On a
real piece the user asked for one screen that follows the steps, with every choice made there.

So, while a piece is open and its studio is running, `pamo board` puts the options into the studio, on the step they
belong to, instead of making a link. The command still waits for the choice and prints the same reply line, built
with the same `replyLine`, so skills and agents need no change. The studio is the only address the user opens.

Boards on the site stay. They are for when no piece is open, for an agent without a local studio (the MCP server, a
browser agent), and for sharing a choice with someone else (`--link` forces one).

Consequences:

- The board's options and the user's choice live in `pieces/<piece>/piece.json` (`choices`), not in the site's
  key-value store, so nothing about a piece leaves the user's machine.
- The studio must render every kind of board inline: resources (palette, font pair, background, moves), kits (split
  into their parts) and structures.
- Studio choices have no 90-day expiry. They live as long as the piece.
