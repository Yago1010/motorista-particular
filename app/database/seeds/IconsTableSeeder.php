<?php

// Composer: "fzaninotto/faker": "v1.3.0"
use Faker\Factory as Faker;

class IconsTableSeeder extends Seeder {

	public function run()
	{
		Icons::create(array('id' => 1,'icon_name' => 'Road','icon_code' => '&#xf018;','icon_type' => 'fa' ));
		Icons::create(array('id' => 2,'icon_name' => 'Star','icon_code' => '&#xf005;','icon_type' => 'fa' ));
		Icons::create(array('id' => 3,'icon_name' => 'Remove','icon_code' => '&#xf00d;','icon_type' => 'fa' ));
		Icons::create(array('id' => 4,'icon_name' => 'Ok','icon_code' => '&#xf00c;','icon_type' => 'fa' ));
		Icons::create(array('id' => 5,'icon_name' => 'Money','icon_code' => '&#xf0d6;','icon_type' => 'fa' ));
		Icons::create(array('id' => 6,'icon_name' => 'Credit Card','icon_code' => '&#xf09d;','icon_type' => 'fa' ));
		Icons::create(array('id' => 7,'icon_name' => 'Inbox','icon_code' => '&#xf01c;','icon_type' => 'fa' ));
		Icons::create(array('id' => 8,'icon_name' => 'Flag','icon_code' => '&#xf024;','icon_type' => 'fa' ));
		Icons::create(array('id' => 9,'icon_name' => 'Plus','icon_code' => '&#xf067;','icon_type' => 'fa' ));
		Icons::create(array('id' => 10,'icon_name' => 'Minus','icon_code' => '&#xf068;','icon_type' => 'fa' ));
		Icons::create(array('id' => 11,'icon_name' => 'Thumbs Up','icon_code' => '&#xf087;','icon_type' => 'fa' ));
		Icons::create(array('id' => 12,'icon_name' => 'Smile','icon_code' => '&#xf118;','icon_type' => 'fa' ));

	}

}