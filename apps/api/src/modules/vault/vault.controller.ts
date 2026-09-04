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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VaultService } from './vault.service';
import { UploadFileDto, UpdateFileDto } from './dtos/vault.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('vault')
@Controller('trips/:tripId/vault')
export class VaultController {
  constructor(private vaultService: VaultService) {}

  @Post('files')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a file to trip vault' })
  async uploadFile(
    @Param('tripId') tripId: string,
    @Req() req: any,
    @Body() dto: UploadFileDto,
  ) {
    // Note: File upload via multipart/form-data requires middleware configuration
    // For MVP, we'll accept file metadata and store file reference
    return this.vaultService.uploadFile(tripId, req.user.sub, dto);
  }

  @Get('files')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all files in trip vault' })
  async listFiles(@Param('tripId') tripId: string, @Req() req: any) {
    return this.vaultService.listFiles(tripId, req.user.sub);
  }

  @Get('files/:fileId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get file details' })
  async getFile(
    @Param('tripId') tripId: string,
    @Param('fileId') fileId: string,
    @Req() req: any,
  ) {
    return this.vaultService.getFile(tripId, fileId, req.user.sub);
  }

  @Put('files/:fileId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update file (rename)' })
  async updateFile(
    @Param('tripId') tripId: string,
    @Param('fileId') fileId: string,
    @Req() req: any,
    @Body() dto: UpdateFileDto,
  ) {
    return this.vaultService.updateFile(tripId, fileId, req.user.sub, dto);
  }

  @Delete('files/:fileId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(
    @Param('tripId') tripId: string,
    @Param('fileId') fileId: string,
    @Req() req: any,
  ) {
    return this.vaultService.deleteFile(tripId, fileId, req.user.sub);
  }
}
