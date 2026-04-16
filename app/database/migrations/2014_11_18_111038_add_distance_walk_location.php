<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddDistanceWalkLocation extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::table('walk_location', function(Blueprint $table)
		{
			$table->float('distance',8,3);
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::table('walk_location', function(Blueprint $table)
		{
			$table->dropColumn('distance');
		});
	}

}
