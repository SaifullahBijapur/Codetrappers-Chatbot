---
title: Static HTML to WordPress Migration
url: https://codetrappers.com/static-html-to-wordpress/
access: public
type: page
---

# Moving from static HTML to WordPress

Nothing is locked away in a static site, but nothing defines a content model either. We decide what becomes a page, a post or a post type before building.

The easiest content to move and the hardest to model. Nothing is locked away, but nothing tells you what a page is either, so the work is deciding what becomes a page, a post or a post type.

Before anyone quotes

## What survives the move, and what does not

Most migration disputes come from this list being assumed rather than agreed. So we agree it first.

### Comes across

-   Every piece of copy and every image, since they are only files
-   The existing URL structure, which can be kept exactly
-   The design, because the CSS is hand-written and real
-   Page titles, meta descriptions and any schema already in the markup

### Gets rebuilt

-   Navigation, which becomes a menu instead of repeated markup
-   Forms, which need somewhere to send to
-   Anything repeated across pages, which becomes a template
-   Whatever the JavaScript was doing by hand

The expensive surprises

## Three things specific to static HTML

### The .html endings are a decision, not a detail

WordPress permalinks do not end in .html. You either configure it to keep them or redirect every address on the site, and the choice affects every link anyone has ever shared or printed. It gets made before the build rather than discovered at cutover.

### There is no content model to inherit

A static site has no notion of a post type or a field. Deciding what becomes a page, what becomes a post and what earns a custom post type is the actual work, and getting it wrong means the people who have to edit it afterwards cannot.

### Pages that look identical rarely are

Hand-written HTML drifts. Twenty pages that appear to share a layout usually carry twenty small differences in markup, so one template is a guess until every page has been diffed against the others.

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

## Leaving static HTML, answered

Something not covered here? Ask us directly and an engineer will answer.

[Ask a question](https://codetrappers.com/contact/)

From static HTML we can bring over: every piece of copy and every image, since they are only files; the existing URL structure, which can be kept exactly; the design, because the CSS is hand-written and real; page titles, meta descriptions and any schema already in the markup. Everything else on the site has to be rebuilt, and we agree which is which before quoting.

The parts with no equivalent on the other side: navigation, which becomes a menu instead of repeated markup; forms, which need somewhere to send to; anything repeated across pages, which becomes a template; whatever the JavaScript was doing by hand. This is where the cost sits, so it is priced up front rather than discovered halfway through.

Not if the redirects are done properly. We crawl every URL that is currently indexed, map each one to its new address, and test those as 301s on staging before anything points at production. Then we watch crawl errors and traffic for the fortnight after cutover.

WordPress permalinks do not end in .html. You either configure it to keep them or redirect every address on the site, and the choice affects every link anyone has ever shared or printed. It gets made before the build rather than discovered at cutover.

A static site has no notion of a post type or a field. Deciding what becomes a page, what becomes a post and what earns a custom post type is the actual work, and getting it wrong means the people who have to edit it afterwards cannot.

Start here

## Send us the static HTML site

We will crawl it, work out what the export actually gives us, and come back with a fixed price and the redirect map included.

[Get a migration quote](https://codetrappers.com/contact/) [Book a consultation](https://cal.com/yusuf-mudagal-6abk5h/30min)

-   A free audit first

    We'll look at your site and tell you straight what needs doing.

-   Fixed scope, fixed price

    Agreed in writing before any work starts. No hidden fees.

-   A real engineer on the call

    You talk to the people who do the work, not a sales script.
