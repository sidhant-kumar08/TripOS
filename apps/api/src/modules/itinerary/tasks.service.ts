import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dtos/task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async createTask(tripId: string, userId: string, dto: CreateTaskDto) {
    await this.verifyTripMembership(tripId, userId);

    const task = await this.prisma.task.create({
      data: {
        tripId,
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        assignedTo: dto.assignedTo,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: 'OPEN',
      },
    });

    return this.formatTask(task);
  }

  async getTask(tripId: string, taskId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: true,
      },
    });

    if (!task || task.tripId !== tripId) {
      throw new NotFoundException('Task not found');
    }

    return this.formatTask(task);
  }

  async listTasksByTrip(tripId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const tasks = await this.prisma.task.findMany({
      where: { tripId },
      include: {
        creator: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((t: any) => this.formatTask(t));
  }

  async listTasksByAssignee(tripId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const tasks = await this.prisma.task.findMany({
      where: {
        tripId,
        assignedTo: userId,
      },
      include: {
        creator: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return tasks.map((t: any) => this.formatTask(t));
  }

  async updateTask(
    tripId: string,
    taskId: string,
    userId: string,
    dto: UpdateTaskDto,
  ) {
    await this.verifyTripMembership(tripId, userId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.tripId !== tripId) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status as any,
        assignedTo: dto.assignedTo,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        creator: true,
      },
    });

    return this.formatTask(updated);
  }

  async deleteTask(tripId: string, taskId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.tripId !== tripId) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true };
  }

  private async verifyTripMembership(tripId: string, userId: string) {
    const membership = await this.prisma.tripRole.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this trip');
    }
  }

  private formatTask(task: any) {
    return {
      id: task.id,
      tripId: task.tripId,
      title: task.title,
      description: task.description,
      creatorId: task.creatorId,
      creator: task.creator ? { id: task.creator.id, name: task.creator.name } : null,
      assignedTo: task.assignedTo,
      status: task.status,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
