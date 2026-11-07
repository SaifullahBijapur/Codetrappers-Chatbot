---
title: WordPress Developer’s Intro To Docker, Part Two
url: https://codetrappers.com/wordpress-developers-intro-to-docker-part-two/
access: public
type: article
---

# WordPress Developer’s Intro To Docker, Part Two

Yusuf Mudagal 30 Dec 2022 3 min read

Welcome to the second part of our series on introducing Docker to WordPress developers! In this article, we’ll be focusing on how to set up Docker for [WordPress development](https://codetrappers.com/development-for-wordpress/).

If you’re new to Docker, you might want to check out our first article in this series, which provides a brief overview of what Docker is and why it’s useful for WordPress development.

Before we begin, it’s important to note that in order to follow along with this tutorial, you’ll need to have Docker installed on your machine. If you don’t already have it installed, you can download it from the Docker website.

Once you have Docker installed, the first thing you’ll need to do is create a Docker Compose file. This file is used to define the services that make up your application, and it tells Docker how to build and run your application.

To create a Docker Compose file for WordPress, you’ll need to create a new file called `docker-compose.yml` in the root directory of your WordPress project. In this file, you’ll need to define the following services:

-   A database service, which will be used to store your WordPress data. We recommend using MySQL or MariaDB for this.
-   A web service, which will be used to run the WordPress application itself. We recommend using Apache or Nginx for this.

```
version: '3'
services:
  db:
    image: mysql:5.7
    volumes:
      - db_data:/var/lib/mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress

  wordpress:
    depends_on:
      - db
    image: wordpress:latest
    ports:
      - "8080:80"
    restart: always
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
volumes:
  db_data:
```

Here’s an example of a basic Docker Compose file for WordPress:

In this example, we’re using MySQL as our database service and WordPress as our web service. We’re also defining a volume called `db_data` to store the data for our database. This will allow us to persist our data even if we stop and start the container.

Once you have your Docker Compose file set up, you can build and run your WordPress application using the following command:

```
docker-compose up -d
```

This command will build and start all of the services defined in your Docker Compose file. You can then visit your WordPress site by going to `http://localhost:8080` in your web browser.

That’s it! You now have a fully functional WordPress site running in Docker. In the next article in this series, we’ll be covering more advanced topics, such as how to set up a development environment using Docker.

We hope this article has been helpful for you as a WordPress developer looking to get started with Docker. If you have any questions or need further guidance, don’t hesitate to reach out to the team at CodeTrappers. We’re always happy to help!

Yusuf Mudagal

Founder, CodeTrappers

-   [Yusuf Mudagal on LinkedIn](https://www.linkedin.com/in/yusuf-mudagal/)
-   [Yusuf Mudagal on X](https://x.com/YusufMudagal)
-   [Yusuf Mudagal on GitHub](https://github.com/yusufhay)
-   [Yusuf Mudagal on WordPress.org profile](https://profiles.wordpress.org/yusufmudagal/)
-   [Yusuf Mudagal on Email](mailto:yusuf@codetrappers.com)

[Read 132 other articles by this author](https://codetrappers.com/author/yusuf-mudagal/)
