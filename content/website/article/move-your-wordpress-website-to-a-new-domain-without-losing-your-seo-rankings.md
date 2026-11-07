---
title: Move Your WordPress Website To A New Domain Without Losing Your SEO Rankings
url: https://codetrappers.com/move-your-wordpress-website-to-a-new-domain-without-losing-your-seo-rankings/
access: public
type: article
---

# Move Your WordPress Website To A New Domain Without Losing Your SEO Rankings

Yusuf Mudagal 29 Dec 2022 Updated 7 Aug 2026 3 min read

Moving your WordPress website to a new domain can be a daunting task, especially if you’re worried about losing your hard-earned SEO rankings in the process. At CodeTrappers, we understand how important it is to maintain your search engine visibility, which is why we’ve put together this guide to help you seamlessly transition your website to a new domain without losing any ground in the search results.

## Step 1: Backup Your Website

Before you start making any changes to your website, it’s important to create a full backup of your site. This will ensure that you have a copy of your website to fall back on in case something goes wrong during the [migration](https://codetrappers.com/migration-for-wordpress/) process. There are several WordPress plugins that can help you create a full backup of your site, including UpdraftPlus and BackupBuddy. Simply install and activate the plugin, and then follow the prompts to create a full backup of your website.

## Step 2: Set Up Redirection on Your Old Domain

Once you’ve backed up your website, the next step is to set up redirection on your old domain. This will ensure that any incoming traffic to your old domain is automatically redirected to your new domain. To set up redirection, you’ll need to access your .htaccess file. This file is located in the root directory of your website, and can be accessed using an FTP client such as FileZilla.

Once you’ve accessed your .htaccess file, add the following code to redirect all traffic to your new domain:

```
RewriteEngine on
RewriteRule (.*) http://www.newdomain.com/$1 [R=301,L]
```

Be sure to replace “newdomain.com” with your actual new domain name. This code will redirect all traffic to your new domain, including traffic to specific pages or posts on your old website.

## Step 3: Update Your WordPress Settings

Next, you’ll need to update your WordPress settings to reflect your new domain name. To do this, log in to your WordPress dashboard and navigate to Settings > General. Here, you’ll see two fields labeled “WordPress Address (URL)” and “Site Address (URL)”. Simply update these fields with your new domain name, and then click “Save Changes”.

## Step 4: Update Your Permalinks

Permalinks are the permanent URLs for your individual pages and posts. If you don’t update your permalinks when moving to a new domain, you’ll end up with broken links and a poor user experience. To update your permalinks, log in to your WordPress dashboard and navigate to Settings > Permalinks. Here, you’ll see several options for customizing your permalinks. Simply select the option that you want to use, and then click “Save Changes”.

## Step 5: Update Your Internal Links

Finally, you’ll need to update any internal links on your website to reflect your new domain name. This includes links to pages and posts within your own site, as well as links to any media files such as images or videos. You can use a plugin such as Velvet Blues Update URLs to automate this process, or you can manually update the links by editing the HTML code of your website.

By following these steps, you can successfully move your WordPress website to a new domain without losing your SEO rankings. At CodeTrappers, we’re here to help you every step of the way, so if you have any questions or need assistance with the migration process, don’t hesitate to reach out to us.

Yusuf Mudagal

Founder, CodeTrappers

-   [Yusuf Mudagal on LinkedIn](https://www.linkedin.com/in/yusuf-mudagal/)
-   [Yusuf Mudagal on X](https://x.com/YusufMudagal)
-   [Yusuf Mudagal on GitHub](https://github.com/yusufhay)
-   [Yusuf Mudagal on WordPress.org profile](https://profiles.wordpress.org/yusufmudagal/)
-   [Yusuf Mudagal on Email](mailto:yusuf@codetrappers.com)

[Read 132 other articles by this author](https://codetrappers.com/author/yusuf-mudagal/)
