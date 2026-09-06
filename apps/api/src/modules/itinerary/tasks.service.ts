import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dtos/task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async createTask(tripId: string, userId: string, dto: CreateTaskDto) {
    const membership = await this.verifyTripMembership(tripId, userId);
    if (!['OWNER', 'ADMIN', 'MEMBER'].includes(membership.role)) {
      throw new ForbiddenException('Guests cannot create tasks');
    }

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

    return {
      ...this.formatTask(task),
      priority: dto.priority || 'MEDIUM',
    };
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
    const membership = await this.verifyTripMembership(tripId, userId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.tripId !== tripId) {
      throw new NotFoundException('Task not found');
    }

    const isCreator = task.creatorId === userId;
    const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(membership.role);

    // If modifying core task details (title, description, assignedTo, dueDate), must be creator or admin/owner
    const isModifyingDetails =
      dto.title !== undefined ||
      dto.description !== undefined ||
      dto.assignedTo !== undefined ||
      dto.dueDate !== undefined;

    if (isModifyingDetails && !isCreator && !isOwnerOrAdmin) {
      throw new ForbiddenException(
        'Only the task creator, trip owner, or admins can edit task details',
      );
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

    return {
      ...this.formatTask(updated),
      priority: dto.priority || (task as any).priority || 'MEDIUM',
    };
  }

  async deleteTask(tripId: string, taskId: string, userId: string) {
    const membership = await this.verifyTripMembership(tripId, userId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.tripId !== tripId) {
      throw new NotFoundException('Task not found');
    }

    const isCreator = task.creatorId === userId;
    const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(membership.role);

    if (!isCreator && !isOwnerOrAdmin) {
      throw new ForbiddenException(
        'Only the task creator, trip owner, or admins can delete tasks',
      );
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true, message: 'Task deleted successfully' };
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

    return membership;
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
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
