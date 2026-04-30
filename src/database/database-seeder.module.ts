import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllowedDomain } from './entities/allowed-domain.entity';
import { Role } from './entities/role.entity';
import { Department } from './entities/department.entity';
import { DatabaseSeederService } from './database-seeder.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AllowedDomain, Role, Department])],
  providers: [DatabaseSeederService],
  exports: [DatabaseSeederService],
})
export class DatabaseSeederModule {}
