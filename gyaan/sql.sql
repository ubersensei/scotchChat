DROP DATABASE IF EXISTS scotch;

CREATE DATABASE IF NOT EXISTS scotch CHARACTER SET utf8;
USE scotch;

SET time_zone = "+08:00";

CREATE TABLE IF NOT EXISTS `users` (
    `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(150) DEFAULT NULL,
    `password` VARCHAR(140) DEFAULT NULL,

    `fb_id` VARCHAR(140) DEFAULT NULL,
    `fb_token` VARCHAR(340) DEFAULT NULL,
    `fb_name` VARCHAR(140) DEFAULT NULL,
    `fb_email` VARCHAR(140) DEFAULT NULL,

    PRIMARY KEY (id)
);


INSERT INTO `users` (email) values ('magnus');
INSERT INTO `users` (email) values ('levon');
INSERT INTO `users` (email) values ('anand');

select * from users;



