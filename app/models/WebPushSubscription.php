<?php

class WebPushSubscription extends Eloquent
{
	protected $table = 'web_push_subscriptions';
	public $timestamps = false;
	protected $fillable = array('walker_id', 'endpoint', 'p256dh', 'auth_key', 'created_at');
}
