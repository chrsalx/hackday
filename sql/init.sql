CREATE TABLE `hackday`.`tasks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(500) NOT NULL,
  `created_by` VARCHAR(50) NULL,
  `created_at` BIGINT NULL,
  `updated_at` BIGINT NULL,
  `done_at` BIGINT NULL,
  PRIMARY KEY (`id`));
