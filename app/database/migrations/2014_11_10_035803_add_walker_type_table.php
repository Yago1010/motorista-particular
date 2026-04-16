<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddWalkerTypeTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('walker_type', function(Blueprint $table)
		{
			$table->increments('id');
			$table->string('name');
			$table->integer('is_default');
			$table->float('price_per_unit_distance');
			$table->float('price_per_unit_time');
			$table->float('base_price');
			$table->timestamps();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('walker_type');
	}

}
