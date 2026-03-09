import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagementPosition } from '../../database/entities/management-position.entity';
import { ManagementPositionController } from './management-position.controller';
import { ManagementPositionService } from './management-position.service';

@Module({
    imports: [TypeOrmModule.forFeature([ManagementPosition])],
    controllers: [ManagementPositionController],
    providers: [ManagementPositionService],
    exports: [ManagementPositionService],
})
export class ManagementPositionModule { }
