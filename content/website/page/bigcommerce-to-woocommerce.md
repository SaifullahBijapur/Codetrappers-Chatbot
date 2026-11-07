---
title: BigCommerce to WooCommerce Migration
url: https://codetrappers.com/bigcommerce-to-woocommerce/
access: public
type: page
---

# Moving from BigCommerce to WooCommerce

Catalogue, customers and orders export well. Modifiers, price lists and customer-group pricing have no core WooCommerce equivalent, so we map them before importing.

The catalogue, the customers and the order history all export. The pricing logic does not: modifiers, price lists and customer groups are BigCommerce concepts that WooCommerce has no core equivalent for.

Before anyone quotes

## What survives the move, and what does not

Most migration disputes come from this list being assumed rather than agreed. So we agree it first.

### Comes across

-   Products and variants, through the catalogue export
-   The category tree and its nesting
-   Customer accounts and addresses
-   Order history, and any blog posts

### Gets rebuilt

-   The Stencil theme, which is Handlebars and does not convert
-   Checkout, shipping zones and tax rules
-   Anything installed from the BigCommerce app marketplace
-   Price lists, customer groups and B2B pricing

The expensive surprises

## Three things specific to BigCommerce

### Modifiers and variants are not the same thing

BigCommerce splits product options in two: variants, which carry their own SKU, and modifiers, which change the price without creating one. WooCommerce only has the first. Every modifier becomes either a variation or an add-on field, and that choice changes how the catalogue is managed for years afterwards.

### Price lists have no core equivalent

Customer-group pricing is built into BigCommerce and is a plugin decision in WooCommerce. On a B2B catalogue it is a functional requirement rather than a nicety, so the plugin gets chosen and tested against your real price bands before the import, not after.

### Your existing redirects have to come too

Most stores of any age carry years of 301s in the built-in redirect manager. Those get exported alongside the crawl, or you inherit a fresh URL map and quietly drop every redirect that was already holding old links together.

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

## Leaving BigCommerce, answered

Something not covered here? Ask us directly and an engineer will answer.

[Ask a question](https://codetrappers.com/contact/)

From BigCommerce we can bring over: products and variants, through the catalogue export; the category tree and its nesting; customer accounts and addresses; order history, and any blog posts. Everything else on the site has to be rebuilt, and we agree which is which before quoting.

The parts with no equivalent on the other side: the Stencil theme, which is Handlebars and does not convert; checkout, shipping zones and tax rules; anything installed from the BigCommerce app marketplace; price lists, customer groups and B2B pricing. This is where the cost sits, so it is priced up front rather than discovered halfway through.

Not if the redirects are done properly. We crawl every URL that is currently indexed, map each one to its new address, and test those as 301s on staging before anything points at production. Then we watch crawl errors and traffic for the fortnight after cutover.

BigCommerce splits product options in two: variants, which carry their own SKU, and modifiers, which change the price without creating one. WooCommerce only has the first. Every modifier becomes either a variation or an add-on field, and that choice changes how the catalogue is managed for years afterwards.

Customer-group pricing is built into BigCommerce and is a plugin decision in WooCommerce. On a B2B catalogue it is a functional requirement rather than a nicety, so the plugin gets chosen and tested against your real price bands before the import, not after.

Start here

## Send us the BigCommerce site

We will crawl it, work out what the export actually gives us, and come back with a fixed price and the redirect map included.

[Get a migration quote](https://codetrappers.com/contact/) [Book a consultation](https://cal.com/yusuf-mudagal-6abk5h/30min)

-   A free audit first

    We'll look at your site and tell you straight what needs doing.

-   Fixed scope, fixed price

    Agreed in writing before any work starts. No hidden fees.

-   A real engineer on the call

    You talk to the people who do the work, not a sales script.
