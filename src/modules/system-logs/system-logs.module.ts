import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemLogsService } from './system-logs.service';
import { SystemLogsController } from './system-logs.controller';
import { SystemLog } from '../../database/entities/system-log.entity';
import { User } from '../../database/entities/user.entity';

@Global() // 🔥 Cực kỳ quan trọng: Giúp mày gọi log ở bất kỳ service nào mà không cần import module này
@Module({
  imports: [TypeOrmModule.forFeature([SystemLog, User])],
  controllers: [SystemLogsController],
  providers: [SystemLogsService],
  exports: [SystemLogsService], // Export để các module khác xài
})
export class SystemLogsModule {}
