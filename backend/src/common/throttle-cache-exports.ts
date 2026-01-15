import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

export { ThrottlerModule, ThrottlerGuard, CacheModule, redisStore };
