---
title: Drupal to WordPress Migration
url: https://codetrappers.com/drupal-to-wordpress/
access: public
type: page
---

# Moving from Drupal to WordPress

Nodes, taxonomy, users and custom fields mapped deliberately rather than guessed. Views rewritten as WP_Query, path aliases turned into redirects.

Structurally the closest of these moves: both are PHP content systems with real data models. The work is field mapping, and getting it wrong is expensive to undo later.

Before anyone quotes

## What survives the move, and what does not

Most migration disputes come from this list being assumed rather than agreed. So we agree it first.

### Comes across

-   Nodes, mapped to posts, pages or custom post types
-   Taxonomy terms and their hierarchy
-   User accounts and roles
-   Files, and the custom fields attached to them

### Gets rebuilt

-   Views, rewritten as WP\_Query
-   Panels and any layout builder configuration
-   Custom and contributed modules
-   Access rules beyond what roles cover

The expensive surprises

## Three things specific to Drupal

### Field mapping is the project

A Drupal content type with twenty fields has to become a post type with twenty pieces of meta, and every one is a decision. Mapped on a spreadsheet first, signed off, then written.

### Path aliases need a real redirect map

Drupal aliases rarely match any WordPress permalink structure. The alias table becomes the redirect table, generated rather than hand-written.

### Multilingual works differently

Drupal handles translations natively; WordPress needs a plugin, and which one you pick constrains the next five years. Chosen up front, not at the end.

How it runs

## Five steps, same every time

1.  1

    ### Crawl what is live

    Every URL currently indexed, exported to a sheet. This becomes the redirect map and the definition of done.

2.  2

    ### Audit the export

    What the platform gives us, compared against what the crawl found. The difference is the rebuild, and it gets priced before we start.

3.  3

    ### Build on staging

    The new site goes up somewhere private, with real content imported, so you review the actual thing rather than a mockup.

4.  4

    ### Map every redirect

    Old URL to new URL, one row at a time, tested as 301s on staging before anything points at production.

5.  5

    ### Cut over and watch

    DNS moves, then we monitor crawl errors and traffic for the fortnight that follows, because that is when problems surface.

Before you commit

## Leaving Drupal, answered

Something not covered here? Ask us directly and an engineer will answer.

[Ask a question](https://codetrappers.com/contact/)

From Drupal we can bring over: nodes, mapped to posts, pages or custom post types; taxonomy terms and their hierarchy; user accounts and roles; files, and the custom fields attached to them. Everything else on the site has to be rebuilt, and we agree which is which before quoting.

The parts with no equivalent on the other side: views, rewritten as WP\_Query; panels and any layout builder configuration; custom and contributed modules; access rules beyond what roles cover. This is where the cost sits, so it is priced up front rather than discovered halfway through.

Not if the redirects are done properly. We crawl every URL that is currently indexed, map each one to its new address, and test those as 301s on staging before anything points at production. Then we watch crawl errors and traffic for the fortnight after cutover.

A Drupal content type with twenty fields has to become a post type with twenty pieces of meta, and every one is a decision. Mapped on a spreadsheet first, signed off, then written.

Drupal aliases rarely match any WordPress permalink structure. The alias table becomes the redirect table, generated rather than hand-written.

Start here

## Send us the Drupal site

We will crawl it, work out what the export actually gives us, and come back with a fixed price and the redirect map included.

[Get a migration quote](https://codetrappers.com/contact/) [Book a consultation](https://cal.com/yusuf-mudagal-6abk5h/30min)

-   A free audit first

    We'll look at your site and tell you straight what needs doing.

-   Fixed scope, fixed price

    Agreed in writing before any work starts. No hidden fees.

-   A real engineer on the call

    You talk to the people who do the work, not a sales script.
