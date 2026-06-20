-- Tabela para Web Push dos motoristas PWA
CREATE TABLE IF NOT EXISTS `web_push_subscriptions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `walker_id` int(10) unsigned NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth_key` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `walker_id` (`walker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
