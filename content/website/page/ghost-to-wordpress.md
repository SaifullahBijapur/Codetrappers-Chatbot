---
title: Ghost to WordPress Migration
url: https://codetrappers.com/ghost-to-wordpress/
access: public
type: page
---

# Moving from Ghost to WordPress

Posts move cleanly through the JSON export. Members, Stripe subscriptions and the Handlebars theme do not, so we plan those three before quoting.

Ghost has a clean JSON export, so the writing is the easy part. Members, paid subscriptions and the theme are the project, and they are the three things the export does not carry.

Before anyone quotes

## What survives the move, and what does not

Most migration disputes come from this list being assumed rather than agreed. So we agree it first.

### Comes across

-   Posts and pages, through the JSON export
-   Tags, authors and publish dates
-   Excerpts, feature images and canonical URLs
-   Post URLs, which are flat on both sides

### Gets rebuilt

-   The theme, because Handlebars templates have no WordPress equivalent
-   Members, tiers and the Stripe connection behind them
-   Newsletters, and whatever was sending them
-   Custom routing from routes.yaml, and any collections it defines

The expensive surprises

## Three things specific to Ghost

### A members export is a list, not a billing relationship

The CSV gives you email addresses and tiers. The subscriptions behind them sit in Stripe attached to the Ghost integration, so they have to be re-mapped onto the new accounts deliberately. On a paid publication that is the migration, not a detail of it.

### The JSON does not contain your images

The export is content only. Image files live separately and the JSON refers to them by path, so importing the JSON on its own produces posts full of broken images. Files move first, then the references get rewritten.

### Ghost cards are not HTML

Posts are stored as structured documents, so bookmarks, galleries, toggles and embeds are cards rather than markup. A naive import flattens them into plain paragraphs or drops them entirely. Each card type gets mapped to a block instead.

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

## Leaving Ghost, answered

Something not covered here? Ask us directly and an engineer will answer.

[Ask a question](https://codetrappers.com/contact/)

From Ghost we can bring over: posts and pages, through the JSON export; tags, authors and publish dates; excerpts, feature images and canonical URLs; post URLs, which are flat on both sides. Everything else on the site has to be rebuilt, and we agree which is which before quoting.

The parts with no equivalent on the other side: the theme, because Handlebars templates have no WordPress equivalent; members, tiers and the Stripe connection behind them; newsletters, and whatever was sending them; custom routing from routes.yaml, and any collections it defines. This is where the cost sits, so it is priced up front rather than discovered halfway through.

Not if the redirects are done properly. We crawl every URL that is currently indexed, map each one to its new address, and test those as 301s on staging before anything points at production. Then we watch crawl errors and traffic for the fortnight after cutover.

The CSV gives you email addresses and tiers. The subscriptions behind them sit in Stripe attached to the Ghost integration, so they have to be re-mapped onto the new accounts deliberately. On a paid publication that is the migration, not a detail of it.

The export is content only. Image files live separately and the JSON refers to them by path, so importing the JSON on its own produces posts full of broken images. Files move first, then the references get rewritten.

Start here

## Send us the Ghost site

We will crawl it, work out what the export actually gives us, and come back with a fixed price and the redirect map included.

[Get a migration quote](https://codetrappers.com/contact/) [Book a consultation](https://cal.com/yusuf-mudagal-6abk5h/30min)

-   A free audit first

    We'll look at your site and tell you straight what needs doing.

-   Fixed scope, fixed price

    Agreed in writing before any work starts. No hidden fees.

-   A real engineer on the call

    You talk to the people who do the work, not a sales script.
