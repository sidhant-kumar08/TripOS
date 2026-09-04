import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.sub);
  }
}
