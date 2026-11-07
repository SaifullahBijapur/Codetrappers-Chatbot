---
title: Webflow to WordPress Migration
url: https://codetrappers.com/webflow-to-wordpress/
access: public
type: page
---

# Moving from Webflow to WordPress

Webflow exports a CSV of your CMS and a static snapshot of the design, never a working site. We rebuild the theme properly and keep every URL pointing where it should.

Webflow hands over a CSV of each CMS collection and a static snapshot of the design. Neither of those is a working site, which is why the export is something to read from rather than something to ship.

Before anyone quotes

## What survives the move, and what does not

Most migration disputes come from this list being assumed rather than agreed. So we agree it first.

### Comes across

-   CMS collection items, through the per-collection CSV export
-   Page copy and the images embedded in it
-   SEO titles, meta descriptions and Open Graph fields
-   The URL structure, which usually maps across unchanged

### Gets rebuilt

-   The theme: the exported CSS is machine-authored, not maintainable
-   Interactions and scroll animations, which ship as Webflow JavaScript
-   Forms, and the submissions Webflow was storing on your behalf
-   Ecommerce, Memberships, Logic and anything from the Apps panel

The expensive surprises

## Three things specific to Webflow

### The static export is a dead end

The HTML export is generated markup with generated class names and no CMS behind it. Shipping that as your theme means keeping Webflow output forever without the Webflow editor to change it. The design gets rebuilt properly, with the export as the reference.

### Reference fields export as IDs

A collection CSV writes reference and multi-reference fields as Webflow item IDs rather than names, so every relationship has to be rebuilt by joining the exports back together. Skip that and a blog arrives as a pile of posts belonging to no category.

### Assets stay on the Webflow CDN

Images in exported content still point at the Webflow asset domain. They keep working right up until the plan lapses, and then every image on the site disappears on the same day. Each file gets pulled local and relinked before launch.

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

## Leaving Webflow, answered

Something not covered here? Ask us directly and an engineer will answer.

[Ask a question](https://codetrappers.com/contact/)

From Webflow we can bring over: CMS collection items, through the per-collection CSV export; page copy and the images embedded in it; SEO titles, meta descriptions and Open Graph fields; the URL structure, which usually maps across unchanged. Everything else on the site has to be rebuilt, and we agree which is which before quoting.

The parts with no equivalent on the other side: the theme: the exported CSS is machine-authored, not maintainable; interactions and scroll animations, which ship as Webflow JavaScript; forms, and the submissions Webflow was storing on your behalf; ecommerce, Memberships, Logic and anything from the Apps panel. This is where the cost sits, so it is priced up front rather than discovered halfway through.

Not if the redirects are done properly. We crawl every URL that is currently indexed, map each one to its new address, and test those as 301s on staging before anything points at production. Then we watch crawl errors and traffic for the fortnight after cutover.

The HTML export is generated markup with generated class names and no CMS behind it. Shipping that as your theme means keeping Webflow output forever without the Webflow editor to change it. The design gets rebuilt properly, with the export as the reference.

A collection CSV writes reference and multi-reference fields as Webflow item IDs rather than names, so every relationship has to be rebuilt by joining the exports back together. Skip that and a blog arrives as a pile of posts belonging to no category.

Start here

## Send us the Webflow site

We will crawl it, work out what the export actually gives us, and come back with a fixed price and the redirect map included.

[Get a migration quote](https://codetrappers.com/contact/) [Book a consultation](https://cal.com/yusuf-mudagal-6abk5h/30min)

-   A free audit first

    We'll look at your site and tell you straight what needs doing.

-   Fixed scope, fixed price

    Agreed in writing before any work starts. No hidden fees.

-   A real engineer on the call

    You talk to the people who do the work, not a sales script.
