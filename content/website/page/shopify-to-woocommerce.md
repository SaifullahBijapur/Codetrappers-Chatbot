---
title: Shopify to WooCommerce Migration
url: https://codetrappers.com/shopify-to-woocommerce/
access: public
type: page
---

# Moving from Shopify to WooCommerce

Products, customers and order history move cleanly. The theme, the apps and the payment setup do not. We plan for all three before starting.

Products, customers and order history all export cleanly. The theme, the apps and the payment setup do not, and that is where the real work sits.

Before anyone quotes

## What survives the move, and what does not

Most migration disputes come from this list being assumed rather than agreed. So we agree it first.

### Comes across

-   Products, variants and collections
-   Customer records and order history
-   Blog posts and pages
-   Product images and alt text

### Gets rebuilt

-   The storefront: Liquid templates do not convert
-   Checkout, shipping rules and tax configuration
-   Every installed app, and the data inside it
-   Discount and promotion logic

The expensive surprises

## Three things specific to Shopify

### Saved cards cannot come with you

Payment tokens are tied to the gateway account. Subscription and repeat customers have to re-enter cards, so that has to be planned and communicated, not sprung on them.

### Apps rarely map one to one

Every Shopify app needs a WooCommerce equivalent found, or the behaviour built. Subscriptions, bundles and loyalty are the usual expensive three.

### The URL structure is fixed on Shopify

Shopify forces /products/ and /collections/. WooCommerce does not have to match, but if it does not, every one of those needs a redirect.

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

## Leaving Shopify, answered

Something not covered here? Ask us directly and an engineer will answer.

[Ask a question](https://codetrappers.com/contact/)

From Shopify we can bring over: products, variants and collections; customer records and order history; blog posts and pages; product images and alt text. Everything else on the site has to be rebuilt, and we agree which is which before quoting.

The parts with no equivalent on the other side: the storefront: Liquid templates do not convert; checkout, shipping rules and tax configuration; every installed app, and the data inside it; discount and promotion logic. This is where the cost sits, so it is priced up front rather than discovered halfway through.

Not if the redirects are done properly. We crawl every URL that is currently indexed, map each one to its new address, and test those as 301s on staging before anything points at production. Then we watch crawl errors and traffic for the fortnight after cutover.

Payment tokens are tied to the gateway account. Subscription and repeat customers have to re-enter cards, so that has to be planned and communicated, not sprung on them.

Every Shopify app needs a WooCommerce equivalent found, or the behaviour built. Subscriptions, bundles and loyalty are the usual expensive three.

Start here

## Send us the Shopify site

We will crawl it, work out what the export actually gives us, and come back with a fixed price and the redirect map included.

[Get a migration quote](https://codetrappers.com/contact/) [Book a consultation](https://cal.com/yusuf-mudagal-6abk5h/30min)

-   A free audit first

    We'll look at your site and tell you straight what needs doing.

-   Fixed scope, fixed price

    Agreed in writing before any work starts. No hidden fees.

-   A real engineer on the call

    You talk to the people who do the work, not a sales script.
