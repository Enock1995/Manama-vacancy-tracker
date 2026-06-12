<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AlertService;

class AutoExpireTc extends Command
{
    protected $signature   = 'tc:auto-expire';
    protected $description = 'Automatically mark TC statuses as Expired where expiry date has passed';

    public function handle(): void
    {
        $count = AlertService::autoExpireTc();
        $this->info("Auto-expired {$count} TC record(s).");
    }
}