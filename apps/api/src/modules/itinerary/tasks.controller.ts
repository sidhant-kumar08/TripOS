import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dtos/task.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('tasks')
@Controller('trips/:tripId/tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a task' })
  async createTask(
    @Param('tripId') tripId: string,
    @Req() req: any,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(tripId, req.user.sub, dto);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tasks (all or assigned to me)' })
  async listTasks(
    @Param('tripId') tripId: string,
    @Req() req: any,
    @Query('assignedToMe') assignedToMe?: boolean,
  ) {
    if (assignedToMe) {
      return this.tasksService.listTasksByAssignee(tripId, req.user.sub);
    }
    return this.tasksService.listTasksByTrip(tripId, req.user.sub);
  }

  @Get(':taskId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get task details' })
  async getTask(
    @Param('tripId') tripId: string,
    @Param('taskId') taskId: string,
    @Req() req: any,
  ) {
    return this.tasksService.getTask(tripId, taskId, req.user.sub);
  }

  @Put(':taskId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a task' })
  async updateTask(
    @Param('tripId') tripId: string,
    @Param('taskId') taskId: string,
    @Req() req: any,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(tripId, taskId, req.user.sub, dto);
  }

  @Delete(':taskId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(
    @Param('tripId') tripId: string,
    @Param('taskId') taskId: string,
    @Req() req: any,
  ) {
    return this.tasksService.deleteTask(tripId, taskId, req.user.sub);
  }
}
