---
title: Complete Guide to Creating a Custom WordPress Categories Template (2023)
url: https://codetrappers.com/complete-guide-to-creating-a-custom-wordpress-categories-template-2023/
access: public
type: article
---

# Complete Guide to Creating a Custom WordPress Categories Template (2023)

Yusuf Mudagal 22 Dec 2022 Updated 10 Sep 2026 3 min read

Welcome to our complete guide on creating a custom WordPress categories template using CodeTrappers!

Creating a custom categories template allows you to fully customize the way your categories are displayed on your WordPress site. This can be especially useful if you want to give each category its own unique look and feel, or if you want to display additional information or functionality within your categories.

Here’s a step-by-step guide on how to create a custom WordPress categories template using CodeTrappers:

1.  First, create a new file in your WordPress theme called “category.php”. This will be the template that controls the display of your categories.
2.  Next, open the category.php file and add the following code at the top:

```
<?php
/*
Template Name: Category Template
*/

get_header();

// Add your custom code here

get_footer();
```

This code tells WordPress to use this template for all category pages and includes the header and footer of your theme.

3.  Now it’s time to add your custom code. To display the name of the current category, you can use the following code:

```
<h1><?php single_cat_title(); ?></h1>
```

This will display the name of the current category at the top of the page.

4.  You can also display a list of all the posts in the current category using the following code:

```
<?php
if ( have_posts() ) :
  while ( have_posts() ) : the_post();
    the_title('<h2>','</h2>');
    the_excerpt();
  endwhile;
endif;
?>
```

This will loop through all the posts in the current category and display their titles and excerpts.

5.  To display the number of posts in the current category, you can use the following code:

```
<p>Number of posts in this category: <?php echo $wp_query->found_posts; ?></p>
```

This will display the number of posts in the current category.

6.  You can also customize the way your categories are displayed by adding custom CSS to your theme’s stylesheet. For example, if you want to change the background color of your categories, you can add the following code to your stylesheet:

```
.category {
  background-color: #f0f0f0;
}
```

This will change the background color of all your categories to light gray.

7.  Save your changes and preview your custom categories template on your WordPress site. If you’re satisfied with the way it looks, you’re all set! If you want to make further customizations, simply edit the category.php file and refresh the page to see your changes.

We hope this guide has helped you create a custom WordPress categories template using CodeTrappers. Happy coding!

Yusuf Mudagal

Founder, CodeTrappers

-   [Yusuf Mudagal on LinkedIn](https://www.linkedin.com/in/yusuf-mudagal/)
-   [Yusuf Mudagal on X](https://x.com/YusufMudagal)
-   [Yusuf Mudagal on GitHub](https://github.com/yusufhay)
-   [Yusuf Mudagal on WordPress.org profile](https://profiles.wordpress.org/yusufmudagal/)
-   [Yusuf Mudagal on Email](mailto:yusuf@codetrappers.com)

[Read 132 other articles by this author](https://codetrappers.com/author/yusuf-mudagal/)
